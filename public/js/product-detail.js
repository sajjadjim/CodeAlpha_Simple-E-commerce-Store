/**
 * CodeAlpha E-Commerce Store - Product Detail Page Logic
 */

const ProductDetail = {
  product: null,
  qty: 1,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const identifier = params.get('id') || params.get('slug');

    if (!identifier) {
      window.location.href = '/';
      return;
    }

    await this.loadProduct(identifier);
    this.bindEvents();
  },

  bindEvents() {
    // Quantity Decrement
    document.getElementById('detailQtyMinus')?.addEventListener('click', () => {
      if (this.qty > 1) {
        this.qty--;
        document.getElementById('detailQtyInput').value = this.qty;
      }
    });

    // Quantity Increment
    document.getElementById('detailQtyPlus')?.addEventListener('click', () => {
      const maxStock = this.product?.stock || 99;
      if (this.qty < maxStock) {
        this.qty++;
        document.getElementById('detailQtyInput').value = this.qty;
      } else {
        Store.showToast(`Only ${maxStock} items available in stock.`, 'info');
      }
    });

    // Add to Cart Button
    document.getElementById('detailAddToCartBtn')?.addEventListener('click', () => {
      if (!this.product) return;
      Store.addToCart(this.product, this.qty);
    });

    // Buy Now Button
    document.getElementById('detailBuyNowBtn')?.addEventListener('click', () => {
      if (!this.product) return;
      Store.addToCart(this.product, this.qty);
      window.location.href = '/checkout';
    });

    // Review submission mock
    document.getElementById('submitReviewBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const text = document.getElementById('reviewComment')?.value.trim();
      if (!text) {
        Store.showToast('Please type a comment for your review.', 'error');
        return;
      }
      Store.showToast('Thank you! Your verified review has been submitted for moderation.', 'success');
      document.getElementById('reviewComment').value = '';
    });
  },

  async loadProduct(identifier) {
    const container = document.getElementById('productDetailContent');
    if (!container) return;

    try {
      const res = await fetch(`/api/products/${identifier}`);
      const data = await res.json();

      if (!data.success || !data.product) {
        container.innerHTML = `
          <div style="text-align: center; padding: 5rem 1rem;">
            <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem;">Product Not Found</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">The item you are looking for may have been retired or moved.</p>
            <a href="/" class="btn btn-primary">Return to Catalog</a>
          </div>
        `;
        return;
      }

      this.product = data.product;
      this.renderProduct(data.product, data.related);
    } catch (e) {
      console.error('Error fetching product:', e);
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 4rem;">Network error loading product details.</p>`;
    }
  },

  renderProduct(product, related = []) {
    // Update Document Title
    document.title = `${product.name} | CodeAlpha Store`;

    // Breadcrumbs
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.category;
      breadcrumbCategory.href = `/?category=${encodeURIComponent(product.category)}#catalog`;
    }

    // Populate Details
    document.getElementById('productImage').src = product.image;
    document.getElementById('productImage').alt = product.name;

    const badgeWrap = document.getElementById('productBadgeWrap');
    if (badgeWrap) {
      badgeWrap.innerHTML = `
        <span class="category-pill" style="padding: 0.3rem 0.8rem; font-size: 0.75rem; background: var(--primary-light); color: var(--primary); border: none;">
          ${product.category}
        </span>
        ${product.badge ? `<span class="category-pill" style="padding: 0.3rem 0.8rem; font-size: 0.75rem; background: var(--secondary); color: white; border: none;">${product.badge}</span>` : ''}
        <span style="font-size: 0.8125rem; font-weight: 600; color: ${product.stock > 10 ? 'var(--success)' : 'var(--warning)'};">
          ${product.stock > 0 ? `● In Stock (${product.stock} units)` : '● Out of Stock'}
        </span>
      `;
    }

    document.getElementById('productTitle').textContent = product.name;

    // Rating & Stars
    const fullStars = Math.floor(product.rating);
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<svg width="18" height="18" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
      } else {
        starsHtml += `<svg width="18" height="18" fill="#cbd5e1" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
      }
    }
    document.getElementById('productStars').innerHTML = starsHtml;
    document.getElementById('productRatingScore').textContent = product.rating;
    document.getElementById('productReviewsCount').textContent = `(${product.reviews_count} verified reviews)`;

    // Price
    document.getElementById('productCurrentPrice').textContent = Store.formatMoney(product.price);
    const oldPriceEl = document.getElementById('productOldPrice');
    const discountEl = document.getElementById('productDiscountTag');

    if (product.compare_at_price && product.compare_at_price > product.price) {
      oldPriceEl.textContent = Store.formatMoney(product.compare_at_price);
      oldPriceEl.style.display = 'inline';
      const pct = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
      discountEl.textContent = `Save ${pct}%`;
      discountEl.style.display = 'inline-block';
    } else {
      oldPriceEl.style.display = 'none';
      discountEl.style.display = 'none';
    }

    document.getElementById('productDescription').textContent = product.description;

    // Features Bullets
    const specsEl = document.getElementById('productSpecsList');
    if (specsEl) {
      if (Array.isArray(product.features) && product.features.length > 0) {
        specsEl.innerHTML = product.features.map(f => `
          <li>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${f}</span>
          </li>
        `).join('');
      } else {
        specsEl.innerHTML = '';
      }
    }

    // Render Related Products
    const relatedContainer = document.getElementById('relatedProductsGrid');
    if (relatedContainer && related.length > 0) {
      relatedContainer.innerHTML = related.map(item => `
        <div class="product-card">
          <a href="/product?id=${item.id}" class="card-media" style="height: 180px;">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
          </a>
          <div class="card-body" style="padding: 1rem;">
            <div class="card-category">${item.category}</div>
            <h4 class="card-title" style="font-size: 0.9375rem; height: 2.4rem;">
              <a href="/product?id=${item.id}">${item.name}</a>
            </h4>
            <div class="card-footer">
              <span class="card-price" style="font-size: 1.1rem;">${Store.formatMoney(item.price)}</span>
              <a href="/product?id=${item.id}" class="btn btn-outline btn-sm">View</a>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProductDetail.init();
});
