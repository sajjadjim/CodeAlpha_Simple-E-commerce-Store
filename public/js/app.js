/**
 * CodeAlpha E-Commerce Store - Core Application JS
 * Manages Cart state, Auth state, Drawer, Notifications, and Common Components
 */

const Store = {
  // Format currency helper
  formatMoney(amount) {
    return '$' + Number(amount || 0).toFixed(2);
  },

  // -------------------------------------------------------------
  // Cart Management
  // -------------------------------------------------------------
  getCart() {
    try {
      const cart = localStorage.getItem('codealpha_cart');
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error('Failed to parse cart:', e);
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem('codealpha_cart', JSON.stringify(cart));
    this.updateCartUI();
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
  },

  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += Number(quantity);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: Number(quantity)
      });
    }

    this.saveCart(cart);
    this.showToast(`Added "${product.name}" to your cart!`, 'success');
    this.openCartDrawer();
  },

  updateCartQty(productId, newQty) {
    let cart = this.getCart();
    const qty = parseInt(newQty, 10);
    if (qty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const item = cart.find(i => i.id === productId);
    if (item) {
      item.quantity = qty;
      this.saveCart(cart);
    }
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);
    this.showToast('Item removed from cart', 'info');
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartTotals() {
    const cart = this.getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Check coupon in session/storage
    const coupon = this.getAppliedCoupon();
    let discount = 0;
    if (coupon) {
      if (coupon.code === 'ALPHA10') discount = subtotal * 0.10;
      if (coupon.code === 'WELCOME15') discount = subtotal * 0.15;
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping = discountedSubtotal >= 100 || discountedSubtotal === 0 ? 0 : 9.99;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;

    return {
      count,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      isFreeShipping: discountedSubtotal >= 100
    };
  },

  getAppliedCoupon() {
    try {
      const c = sessionStorage.getItem('codealpha_coupon');
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  },

  applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode === 'ALPHA10') {
      const c = { code: 'ALPHA10', percent: 10 };
      sessionStorage.setItem('codealpha_coupon', JSON.stringify(c));
      this.updateCartUI();
      return { success: true, message: 'Coupon ALPHA10 applied (10% off)!' };
    } else if (cleanCode === 'WELCOME15') {
      const c = { code: 'WELCOME15', percent: 15 };
      sessionStorage.setItem('codealpha_coupon', JSON.stringify(c));
      this.updateCartUI();
      return { success: true, message: 'Coupon WELCOME15 applied (15% off)!' };
    } else {
      return { success: false, message: 'Invalid promo code. Try "ALPHA10" or "WELCOME15"' };
    }
  },

  removeCoupon() {
    sessionStorage.removeItem('codealpha_coupon');
    this.updateCartUI();
  },

  // -------------------------------------------------------------
  // User Authentication State
  // -------------------------------------------------------------
  getUser() {
    try {
      const user = localStorage.getItem('codealpha_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('codealpha_token') || null;
  },

  setAuth(user, token) {
    if (user && token) {
      localStorage.setItem('codealpha_user', JSON.stringify(user));
      localStorage.setItem('codealpha_token', token);
    } else {
      localStorage.removeItem('codealpha_user');
      localStorage.removeItem('codealpha_token');
    }
    this.updateAuthUI();
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout endpoint call:', e);
    }
    this.setAuth(null, null);
    this.showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  },

  // -------------------------------------------------------------
  // Slide-out Cart Drawer Logic
  // -------------------------------------------------------------
  initDrawer() {
    // Inject Drawer Markup into DOM if not present
    if (!document.getElementById('cartDrawerOverlay')) {
      const drawerHTML = `
        <div class="cart-drawer-overlay" id="cartDrawerOverlay">
          <div class="cart-drawer" id="cartDrawer">
            <div class="drawer-header">
              <div class="drawer-title">Shopping Cart</div>
              <button class="close-btn" id="closeDrawerBtn" aria-label="Close cart">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div class="drawer-body" id="drawerBody">
              <!-- Cart Items Rendered Here -->
            </div>
            <div class="drawer-footer" id="drawerFooter">
              <!-- Footer / Checkout Rendered Here -->
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', drawerHTML);

      const overlay = document.getElementById('cartDrawerOverlay');
      const closeBtn = document.getElementById('closeDrawerBtn');

      closeBtn.addEventListener('click', () => this.closeCartDrawer());
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCartDrawer();
      });
    }

    // Attach click listeners to all open-cart buttons
    document.querySelectorAll('.open-cart-btn, #headerCartBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCartDrawer();
      });
    });
  },

  openCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      this.renderDrawerContent();
    }
  },

  closeCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  renderDrawerContent() {
    const bodyEl = document.getElementById('drawerBody');
    const footerEl = document.getElementById('drawerFooter');
    if (!bodyEl || !footerEl) return;

    const cart = this.getCart();
    const totals = this.getCartTotals();

    if (cart.length === 0) {
      bodyEl.innerHTML = `
        <div class="cart-empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">Your cart is empty</h3>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Discover great deals on our top products!</p>
          <a href="/#catalog" class="btn btn-primary btn-sm" onclick="Store.closeCartDrawer()">Start Shopping</a>
        </div>
      `;
      footerEl.innerHTML = '';
      return;
    }

    // Render items list
    bodyEl.innerHTML = `
      <div class="cart-items-list">
        ${cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
              <div>
                <a href="/product?id=${item.id}" class="cart-item-name">${item.name}</a>
                <div class="cart-item-price">${this.formatMoney(item.price)}</div>
              </div>
              <div class="cart-item-actions">
                <div class="cart-item-qty">
                  <button type="button" onclick="Store.updateCartQty(${item.id}, ${item.quantity - 1})">-</button>
                  <span>${item.quantity}</span>
                  <button type="button" onclick="Store.updateCartQty(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button type="button" class="cart-item-remove" onclick="Store.removeFromCart(${item.id})">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Free shipping progress calculation ($100 goal)
    const neededForFree = Math.max(0, 100 - totals.subtotal);
    const progressPercent = Math.min(100, (totals.subtotal / 100) * 100);

    footerEl.innerHTML = `
      <div class="free-shipping-progress">
        <div class="progress-text">
          <span>${totals.isFreeShipping ? '🎉 Free shipping unlocked!' : `Add ${this.formatMoney(neededForFree)} more for Free Shipping`}</span>
          <span>${Math.round(progressPercent)}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <div class="summary-row">
        <span>Subtotal</span>
        <span style="font-weight: 700;">${this.formatMoney(totals.subtotal)}</span>
      </div>

      ${totals.discount > 0 ? `
        <div class="summary-row" style="color: var(--success);">
          <span>Promo Discount</span>
          <span>-${this.formatMoney(totals.discount)}</span>
        </div>
      ` : ''}

      <div class="summary-row">
        <span>Estimated Shipping</span>
        <span>${totals.shipping === 0 ? '<strong style="color:var(--success)">FREE</strong>' : this.formatMoney(totals.shipping)}</span>
      </div>

      <div class="summary-row total-row">
        <span>Estimated Total</span>
        <span style="color: var(--primary);">${this.formatMoney(totals.total)}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.25rem;">
        <a href="/checkout" class="btn btn-primary btn-block">
          Proceed to Checkout
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
        <a href="/cart" class="btn btn-outline btn-block" onclick="Store.closeCartDrawer()">View Full Cart</a>
      </div>
    `;
  },

  updateCartUI() {
    const totals = this.getCartTotals();
    // Update badge in header
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = totals.count;
    });

    // Update total preview pill if exists
    document.querySelectorAll('.cart-total-pill').forEach(el => {
      el.textContent = this.formatMoney(totals.total);
    });

    // Re-render drawer if open
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay && overlay.classList.contains('open')) {
      this.renderDrawerContent();
    }
  },

  // -------------------------------------------------------------
  // User Authentication UI Header Sync
  // -------------------------------------------------------------
  updateAuthUI() {
    const user = this.getUser();
    const userSlot = document.getElementById('userNavSlot');
    if (!userSlot) return;

    if (user) {
      userSlot.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <a href="/orders" class="user-menu-btn" title="View Orders">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span>${user.name.split(' ')[0]}</span>
          </a>
          <button type="button" class="btn btn-outline btn-sm" onclick="Store.logout()" title="Logout" style="padding: 0.45rem 0.65rem;">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      `;
    } else {
      userSlot.innerHTML = `
        <a href="/login" class="user-menu-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
          <span>Sign In</span>
        </a>
      `;
    }
  },

  // -------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 20);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // -------------------------------------------------------------
  // Initializer
  // -------------------------------------------------------------
  init() {
    this.initDrawer();
    this.updateCartUI();
    this.updateAuthUI();

    // Sticky header shadow on scroll
    const header = document.querySelector('.site-header');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }

    // Global Search Submission
    const searchForm = document.getElementById('globalSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input && input.value.trim()) {
          const query = encodeURIComponent(input.value.trim());
          if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            const filterInput = document.getElementById('catalogSearchInput');
            if (filterInput) {
              filterInput.value = input.value.trim();
              filterInput.dispatchEvent(new Event('input'));
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            window.location.href = `/?search=${query}#catalog`;
          }
        }
      });
    }
  }
};

// Auto boot on DOM load
document.addEventListener('DOMContentLoaded', () => {
  Store.init();
});
