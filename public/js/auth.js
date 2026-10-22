/**
 * CodeAlpha E-Commerce Store - Auth Page Logic (Login & Registration)
 */

const AuthPage = {
  currentTab: 'login',

  init() {
    this.bindEvents();

    // Check if user already logged in
    const user = Store.getUser();
    if (user) {
      window.location.href = '/orders';
    }
  },

  bindEvents() {
    // Tab switching
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabLogin?.addEventListener('click', () => {
      this.currentTab = 'login';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    });

    tabRegister?.addEventListener('click', () => {
      this.currentTab = 'register';
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
    });

    // 1-Click Demo Account Fill
    document.getElementById('fillDemoBtn')?.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'demo@example.com';
      document.getElementById('loginPassword').value = 'password123';
      Store.showToast('Demo credentials filled: demo@example.com', 'info');
    });

    // Login Form Submit
    loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

    // Register Form Submit
    registerForm?.addEventListener('submit', (e) => this.handleRegister(e));
  },

  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn');
    const originalText = btn.innerHTML;

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      Store.showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML = 'Signing in...';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Store.showToast(data.message || 'Login failed', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
      }

      Store.setAuth(data.user, data.token);
      Store.showToast(`Welcome back, ${data.user.name}!`, 'success');

      // Check if redirect intended
      setTimeout(() => {
        const cart = Store.getCart();
        if (cart.length > 0) {
          window.location.href = '/checkout';
        } else {
          window.location.href = '/';
        }
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      Store.showToast('Network error during login.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerSubmitBtn');
    const originalText = btn.innerHTML;

    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const phone = document.getElementById('regPhone')?.value.trim();
    const address = document.getElementById('regAddress')?.value.trim();

    if (!name || !email || !password) {
      Store.showToast('Name, email, and password are required.', 'error');
      return;
    }

    if (password.length < 6) {
      Store.showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML = 'Creating Account...';

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, address })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Store.showToast(data.message || 'Registration failed', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
      }

      Store.setAuth(data.user, data.token);
      Store.showToast(`Account created! Welcome, ${data.user.name}!`, 'success');

      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (err) {
      console.error('Registration error:', err);
      Store.showToast('Network error during registration.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuthPage.init();
});
