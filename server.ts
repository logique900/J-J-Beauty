import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // Logging middleware for production debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  const distPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname) 
    : path.join(process.cwd(), 'dist');
    
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] serving from: ${distPath}`);

  // Create an API router
  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      port: PORT, 
      env: process.env.NODE_ENV, 
      time: new Date().toISOString(),
      dist: distPath
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('[SPA Fallback] Error sending index.html:', err);
          res.status(404).send('Application build missing or incomplete. Please check dist/index.html');
        }
      });
    });
  }

  // Final catch-all for anything missed (like POST to wrong routes)
  app.use((req, res) => {
    console.log(`[404] ${req.method} ${req.url} not matched by any route`);
    res.status(404).json({ 
      error: 'Not Found', 
      path: req.url, 
      method: req.method,
      message: 'The requested resource was not found on this server.'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
