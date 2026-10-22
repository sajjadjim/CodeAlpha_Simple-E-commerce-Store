const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/categories - list distinct categories with product count
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY category ASC
    `).all();

    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/products - list products with search, filter, sorting
router.get('/', (req, res) => {
  try {
    const { category, search, sort, min_price, max_price, featured, limit } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (min_price && !isNaN(Number(min_price))) {
      query += ' AND price >= ?';
      params.push(Number(min_price));
    }

    if (max_price && !isNaN(Number(max_price))) {
      query += ' AND price <= ?';
      params.push(Number(max_price));
    }

    if (featured === '1' || featured === 'true') {
      query += ' AND is_featured = 1';
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price-desc':
        query += ' ORDER BY price DESC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC, reviews_count DESC';
        break;
      case 'popular':
        query += ' ORDER BY reviews_count DESC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      default:
        query += ' ORDER BY is_featured DESC, id ASC';
        break;
    }

    if (limit && !isNaN(Number(limit))) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    }

    const rawProducts = db.prepare(query).all(...params);

    const products = rawProducts.map(p => {
      let parsedFeatures = [];
      try {
        if (p.features) parsedFeatures = JSON.parse(p.features);
      } catch (e) {
        parsedFeatures = [];
      }
      return {
        ...p,
        features: parsedFeatures
      };
    });

    return res.json({
      success: true,
      total: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// GET /api/products/:identifier - get product by ID or Slug
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    if (!isNaN(Number(identifier))) {
      product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(identifier));
    } else {
      product = db.prepare('SELECT * FROM products WHERE slug = ?').get(identifier);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let features = [];
    try {
      if (product.features) features = JSON.parse(product.features);
    } catch (e) {
      features = [];
    }

    // Fetch related products in the same category
    const relatedRaw = db.prepare(`
      SELECT * FROM products
      WHERE category = ? AND id != ?
      ORDER BY rating DESC
      LIMIT 4
    `).all(product.category, product.id);

    const related = relatedRaw.map(r => {
      let rFeatures = [];
      try {
        if (r.features) rFeatures = JSON.parse(r.features);
      } catch (e) {
        rFeatures = [];
      }
      return { ...r, features: rFeatures };
    });

    return res.json({
      success: true,
      product: {
        ...product,
        features
      },
      related
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

module.exports = router;
