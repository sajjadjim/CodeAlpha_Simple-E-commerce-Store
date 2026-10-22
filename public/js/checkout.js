/**
 * CodeAlpha E-Commerce Store - Checkout Logic
 */

const Checkout = {
  selectedPayment: 'Credit Card',

  init() {
    const cart = Store.getCart();
    if (cart.length === 0) {
      Store.showToast('Your cart is empty. Please add items before checking out.', 'info');
      setTimeout(() => {
        window.location.href = '/#catalog';
      }, 1000);
      return;
    }

    this.renderOrderSummary();
    this.populateUserData();
    this.bindEvents();
  },

  populateUserData() {
    const user = Store.getUser();
    if (user) {
      if (document.getElementById('custName') && user.name) document.getElementById('custName').value = user.name;
      if (document.getElementById('custEmail') && user.email) document.getElementById('custEmail').value = user.email;
      if (document.getElementById('custPhone') && user.phone) document.getElementById('custPhone').value = user.phone;
      if (document.getElementById('custAddress') && user.address) document.getElementById('custAddress').value = user.address;
    }
  },

  bindEvents() {
    // Payment Option Radios
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        paymentOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          this.selectedPayment = radio.value;
        }

        const ccFields = document.getElementById('creditCardFields');
        if (ccFields) {
          ccFields.style.display = this.selectedPayment === 'Credit Card' ? 'block' : 'none';
        }
      });
    });

    // 1-Click Autofill Helper Button
    document.getElementById('autofillBtn')?.addEventListener('click', () => {
      document.getElementById('custName').value = 'Alex Johnson';
      document.getElementById('custEmail').value = 'alex.johnson@example.com';
      document.getElementById('custPhone').value = '+1 (555) 438-9201';
      document.getElementById('custAddress').value = '742 Evergreen Terrace, Suite 100';
      document.getElementById('custCity').value = 'Springfield';
      document.getElementById('custPostal').value = '97477';
      Store.showToast('Shipping information autofilled!', 'info');
    });

    // Checkout Form Submission
    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  },

  renderOrderSummary() {
    const cart = Store.getCart();
    const totals = Store.getCartTotals();
    const listContainer = document.getElementById('checkoutItemsList');
    if (!listContainer) return;

    listContainer.innerHTML = cart.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.85rem; font-size: 0.875rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="position: relative;">
            <img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: var(--radius-sm); background: #f1f5f9;">
            <span style="position: absolute; top: -6px; right: -6px; background: var(--secondary); color: white; border-radius: 50%; font-size: 0.65rem; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-weight: 700;">${item.quantity}</span>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--text-main); line-height: 1.2;">${item.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.category}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: var(--text-main);">${Store.formatMoney(item.price * item.quantity)}</div>
      </div>
    `).join('');

    document.getElementById('checkoutSubtotal').textContent = Store.formatMoney(totals.subtotal);
    
    const discRow = document.getElementById('checkoutDiscountRow');
    if (totals.discount > 0) {
      discRow.style.display = 'flex';
      document.getElementById('checkoutDiscount').textContent = `-${Store.formatMoney(totals.discount)}`;
    } else {
      discRow.style.display = 'none';
    }

    document.getElementById('checkoutShipping').innerHTML = totals.shipping === 0 
      ? '<span style="color:var(--success); font-weight:700;">FREE</span>' 
      : Store.formatMoney(totals.shipping);

    document.getElementById('checkoutTax').textContent = Store.formatMoney(totals.tax);
    document.getElementById('checkoutTotal').textContent = Store.formatMoney(totals.total);
  },

  async handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('placeOrderBtn');
    const originalText = submitBtn.innerHTML;

    // Collect Data
    const customer_name = document.getElementById('custName')?.value.trim();
    const customer_email = document.getElementById('custEmail')?.value.trim();
    const customer_phone = document.getElementById('custPhone')?.value.trim();
    const shipping_address = document.getElementById('custAddress')?.value.trim();
    const city = document.getElementById('custCity')?.value.trim();
    const postal_code = document.getElementById('custPostal')?.value.trim();

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !postal_code) {
      Store.showToast('Please fill out all required shipping and contact fields.', 'error');
      return;
    }

    const cart = Store.getCart();
    if (cart.length === 0) {
      Store.showToast('Your cart is empty.', 'error');
      return;
    }

    const coupon = Store.getAppliedCoupon();

    const orderPayload = {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      postal_code,
      payment_method: this.selectedPayment,
      coupon_code: coupon ? coupon.code : null,
      items: cart.map(i => ({ id: i.id, quantity: i.quantity }))
    };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation: spin 0.8s linear infinite;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Processing Order...
      `;

      const headers = { 'Content-Type': 'application/json' };
      const token = Store.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Store.showToast(data.message || 'Failed to place order.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      // Success! Clear cart & coupon
      Store.clearCart();
      Store.removeCoupon();
      Store.showToast('Order confirmed successfully!', 'success');

      // Redirect to Order Success Page with order number
      setTimeout(() => {
        window.location.href = `/order-success.html?orderId=${encodeURIComponent(data.order.order_number)}`;
      }, 500);

    } catch (err) {
      console.error('Checkout error:', err);
      Store.showToast('Network error while processing your order.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Checkout.init();
});
