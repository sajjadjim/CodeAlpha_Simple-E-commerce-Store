/**
 * CodeAlpha E-Commerce Store - Dedicated Cart Page Logic
 */

const CartPage = {
  init() {
    this.render();
    this.bindEvents();

    window.addEventListener('cart:updated', () => {
      this.render();
    });
  },

  bindEvents() {
    // Promo Code Application
    document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
      const input = document.getElementById('couponInput');
      if (!input || !input.value.trim()) {
        Store.showToast('Please enter a coupon code', 'info');
        return;
      }

      const res = Store.applyCoupon(input.value.trim());
      if (res.success) {
        Store.showToast(res.message, 'success');
        input.value = '';
        this.render();
      } else {
        Store.showToast(res.message, 'error');
      }
    });

    // Clear Cart
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all items from your cart?')) {
        Store.clearCart();
        this.render();
      }
    });
  },

  render() {
    const cart = Store.getCart();
    const totals = Store.getCartTotals();
    const container = document.getElementById('cartItemsTableBody');
    const emptyState = document.getElementById('cartEmptyView');
    const contentView = document.getElementById('cartContentView');

    if (!container || !emptyState || !contentView) return;

    if (cart.length === 0) {
      emptyState.style.display = 'block';
      contentView.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    contentView.style.display = 'grid';

    // Render table rows
    container.innerHTML = cart.map(item => `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 1.25rem 0.5rem; display: flex; align-items: center; gap: 1rem;">
          <img src="${item.image}" alt="${item.name}" style="width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-md); background: #f1f5f9;">
          <div>
            <a href="/product?id=${item.id}" style="font-weight: 700; color: var(--text-main); font-size: 0.9375rem;">${item.name}</a>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.2rem;">${item.category}</div>
          </div>
        </td>
        <td style="padding: 1.25rem 0.5rem; font-weight: 600; color: var(--text-main); vertical-align: middle;">
          ${Store.formatMoney(item.price)}
        </td>
        <td style="padding: 1.25rem 0.5rem; vertical-align: middle;">
          <div class="cart-item-qty" style="width: fit-content;">
            <button type="button" onclick="Store.updateCartQty(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button type="button" onclick="Store.updateCartQty(${item.id}, ${item.quantity + 1})">+</button>
          </div>
        </td>
        <td style="padding: 1.25rem 0.5rem; font-weight: 700; color: var(--primary); vertical-align: middle;">
          ${Store.formatMoney(item.price * item.quantity)}
        </td>
        <td style="padding: 1.25rem 0.5rem; text-align: right; vertical-align: middle;">
          <button type="button" class="btn btn-outline btn-sm" onclick="Store.removeFromCart(${item.id})" title="Remove item" style="color: var(--danger); border-color: var(--border-subtle);">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');

    // Update Totals Summary
    document.getElementById('summarySubtotal').textContent = Store.formatMoney(totals.subtotal);
    
    // Promo row
    const discountRow = document.getElementById('summaryDiscountRow');
    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('summaryDiscount').textContent = `-${Store.formatMoney(totals.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }

    // Shipping
    const shippingEl = document.getElementById('summaryShipping');
    if (totals.shipping === 0) {
      shippingEl.innerHTML = '<span style="color: var(--success); font-weight: 700;">FREE</span>';
    } else {
      shippingEl.textContent = Store.formatMoney(totals.shipping);
    }

    // Tax
    document.getElementById('summaryTax').textContent = Store.formatMoney(totals.tax);

    // Final Total
    document.getElementById('summaryTotal').textContent = Store.formatMoney(totals.total);

    // Free Shipping Progress
    const freeBar = document.getElementById('pageShippingBar');
    const freeText = document.getElementById('pageShippingText');
    if (freeBar && freeText) {
      const needed = Math.max(0, 100 - totals.subtotal);
      const pct = Math.min(100, (totals.subtotal / 100) * 100);
      freeBar.style.width = `${pct}%`;
      freeText.textContent = totals.isFreeShipping 
        ? '🎉 Congratulations! You have unlocked FREE Express Delivery!' 
        : `Add ${Store.formatMoney(needed)} more to qualify for FREE Shipping!`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CartPage.init();
});
