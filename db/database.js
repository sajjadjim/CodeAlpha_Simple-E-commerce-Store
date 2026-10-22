const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and speed
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      compare_at_price REAL,
      rating REAL DEFAULT 4.7,
      reviews_count INTEGER DEFAULT 24,
      stock INTEGER DEFAULT 50,
      image TEXT NOT NULL,
      badge TEXT,
      description TEXT NOT NULL,
      features TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      shipping_fee REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 4. Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_image TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  // Check if users exist, otherwise seed demo user
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const demoPasswordHash = bcrypt.hashSync('password123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, address, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Alex Johnson',
      'demo@example.com',
      demoPasswordHash,
      '+1 (555) 382-9011',
      '742 Evergreen Terrace, Suite 100',
      'customer'
    );
    console.log('✔ Seeded demo user: demo@example.com / password123');
  }

  // Check if products exist, otherwise seed catalog
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const initialProducts = [
      {
        name: 'Aura Studio Wireless Noise-Cancelling Headphones',
        slug: 'aura-studio-wireless-headphones',
        category: 'Audio',
        price: 199.99,
        compare_at_price: 249.99,
        rating: 4.9,
        reviews_count: 142,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        badge: 'Best Seller',
        description: 'Immerse yourself in rich, acoustic brilliance with 40mm beryllium drivers, active hybrid noise cancellation, and up to 45 hours of uninterrupted battery life.',
        features: JSON.stringify([
          'Hybrid Active Noise Cancellation (40dB reduction)',
          'High-Res 40mm dynamic drivers with spatial audio support',
          'Fast charging: 10 mins delivers 5 hours playback',
          'Ultra-plush protein leather ear cushions and lightweight metal alloy band',
          'Multipoint Bluetooth 5.3 connection'
        ]),
        is_featured: 1
      },
      {
        name: 'Horizon Pro Minimalist Smartwatch',
        slug: 'horizon-pro-minimalist-smartwatch',
        category: 'Wearables',
        price: 159.50,
        compare_at_price: 199.00,
        rating: 4.8,
        reviews_count: 98,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        badge: 'New',
        description: 'Crafted with aerospace-grade sapphire crystal and an always-on 1.4-inch AMOLED display, tracking your health metrics with clinical precision.',
        features: JSON.stringify([
          '1.43" AMOLED retina display with 1000 nits peak brightness',
          '24/7 Heart rate, SpO2, sleep stages, and stress tracking',
          '5 ATM water resistance (swimming safe up to 50 meters)',
          '12-day battery life on a single magnetic wireless charge',
          'Customizable watch faces with quick-release leather & silicone bands'
        ]),
        is_featured: 1
      },
      {
        name: 'KeyCraft V2 Mechanical Gaming Keyboard',
        slug: 'keycraft-v2-mechanical-keyboard',
        category: 'Computer',
        price: 119.00,
        compare_at_price: 149.00,
        rating: 4.7,
        reviews_count: 76,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        badge: 'Top Rated',
        description: 'Precision hot-swappable tactile switches mounted on an acoustic gasket dampening chassis with per-key RGB backlighting and custom macro knobs.',
        features: JSON.stringify([
          'Hot-swappable PCB supporting 3-pin and 5-pin MX switches',
          'Gasket mount structure with 5-layer sound absorbing foam',
          'CNC anodized aluminum frame with magnetic wrist rest',
          'Tri-mode connectivity: 2.4GHz wireless, Bluetooth 5.0, USB-C wired',
          'Multi-function rotary dial for volume and brightness control'
        ]),
        is_featured: 1
      },
      {
        name: 'Lumina 4K Ultra-Slim Frameless Monitor 27"',
        slug: 'lumina-4k-ultraslim-monitor-27',
        category: 'Computer',
        price: 349.99,
        compare_at_price: 429.99,
        rating: 4.9,
        reviews_count: 64,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        badge: 'Sale',
        description: 'Breathtaking 3840x2160 IPS panel featuring 99% sRGB color gamut, HDR400 certified brightness, and single-cable 90W USB-C power delivery.',
        features: JSON.stringify([
          '27-inch 4K UHD IPS panel (3840 x 2160 resolution)',
          '99% sRGB, 95% DCI-P3 color accuracy, factory calibrated',
          'USB-C with 90W Power Delivery to charge your laptop',
          'Micro-edge 3-sided borderless aesthetic design',
          'Fully ergonomic stand (tilt, swivel, pivot, height adjustment)'
        ]),
        is_featured: 1
      },
      {
        name: 'Pulse Pro True Wireless Sport Earbuds',
        slug: 'pulse-pro-wireless-sport-earbuds',
        category: 'Audio',
        price: 79.99,
        compare_at_price: 99.99,
        rating: 4.6,
        reviews_count: 112,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        badge: 'Popular',
        description: 'Engineered for relentless movement. IPX7 sweat & waterproof rating with ergonomic ear-fins, deep punchy bass, and 36-hour total battery.',
        features: JSON.stringify([
          'IPX7 rated water and sweat resistance for intense workouts',
          'Titanium composite diaphragms with deep bass enhancement',
          'Secure wing-tip ear-fins in 3 sizes for zero fall-out',
          'Touch controls for volume, track skipping, and voice assistant',
          'Pocket-sized Qi wireless charging case'
        ]),
        is_featured: 0
      },
      {
        name: 'Apex Precision Wireless Ergonomic Mouse',
        slug: 'apex-precision-ergonomic-mouse',
        category: 'Computer',
        price: 64.99,
        compare_at_price: 84.99,
        rating: 4.8,
        reviews_count: 53,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        badge: null,
        description: 'Sculpted for natural wrist posture. Features an ultra-quiet electromagnetic scroll wheel, 8000 DPI Darkfield sensor, and cross-computer flow control.',
        features: JSON.stringify([
          '57-degree vertical natural handshake angle to relieve wrist strain',
          'Hyper-fast MagSpeed electromagnetic scroll wheel',
          'Tracks on any surface including clear glass (up to 8,000 DPI)',
          'Rechargeable via USB-C (lasts up to 70 days on full charge)',
          'Connect to 3 devices simultaneously with easy toggle'
        ]),
        is_featured: 0
      },
      {
        name: 'Nova 65W GaN Compact Fast Charger',
        slug: 'nova-65w-gan-compact-charger',
        category: 'Accessories',
        price: 38.00,
        compare_at_price: 49.99,
        rating: 4.9,
        reviews_count: 189,
        stock: 85,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        badge: 'Essential',
        description: 'Next-gen Gallium Nitride (GaN) III tech packed into a form factor 50% smaller than standard bricks. Powers your laptop, tablet, and phone simultaneously.',
        features: JSON.stringify([
          '65W total power delivery via 2x USB-C and 1x USB-A ports',
          'GaN III technology runs cooler and delivers higher electrical efficiency',
          'Intelligent power allocation dynamically splits wattage safely',
          'Foldable prongs for effortless travel packing',
          'Universal compatibility: MacBooks, iPhones, Samsung Galaxy, Steam Deck'
        ]),
        is_featured: 0
      },
      {
        name: 'Vanguard Genuine Full-Grain Leather Backpack',
        slug: 'vanguard-full-grain-leather-backpack',
        category: 'Accessories',
        price: 185.00,
        compare_at_price: 220.00,
        rating: 4.9,
        reviews_count: 42,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
        badge: 'Crafted',
        description: 'Handcrafted from durable full-grain vegetable-tanned leather. Includes a padded 16-inch laptop chamber, waterproof lining, and luggage pass-through.',
        features: JSON.stringify([
          '100% full-grain Italian vintage leather that patinas beautifully',
          'Dedicated velvet-lined compartment for laptops up to 16 inches',
          'Hidden anti-theft RFID-blocking passport & card pocket',
          'Heavy-duty YKK antique brass zippers',
          'Breathable mesh rear panel with luggage trolley strap'
        ]),
        is_featured: 1
      },
      {
        name: 'AeroStream Smart HEPA Air Purifier',
        slug: 'aerostream-smart-hepa-purifier',
        category: 'Home Tech',
        price: 139.00,
        compare_at_price: 179.00,
        rating: 4.7,
        reviews_count: 81,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
        badge: null,
        description: 'Whisper-quiet H13 True HEPA filtration capturing 99.97% of airborne particles down to 0.3 microns. Real-time air quality index light and smartphone app sync.',
        features: JSON.stringify([
          'H13 True HEPA filter with activated carbon for odors and smoke',
          'Cleans 500 sq ft room in just 25 minutes (CADR 220 m³/h)',
          'Laser PM2.5 particle sensor with live color LED indicator',
          'Ultra-quiet Sleep Mode runs at just 22dB',
          'Smart scheduling and filter replacement alert'
        ]),
        is_featured: 0
      },
      {
        name: 'SoundBar 360 Cinema Surround System',
        slug: 'soundbar-360-cinema-surround-system',
        category: 'Audio',
        price: 229.00,
        compare_at_price: 289.00,
        rating: 4.8,
        reviews_count: 57,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        badge: 'Sale',
        description: 'Dolby Atmos cinematic 3.1 channel soundbar paired with a wireless downward-firing subwoofer for room-shaking theater bass and crystal-clear dialogue.',
        features: JSON.stringify([
          'Dolby Atmos and DTS:X 3D spatial surround sound',
          'Wireless 6.5" subwoofer for deep, rumbling low-frequency bass',
          'Dedicated center dialogue enhancer channel',
          'HDMI eARC, Optical, AUX, and Bluetooth 5.2 connectivity',
          'Includes slim remote control and wall mounting kit'
        ]),
        is_featured: 0
      },
      {
        name: 'EchoGlow Ambient Smart Desk Lamp',
        slug: 'echoglow-ambient-smart-desk-lamp',
        category: 'Home Tech',
        price: 49.99,
        compare_at_price: 69.99,
        rating: 4.6,
        reviews_count: 94,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
        badge: null,
        description: 'Circadian lighting lamp that mimics natural sunlight progression. 16 million RGB colors, touch-slider dimming, and built-in 10W wireless smartphone charger.',
        features: JSON.stringify([
          '16M RGB colors + 2700K-6500K tunable white temperature',
          'Flicker-free eye-caring diffusion shield (CRI > 95)',
          'Integrated 10W Qi fast wireless charging base pad',
          'Stepless touch slider for brightness and warm-to-cool tone',
          'Syncs with Alexa, Google Home, and Apple HomeKit'
        ]),
        is_featured: 0
      },
      {
        name: 'Terra 30000mAh Rugged Solar Power Bank',
        slug: 'terra-30000mah-rugged-solar-power-bank',
        category: 'Accessories',
        price: 54.95,
        compare_at_price: 69.95,
        rating: 4.7,
        reviews_count: 110,
        stock: 48,
        image: 'https://images.unsplash.com/photo-1609592424368-80e927c8d9be?auto=format&fit=crop&w=800&q=80',
        badge: 'Outdoor',
        description: 'Massive 30,000mAh capacity wrapped in shockproof silicone bumper casing. Features high-efficiency monocrystalline solar charging and dual high-lumen flashlights.',
        features: JSON.stringify([
          '30,000mAh colossal battery capacity (charges phone 6-8 times)',
          'High-efficiency auxiliary solar panel for emergency outdoor backup',
          'IP66 drop-proof, dust-proof, and splash-proof rugged armor',
          'Dual USB-C 22.5W fast ports + built-in emergency compass & flashlight',
          'Overcharge and temperature surge safety protection'
        ]),
        is_featured: 0
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO products (
        name, slug, category, price, compare_at_price, rating, reviews_count,
        stock, image, badge, description, features, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((products) => {
      for (const p of products) {
        insertStmt.run(
          p.name, p.slug, p.category, p.price, p.compare_at_price, p.rating,
          p.reviews_count, p.stock, p.image, p.badge, p.description, p.features, p.is_featured
        );
      }
    });

    insertMany(initialProducts);
    console.log(`✔ Seeded ${initialProducts.length} initial products.`);
  }

  // Seed sample past order for demo user if none exists
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0) {
    const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
    if (demoUser) {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          user_id, order_number, customer_name, customer_email, customer_phone,
          shipping_address, city, postal_code, payment_method,
          subtotal, discount, shipping_fee, tax, total, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))
      `).run(
        demoUser.id,
        'ORD-984210',
        'Alex Johnson',
        'demo@example.com',
        '+1 (555) 382-9011',
        '742 Evergreen Terrace, Suite 100',
        'Springfield',
        '97477',
        'Credit Card (•••• 4242)',
        199.99,
        0,
        0,
        16.00,
        215.99,
        'Shipped'
      );

      const orderId = orderInsert.lastInsertRowid;
      db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_image, price, quantity, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        1,
        'Aura Studio Wireless Noise-Cancelling Headphones',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        199.99,
        1,
        199.99
      );
      console.log('✔ Seeded demo past order: ORD-984210');
    }
  }
}

// Initialize tables and seed on start
initDatabase();

module.exports = db;
