import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

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

  // --- API ROUTES ---

  apiRouter.post('/notifications/admin-order', async (req, res) => {
    const { orderId, amount, customerName, adminEmail } = req.body;
    
    console.log(`[Notification] Order ${orderId} received. Attempting to notify ${adminEmail}`);

    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn('[Notification] RESEND_API_KEY is missing. Falling back to console simulation.');
      console.log('\n======================================================');
      console.log(`[SIMULATION EMAIL ADMIN] Nouvelle commande reçue !`);
      console.log(`À: ${adminEmail || 'admin@jjbeauty.com'}`);
      console.log(`Sujet: Nouvelle commande #${orderId}`);
      console.log(`Corps: Une nouvelle commande a été passée par ${customerName}.`);
      console.log(`Montant total: ${amount} DT.`);
      console.log('======================================================\n');
      return res.json({ success: true, message: 'Notification (mock) traitée (RESEND_API_KEY manquante)' });
    }

    try {
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from: 'J&J Beauty <onboarding@resend.dev>', // Note: standard test sender, ideally updated with verified domain
        to: [adminEmail || 'logique900@gmail.com'],
        subject: `Nouvelle Commande Reçue - #${orderId}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #000;">Nouvelle commande sur J&J Beauty</h1>
            <p>Bonjour,</p>
            <p>Une nouvelle commande vient d'être passée sur votre boutique.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
              <p><strong>ID Commande:</strong> #${orderId}</p>
              <p><strong>Client:</strong> ${customerName}</p>
              <p><strong>Montant Total:</strong> ${amount} DT</p>
            </div>
            <p>Connectez-vous à votre interface administrateur pour voir les détails et traiter la commande.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8em; color: #999;">Ceci est une notification automatique de votre boutique J&J Beauty.</p>
          </div>
        `
      });

      if (error) {
        console.error('[Resend Error]', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log('[Notification] Email sent successfully:', data?.id);
      res.json({ success: true, message: 'Email envoyé avec succès', id: data?.id });
    } catch (err) {
      console.error('[Notification Hub Error]', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
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
