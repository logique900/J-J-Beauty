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

  // WhatsApp sending API endpoint
  apiRouter.post('/whatsapp/send', async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ error: 'Missing "to" or "message" in request body' });
      }

      console.log(`[WhatsApp] Preparing to send message to ${to}`);
      
      // =========================================================================
      // TODO: INTEGRATION WHATSAPP (TWILIO OU META OFFICIEL)
      // Pour envoyer un message SANS INTERVENTION HUMAINE, vous devez utiliser 
      // un fournisseur d'API WhatsApp tel que Twilio ou l'API Cloud de WhatsApp.
      // 
      // Exemple avec Twilio :
      // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: message,
      //   from: 'whatsapp:+14155238886',
      //   to: `whatsapp:${to}`
      // });
      // =========================================================================

      const apiKey = process.env.WHATSAPP_API_KEY;
      if (!apiKey) {
        console.warn('[WhatsApp] API key not found. Simulating successful send for development.');
        // Simulation pour le développement
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.json({ success: true, simulated: true, message: 'Message simulé avec succès (API Key manquante)' });
      }

      // Si vous avez un endpoint externe (ex: API maison ou Meta API) :
      // const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ ... })
      // });

      res.json({ success: true, message: 'Message envoyé via API' });
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
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
