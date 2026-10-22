/**
 * CodeAlpha E-Commerce Store - Order Confirmation Page Logic
 */

const OrderSuccess = {
  async init() {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('orderId');

    if (!orderNumber) {
      window.location.href = '/';
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();

      if (!data.success || !data.order) {
        document.getElementById('orderSuccessContent').innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Order Not Found</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Could not locate details for reference #${orderNumber}.</p>
            <a href="/" class="btn btn-primary">Return to Store</a>
          </div>
        `;
        return;
      }

      this.renderOrder(data.order);
    } catch (e) {
      console.error('Error fetching order receipt:', e);
    }
  },

  renderOrder(order) {
    document.getElementById('orderNumberDisplay').textContent = order.order_number;
    document.getElementById('orderDateDisplay').textContent = new Date(order.created_at).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Estimate delivery date: 3-5 days from order
    const deliveryDate = new Date(new Date(order.created_at).getTime() + (4 * 24 * 60 * 60 * 1000));
    document.getElementById('deliveryEstimateDisplay').textContent = deliveryDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    document.getElementById('orderCustomerName').textContent = order.customer_name;
    document.getElementById('orderCustomerEmail').textContent = order.customer_email;
    document.getElementById('orderCustomerPhone').textContent = order.customer_phone;
    document.getElementById('orderShippingAddress').textContent = `${order.shipping_address}, ${order.city} ${order.postal_code}`;
    document.getElementById('orderPaymentMethod').textContent = order.payment_method;

    // Items List
    const itemsContainer = document.getElementById('receiptItemsList');
    if (itemsContainer && Array.isArray(order.items)) {
      itemsContainer.innerHTML = order.items.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid var(--border-subtle); gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <img src="${item.product_image}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm); background: #f1f5f9;">
            <div>
              <div style="font-weight: 600; font-size: 0.9375rem; color: var(--text-main);">${item.product_name}</div>
              <div style="font-size: 0.8125rem; color: var(--text-muted);">${Store.formatMoney(item.price)} × ${item.quantity} unit${item.quantity > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style="font-weight: 700; color: var(--text-main);">${Store.formatMoney(item.total)}</div>
        </div>
      `).join('');
    }

    // Totals
    document.getElementById('receiptSubtotal').textContent = Store.formatMoney(order.subtotal);
    
    const discRow = document.getElementById('receiptDiscountRow');
    if (order.discount > 0) {
      discRow.style.display = 'flex';
      document.getElementById('receiptDiscount').textContent = `-${Store.formatMoney(order.discount)}`;
    } else {
      discRow.style.display = 'none';
    }

    document.getElementById('receiptShipping').innerHTML = order.shipping_fee === 0
      ? '<span style="color:var(--success); font-weight:700;">FREE</span>'
      : Store.formatMoney(order.shipping_fee);

    document.getElementById('receiptTax').textContent = Store.formatMoney(order.tax);
    document.getElementById('receiptTotal').textContent = Store.formatMoney(order.total);

    // Track Button Link
    const trackBtn = document.getElementById('trackOrderBtn');
    if (trackBtn) {
      trackBtn.href = `/orders?lookup=${encodeURIComponent(order.order_number)}`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OrderSuccess.init();
});
