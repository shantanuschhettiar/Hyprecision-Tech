import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createQuotationRequest,
  getAllQuotationRequests,
  updateQuotationStatus,
  getSystemStats,
  executeRawQuery,
  seedDatabase,
} from './src/server/db.ts';
import { compareProductsWithAI, handleAiDatabaseAgent } from './src/server/gemini.ts';
import { generateFormalQuotationOffer } from './src/utils/quotationDocument.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio requires dev server on port 3000. In Cloud Run, process.env.PORT is often 8080 (used by Nginx).
// Never bind to 8080 to prevent EADDRINUSE conflict with Nginx.
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// ---------------------------------------------------------------------------
// REST API ENDPOINTS
// ---------------------------------------------------------------------------

// 1. GET Products with filter
app.get('/api/products', (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const products = getAllProducts({
      categorySlug: category as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    res.json(products);
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products', details: err.message });
  }
});

// 2. GET Single Product
app.get('/api/products/:id', (req, res) => {
  try {
    const product = getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST Create Product (Admin)
app.post('/api/products', (req, res) => {
  try {
    const { specifications, ...productData } = req.body;
    const newProduct = createProduct(productData, specifications || []);
    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4. PUT Update Product (Admin)
app.put('/api/products/:id', (req, res) => {
  try {
    const { specifications, ...productData } = req.body;
    const updated = updateProduct(req.params.id, productData, specifications);
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE Product (Admin)
app.delete('/api/products/:id', (req, res) => {
  try {
    const success = deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted from database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET Categories
app.get('/api/categories', (_req, res) => {
  try {
    const categories = getAllCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST AI Comparison
app.post('/api/ai/compare', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 product IDs to compare' });
    }
    const comparison = await compareProductsWithAI(productIds);
    res.json(comparison);
  } catch (err: any) {
    console.error('AI comparison error:', err);
    res.status(500).json({ error: err.message || 'Comparison failed' });
  }
});

// 8. POST AI Natural Language Query & DB Manager Agent
app.post('/api/ai/query-manager', async (req, res) => {
  try {
    const { prompt, userRole, history, products } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Query prompt is required' });
    }
    const result = await handleAiDatabaseAgent(
      prompt,
      userRole || 'buyer',
      history || [],
      products
    );
    res.json(result);
  } catch (err: any) {
    console.error('AI Query Manager error:', err);
    res.status(500).json({ error: err.message || 'AI Query failed' });
  }
});

// 9. RFQ Endpoints
app.post('/api/rfq', (req, res) => {
  try {
    const rfq = createQuotationRequest(req.body);
    res.status(201).json(rfq);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/rfq', (_req, res) => {
  try {
    const list = getAllQuotationRequests();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rfq/:id', (req, res) => {
  try {
    const updated = updateQuotationStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 10. Formal Techno-Commercial Quotation Offer Generation
app.get('/api/quotations/product/:id', (req, res) => {
  try {
    const prod = getProductById(req.params.id);
    if (!prod) {
      return res.status(404).json({ error: 'Vessel product not found' });
    }
    const offer = generateFormalQuotationOffer(prod);
    res.json(offer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quotations/rfq/:id', (req, res) => {
  try {
    const list = getAllQuotationRequests() as any[];
    const rfq = list.find((r) => r.id === req.params.id);
    if (!rfq) {
      return res.status(404).json({ error: 'Quotation request not found' });
    }
    const prod = rfq.product_id ? getProductById(rfq.product_id) : (getAllProducts()[0] as any);
    const offer = generateFormalQuotationOffer(prod, rfq);
    res.json(offer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. System Stats & Logs
app.get('/api/stats', (_req, res) => {
  try {
    const stats = getSystemStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Admin Raw SQL Console
app.post('/api/admin/sql', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'SQL query required' });
    const result = executeRawQuery(query);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 12. Admin Reset Seed Data
app.post('/api/admin/reset-seed', (_req, res) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'Database reset to default HY Precision seed records.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ---------------------------------------------------------------------------
async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[HY Precision Technology] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
