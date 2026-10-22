/**
 * CodeAlpha E-Commerce Store - Orders Tracking & History Logic
 */

const OrdersPage = {
  async init() {
    this.bindEvents();

    const params = new URLSearchParams(window.location.search);
    const lookupNumber = params.get('lookup');

    if (lookupNumber) {
      document.getElementById('orderSearchInput').value = lookupNumber;
      this.lookupOrder(lookupNumber);
    } else {
      const user = Store.getUser();
      if (user) {
        this.loadUserOrders();
      }
    }
  },

  bindEvents() {
    // Search Order Form
    const searchForm = document.getElementById('orderLookupForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('orderSearchInput');
        if (input && input.value.trim()) {
          this.lookupOrder(input.value.trim());
        }
      });
    }
  },

  async lookupOrder(orderNumber) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 0.75rem; color: var(--text-muted);">Looking up order ${orderNumber}...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
      const data = await res.json();

      if (!data.success || !data.order) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem 1rem; background: white; border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--text-light);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No Order Found</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem;">We couldn't find an order matching reference "${orderNumber}". Please double check your order number.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = this.renderOrderCard(data.order, true);
    } catch (e) {
      console.error('Error looking up order:', e);
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 2rem;">Error retrieving order details.</p>`;
    }
  },

  async loadUserOrders() {
    const container = document.getElementById('ordersContainer');
    const headerTitle = document.getElementById('ordersPageTitle');
    const token = Store.getToken();
    if (!token || !container) return;

    if (headerTitle) {
      const user = Store.getUser();
      headerTitle.textContent = `My Orders (${user.name})`;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 0.75rem; color: var(--text-muted);">Loading your order history...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.orders) || data.orders.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem; background: white; border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
            <svg width="56" height="56" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--text-light);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No orders yet</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem; margin-bottom: 1.5rem;">You haven't placed any orders with this account yet.</p>
            <a href="/#catalog" class="btn btn-primary">Start Shopping</a>
          </div>
        `;
        return;
      }

      container.innerHTML = data.orders.map(order => this.renderOrderCard(order)).join('');
    } catch (e) {
      console.error('Error loading user orders:', e);
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 2rem;">Error retrieving order history.</p>`;
    }
  },

  renderOrderCard(order, isSingleLookup = false) {
    const dateFormatted = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Tracking timeline computation
    // Stages: Placed -> Processing -> Shipped -> Delivered
    let step1Class = 'completed';
    let step2Class = 'active';
    let step3Class = '';
    let step4Class = '';

    const s = (order.status || '').toLowerCase();
    if (s === 'processing') {
      step1Class = 'completed';
      step2Class = 'active';
    } else if (s === 'shipped') {
      step1Class = 'completed';
      step2Class = 'completed';
      step3Class = 'active';
    } else if (s === 'delivered') {
      step1Class = 'completed';
      step2Class = 'completed';
      step3Class = 'completed';
      step4Class = 'completed';
    } else if (s === 'cancelled') {
      step1Class = 'completed';
      step2Class = '';
    }

    let statusBadgeColor = 'var(--primary)';
    let statusBadgeBg = 'var(--primary-light)';
    if (s === 'delivered') {
      statusBadgeColor = 'var(--success)';
      statusBadgeBg = 'var(--success-bg)';
    } else if (s === 'cancelled') {
      statusBadgeColor = 'var(--danger)';
      statusBadgeBg = 'var(--danger-bg)';
    }

    return `
      <div style="background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; margin-bottom: 2rem; box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
          <div>
            <div style="font-size: 0.8125rem; color: var(--text-muted);">ORDER REFERENCE</div>
            <div style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--secondary);">${order.order_number}</div>
            <div style="font-size: 0.8125rem; color: var(--text-light);">${dateFormatted}</div>
          </div>

          <div style="text-align: right;">
            <div style="display: inline-block; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.8125rem; font-weight: 700; background: ${statusBadgeBg}; color: ${statusBadgeColor};">
              ● ${order.status}
            </div>
            <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--secondary); margin-top: 0.25rem;">
              ${Store.formatMoney(order.total)}
            </div>
          </div>
        </div>

        ${s !== 'cancelled' ? `
          <!-- Order Tracker Progress -->
          <div class="order-tracker">
            <div class="tracker-step ${step1Class}">
              <div class="step-bubble">✓</div>
              <div class="step-label">Order Placed</div>
            </div>
            <div class="tracker-step ${step2Class}">
              <div class="step-bubble">2</div>
              <div class="step-label">Processing</div>
            </div>
            <div class="tracker-step ${step3Class}">
              <div class="step-bubble">3</div>
              <div class="step-label">Shipped</div>
            </div>
            <div class="tracker-step ${step4Class}">
              <div class="step-bubble">4</div>
              <div class="step-label">Delivered</div>
            </div>
          </div>
        ` : `
          <div style="padding: 1rem; background: var(--danger-bg); border-radius: var(--radius-md); color: var(--danger); font-size: 0.875rem; font-weight: 600; margin: 1.5rem 0; text-align: center;">
            This order has been cancelled and any reserved items have been restocked.
          </div>
        `}

        <!-- Items in this Order -->
        <div style="margin-top: 1.5rem;">
          <h4 style="font-size: 0.9375rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-main);">Items in this order:</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${(order.items || []).map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: #f8fafc; border-radius: var(--radius-md); gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <img src="${item.product_image}" alt="${item.product_name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-main);">${item.product_name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${Store.formatMoney(item.price)} × ${item.quantity}</div>
                  </div>
                </div>
                <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-main);">${Store.formatMoney(item.total)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8125rem; color: var(--text-muted);">
            Delivering to: <strong style="color: var(--text-main);">${order.shipping_address}, ${order.city}</strong>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <a href="/order-success.html?orderId=${encodeURIComponent(order.order_number)}" class="btn btn-outline btn-sm">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              View Receipt
            </a>

            ${order.status === 'Processing' ? `
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--border-subtle);" onclick="OrdersPage.cancelOrder('${order.order_number}')">
                Cancel Order
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async cancelOrder(orderNumber) {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) {
      return;
    }

    try {
      const token = Store.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${orderNumber}/cancel`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (data.success) {
        Store.showToast('Order cancelled successfully', 'info');
        const user = Store.getUser();
        if (user) {
          this.loadUserOrders();
        } else {
          this.lookupOrder(orderNumber);
        }
      } else {
        Store.showToast(data.message || 'Failed to cancel order.', 'error');
      }
    } catch (e) {
      console.error('Error cancelling order:', e);
      Store.showToast('Network error cancelling order.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OrdersPage.init();
});
