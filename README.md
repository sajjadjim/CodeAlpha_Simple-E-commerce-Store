# Alpha Store - Simple E-Commerce Web Application

A full-stack, modern e-commerce web application built for **CodeAlpha Task 1: Simple E-commerce Store**.

Built with a **Node.js + Express.js backend**, an embedded **SQLite database**, and a **HTML5, CSS3, and JavaScript frontend**.

---

## 🌟 Key Features

### 1. Product Listings & Catalog (`/` or `index.html`)
- **Dynamic Category Filtering**: Filter products by Audio, Computer, Wearables, Accessories, and Home Tech.
- **Real-Time Search & Debounce**: Search catalog by product name or keywords.
- **Price Range & Sorting**: Filter by maximum price, or sort by Featured, Price (Low/High), Highest Rated, Most Popular, and Newest.
- **Product Cards**: High-res imagery, badges (*Best Seller*, *Sale*, *New*), star ratings, reviews count, stock indicators, and quick "Add to Cart" button.

### 2. Product Details Page (`/product?id=...`)
- Breadcrumb navigation (`Home > Category > Product`).
- Product gallery image preview with stock badge.
- Detailed technical specifications bullet points.
- Quantity selector with stock ceiling validation.
- **"Add to Cart"** (opens slide-out cart) & **"Buy Now"** (instant redirect to checkout).
- Customer Reviews section with 5-star ratings and a verified review submission widget.
- Related products recommendations.

### 3. Shopping Cart System (`/cart` + Slide-Out Drawer)
- **Everywhere Slide-Out Drawer**: Instant cart preview accessible on any page by clicking the cart badge.
- **Dedicated Full Cart Page**: Line-by-line item table, unit price, quantity modifier, subtotal, and item removal.
- **Promo Coupon Engine**: Apply coupon `ALPHA10` (10% off) or `WELCOME15` (15% off).
- **Free Shipping Calculator**: Progress bar showing distance to the $100 free shipping threshold.

### 4. Order Processing & Checkout (`/checkout`)
- Multi-step checkout layout with live order summary.
- **1-Click Autofill Demo Address** button for quick testing.
- Shipping address and contact collection with live validation.
- Payment method switcher:
  - Credit / Debit Card (with card fields)
  - Cash on Delivery (COD)
  - Mobile Wallet / bKash
- Transactional backend order creation with stock decrement.

### 5. Order Confirmation & Tracking (`/order-success.html` & `/orders`)
- Order confirmation receipt with unique reference (e.g. `ORD-984210`).
- Estimated delivery date calculation.
- Printable/downloadable invoice button.
- Real-time 4-step order progress timeline:
  `Order Placed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`.
- Order lookup search by order reference.
- Customer order cancellation option (restores inventory).

### 6. User Registration & Authentication (`/login`)
- Tabbed interface for **Sign In** and **Create Account**.
- Secure password hashing using `bcryptjs`.
- Session & API protection using **JSON Web Tokens (JWT)**.
- Pre-seeded **1-Click Demo Customer Account** helper.
- Authenticated user order history sync.

### 7. SQLite Database Storage (`store.db`)
- Relational schema storing:
  - `users`: User profiles, hashed credentials, contact info.
  - `products`: Product catalog, pricing, ratings, stock, features JSON.
  - `orders`: Order totals, customer shipping information, payment method, fulfillment status.
  - `order_items`: Line items linking products to orders.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have **Node.js** (v18+ or v20+) installed on your machine.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
# Start production server
npm start

# Or start with auto-reload dev mode
npm run dev
```

### 4. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚀 Deploying to Vercel

The repository is pre-configured with [`vercel.json`](file:///Users/sajjadhossainjim/Downloads/CodeAlpha_Simple-E-commerce-Store/vercel.json) and [`api/index.js`](file:///Users/sajjadhossainjim/Downloads/CodeAlpha_Simple-E-commerce-Store/api/index.js).

### Method 1: Deploy via GitHub (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and log in with your GitHub account.
3. Click **"Add New..."** ➔ **"Project"**.
4. Import your `CodeAlpha_Simple-E-commerce-Store` repository.
5. Click **Deploy**. Vercel will build and assign you a live URL (e.g. `https://your-store.vercel.app`) in under 1 minute!

### Method 2: Deploy via Vercel CLI
Run the following command in the project directory:
```bash
npx vercel
```
Follow the interactive prompts (select default settings) to deploy immediately.

---

## 🔑 Demo Credentials

| Role | Email | Password | Features Available |
| :--- | :--- | :--- | :--- |
| **Demo Customer** | `demo@example.com` | `password123` | Pre-seeded order history, profile autofill |

> **Tip**: On the `/login` page, you can simply click the **"⚡ 1-Click Autofill"** button to instantly populate the demo credentials.

---

## 🎟️ Promo Discount Codes

- **`ALPHA10`**: 10% discount on entire cart.
- **`WELCOME15`**: 15% discount for new customers.

---

## 📦 Project Structure

```
CodeAlpha_Simple-E-commerce-Store/
├── db/
│   ├── database.js          # SQLite schema, initial product & user seed
│   └── store.db             # SQLite database file
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Register, login, profile endpoints
│   ├── products.js          # Products catalog, filtering, details
│   └── orders.js            # Checkout, order creation, order tracking
├── public/
│   ├── index.html           # Homepage & product listing catalog
│   ├── product.html         # Product details, specs, and reviews
│   ├── cart.html            # Dedicated shopping cart page
│   ├── checkout.html        # Checkout & order processing
│   ├── order-success.html   # Order confirmation & invoice receipt
│   ├── orders.html          # Order tracking & past orders history
│   ├── login.html           # Sign In & Account Registration
│   ├── css/
│   │   └── style.css        # Modern design system & responsive styling
│   └── js/
│       ├── app.js           # Cart state, slide drawer, auth & toasts
│       ├── catalog.js       # Dynamic search, category pills & sorting
│       ├── product-detail.js# Product view & specifications logic
│       ├── cart-page.js     # Cart table, coupon discounts & totals
│       ├── checkout.js      # Form validation & order placement
│       ├── order-success.js # Receipt rendering & print handler
│       ├── orders.js        # Timeline tracking & order lookup
│       └── auth.js          # Authentication handlers
├── server.js                # Express.js main server & route setup
└── package.json             # NPM dependencies & scripts
```
