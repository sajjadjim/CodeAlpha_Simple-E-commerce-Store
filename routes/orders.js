const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Helper to generate unique order number like ORD-734892
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}${random}`;
}

// POST /api/orders - Process new order
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      postal_code,
      payment_method,
      items,
      coupon_code
    } = req.body;

    // Validation
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !postal_code) {
      return res.status(400).json({ success: false, message: 'Please provide all required shipping contact information.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Verify products and calculate amounts accurately on server
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT id, name, price, stock, image FROM products WHERE id = ?').get(item.id);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ID #${item.id} is no longer available.` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${product.name}.` });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of "${product.name}" are in stock. Please adjust your cart.`
        });
      }

      const itemTotal = Math.round(product.price * qty * 100) / 100;
      subtotal += itemTotal;

      verifiedItems.push({
        product_id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty,
        total: itemTotal
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Coupon logic
    let discount = 0;
    if (coupon_code) {
      const code = coupon_code.trim().toUpperCase();
      if (code === 'ALPHA10') {
        discount = Math.round(subtotal * 0.10 * 100) / 100;
      } else if (code === 'WELCOME15') {
        discount = Math.round(subtotal * 0.15 * 100) / 100;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    // Free shipping over $100, otherwise $9.99
    const shipping_fee = discountedSubtotal >= 100 ? 0 : 9.99;
    const tax = Math.round(discountedSubtotal * 0.08 * 100) / 100; // 8% tax
    const total = Math.round((discountedSubtotal + shipping_fee + tax) * 100) / 100;

    const orderNumber = generateOrderNumber();
    const userId = req.user ? req.user.id : null;

    // Database transaction to save order, order items, and deduct stock
    const createOrderTx = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          user_id, order_number, customer_name, customer_email, customer_phone,
          shipping_address, city, postal_code, payment_method,
          subtotal, discount, shipping_fee, tax, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing')
      `).run(
        userId,
        orderNumber,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        customer_phone.trim(),
        shipping_address.trim(),
        city.trim(),
        postal_code.trim(),
        payment_method || 'Cash on Delivery',
        subtotal,
        discount,
        shipping_fee,
        tax,
        total
      );

      const orderId = orderInsert.lastInsertRowid;

      const itemInsertStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_image, price, quantity, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const stockDeductStmt = db.prepare(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `);

      for (const item of verifiedItems) {
        itemInsertStmt.run(
          orderId,
          item.product_id,
          item.name,
          item.image,
          item.price,
          item.quantity,
          item.total
        );
        stockDeductStmt.run(item.quantity, item.product_id);
      }

      return orderId;
    });

    const newOrderId = createOrderTx();

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrderId);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        ...createdOrder,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: 'Failed to process order. Please try again.' });
  }
});

// GET /api/orders/my-orders - Logged in user order history
router.get('/my-orders', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT * FROM order_items WHERE order_id = ?
      `).all(order.id);
      return {
        ...order,
        items
      };
    });

    return res.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order history.' });
  }
});

// GET /api/orders/:identifier - Retrieve order details by ID or Order Number
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let order;

    if (!isNaN(Number(identifier))) {
      order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(identifier));
    } else {
      order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(identifier);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    return res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Error retrieving order:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order.' });
  }
});

// POST /api/orders/:orderNumber/cancel - Cancel an order if still Processing
router.post('/:orderNumber/cancel', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'Processing') {
      return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.status}` });
    }

    // Cancel order and restore stock
    const cancelTx = db.transaction(() => {
      db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(order.id);

      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
      const restoreStockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');

      for (const item of items) {
        restoreStockStmt.run(item.quantity, item.product_id);
      }
    });

    cancelTx();

    return res.json({ success: true, message: 'Order cancelled successfully and stock restored.' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

module.exports = router;
