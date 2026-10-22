/**
 * CodeAlpha E-Commerce Store - Catalog & Filtering JS
 */

const Catalog = {
  state: {
    category: 'All',
    search: '',
    sort: 'featured',
    maxPrice: 500,
    products: [],
    loading: false
  },

  init() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('category')) this.state.category = urlParams.get('category');
    if (urlParams.has('search')) this.state.search = urlParams.get('search');
    if (urlParams.has('sort')) this.state.sort = urlParams.get('sort');

    this.bindEvents();
    this.loadCategories();
    this.fetchProducts();
  },

  bindEvents() {
    // Sort Select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.value = this.state.sort;
      sortSelect.addEventListener('change', (e) => {
        this.state.sort = e.target.value;
        this.fetchProducts();
      });
    }

    // Catalog Search Input
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
      if (this.state.search) searchInput.value = this.state.search;
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.state.search = e.target.value.trim();
          this.fetchProducts();
        }, 300);
      });
    }

    // Price Filter
    const priceRange = document.getElementById('priceRange');
    const priceDisplay = document.getElementById('priceRangeDisplay');
    if (priceRange && priceDisplay) {
      priceRange.addEventListener('input', (e) => {
        this.state.maxPrice = Number(e.target.value);
        priceDisplay.textContent = `$${this.state.maxPrice}`;
      });
      priceRange.addEventListener('change', () => {
        this.fetchProducts();
      });
    }

    // Reset Filters Button
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.state.category = 'All';
        this.state.search = '';
        this.state.sort = 'featured';
        this.state.maxPrice = 500;
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'featured';
        if (priceRange) priceRange.value = 500;
        if (priceDisplay) priceDisplay.textContent = '$500';
        this.updateActiveCategoryPill();
        this.fetchProducts();
      });
    }
  },

  async loadCategories() {
    const pillsContainer = document.getElementById('categoryPills');
    if (!pillsContainer) return;

    try {
      const res = await fetch('/api/products/categories');
      const data = await res.json();

      if (data.success && data.categories) {
        let html = `
          <button type="button" class="category-pill ${this.state.category === 'All' ? 'active' : ''}" data-cat="All">
            All Products
          </button>
        `;

        data.categories.forEach(c => {
          const isActive = this.state.category.toLowerCase() === c.category.toLowerCase();
          html += `
            <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-cat="${c.category}">
              ${c.category} <span style="opacity: 0.6; font-size: 0.75rem;">(${c.count})</span>
            </button>
          `;
        });

        pillsContainer.innerHTML = html;

        // Attach event listeners
        pillsContainer.querySelectorAll('.category-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.category = btn.getAttribute('data-cat');
            this.fetchProducts();
          });
        });
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  },

  updateActiveCategoryPill() {
    const pillsContainer = document.getElementById('categoryPills');
    if (!pillsContainer) return;
    pillsContainer.querySelectorAll('.category-pill').forEach(btn => {
      if (btn.getAttribute('data-cat') === this.state.category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  async fetchProducts() {
    const grid = document.getElementById('productGrid');
    const countEl = document.getElementById('resultsCount');
    if (!grid) return;

    this.state.loading = true;
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9375rem;">Loading premium products...</p>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    try {
      const params = new URLSearchParams();
      if (this.state.category && this.state.category !== 'All') {
        params.append('category', this.state.category);
      }
      if (this.state.search) {
        params.append('search', this.state.search);
      }
      if (this.state.sort) {
        params.append('sort', this.state.sort);
      }
      if (this.state.maxPrice < 500) {
        params.append('max_price', this.state.maxPrice);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        this.state.products = data.products;
        if (countEl) {
          countEl.textContent = `Showing ${data.total} item${data.total === 1 ? '' : 's'}`;
        }
        this.renderProducts(data.products);
      } else {
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--danger);">Failed to load products.</p>`;
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
      grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--danger);">Network error loading catalog.</p>`;
    } finally {
      this.state.loading = false;
    }
  },

  renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: white; border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
          <svg width="56" height="56" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--text-light);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No products found</h3>
          <p style="color: var(--text-muted); font-size: 0.9375rem; margin-bottom: 1.5rem;">Try adjusting your search criteria or resetting filters.</p>
          <button type="button" class="btn btn-primary btn-sm" id="emptyResetBtn">Reset All Filters</button>
        </div>
      `;
      document.getElementById('emptyResetBtn')?.addEventListener('click', () => {
        document.getElementById('resetFiltersBtn')?.click();
      });
      return;
    }

    grid.innerHTML = products.map(product => {
      // Determine badge class
      let badgeClass = 'badge-essential';
      if (product.badge) {
        const lower = product.badge.toLowerCase();
        if (lower.includes('sale')) badgeClass = 'badge-sale';
        else if (lower.includes('new')) badgeClass = 'badge-new';
        else if (lower.includes('best')) badgeClass = 'badge-bestseller';
        else if (lower.includes('rated')) badgeClass = 'badge-toprated';
      }

      // Generate stars
      const fullStars = Math.floor(product.rating);
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          starsHtml += `<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
        } else {
          starsHtml += `<svg width="14" height="14" fill="#cbd5e1" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
        }
      }

      return `
        <div class="product-card" data-id="${product.id}">
          <a href="/product?id=${product.id}" class="card-media">
            ${product.badge ? `<span class="card-badge ${badgeClass}">${product.badge}</span>` : ''}
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <span class="card-stock-pill">${product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}</span>
          </a>

          <div class="card-body">
            <div class="card-category">${product.category}</div>
            <h3 class="card-title">
              <a href="/product?id=${product.id}">${product.name}</a>
            </h3>

            <div class="card-rating">
              <div class="stars">${starsHtml}</div>
              <span class="rating-score">${product.rating}</span>
              <span class="rating-count">(${product.reviews_count})</span>
            </div>

            <div class="card-footer">
              <div class="card-price-wrap">
                <span class="card-price">${Store.formatMoney(product.price)}</span>
                ${product.compare_at_price ? `<span class="card-price-old">${Store.formatMoney(product.compare_at_price)}</span>` : ''}
              </div>

              <button type="button" class="add-cart-btn" title="Add to Cart" onclick="Catalog.handleAddToCart(${product.id}, event)">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  handleAddToCart(productId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const product = this.state.products.find(p => p.id === productId);
    if (product) {
      Store.addToCart(product, 1);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Catalog.init();
});
