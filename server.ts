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
    const { orderId, amount, customerName, adminEmail, senderEmail } = req.body;
    
    const fromEmail = senderEmail || 'onboarding@resend.dev';
    const finalFrom = fromEmail.includes('<') ? fromEmail : `J&J Beauty <${fromEmail}>`;
    const finalTo = adminEmail || 'logique900@gmail.com';

    console.log(`[Notification] Order ${orderId}: Notifying ${finalTo} from ${finalFrom}`);

    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn('[Notification] RESEND_API_KEY is missing.');
      return res.json({ success: true, message: 'Notification simulée (clé manquante)' });
    }

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (!isValidEmail(finalTo)) {
      console.warn(`[Notification] Invalid recipient email: ${finalTo}. Skipping.`);
      return res.json({ success: true, message: "Email invalide, notification ignorée" });
    }

    try {
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from: finalFrom,
        to: [finalTo],
        subject: `Nouvelle Commande - #${orderId}`,
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
            <p>Connectez-vous à votre interface administrateur.</p>
          </div>
        `
      });

      if (error) {
        console.error('[Resend Admin Notification Error]', JSON.stringify(error, null, 2));
        // If it's a validation error, it's often due to unverified sender or recipient in trial mode
        return res.status(400).json({ success: false, error: error });
      }

      console.log('[Notification] Admin email sent:', data?.id);
      res.json({ success: true, message: 'Email envoyé', id: data?.id });
    } catch (err) {
      console.error('[Notification Hub Error]', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  apiRouter.post('/notifications/customer-status-update', async (req, res) => {
    const { orderId, customerEmail, customerName, newStatus, trackingNumber, senderEmail } = req.body;
    
    const fromEmail = senderEmail || 'onboarding@resend.dev';
    const finalFrom = fromEmail.includes('<') ? fromEmail : `J&J Beauty <${fromEmail}>`;

    console.log(`[Notification] Status update order ${orderId} to ${newStatus} for ${customerEmail} from ${finalFrom}`);

    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn('[Notification] RESEND_API_KEY is missing.');
      return res.json({ success: true, message: 'Notification client simulée' });
    }

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!customerEmail || !isValidEmail(customerEmail)) {
      console.warn(`[Notification] Invalid customer email: ${customerEmail}. Skipping.`);
      return res.json({ success: true, message: "Email client invalide, notification ignorée" });
    }

    try {
      const resend = new Resend(resendKey);
      
      let statusMessage = "Votre commande est en cours de traitement.";
      let statusColor = "#333";

      switch (newStatus) {
        case 'processing': 
          statusMessage = "Nous préparons actuellement votre commande.";
          statusColor = "#1e40af";
          break;
        case 'shipped':
          statusMessage = "Votre commande a été expédiée !";
          statusColor = "#ca8a04";
          break;
        case 'delivered':
          statusMessage = "Votre commande a été livrée.";
          statusColor = "#16a34a";
          break;
        case 'cancelled':
          statusMessage = "Votre commande a été annulée.";
          statusColor = "#dc2626";
          break;
        case 'refunded':
          statusMessage = "Votre commande a été remboursée.";
          statusColor = "#7c3aed";
          break;
      }

      const { data, error } = await resend.emails.send({
        from: finalFrom,
        to: [customerEmail],
        subject: `Mise à jour de votre commande #${orderId} - J&J Beauty`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Mise à jour de votre commande #${orderId}</h2>
            <p>Bonjour ${customerName},</p>
            <div style="padding: 15px; background: #f0f0f0; border-left: 4px solid ${statusColor};">
              <p><strong>Nouveau Statut :</strong> ${newStatus.toUpperCase()}</p>
              <p>${statusMessage}</p>
              ${trackingNumber ? `<p><strong>Numéro de suivi :</strong> ${trackingNumber}</p>` : ''}
            </div>
            <p>Merci de votre confiance.</p>
          </div>
        `
      });

      if (error) {
        console.error('[Resend Customer Notification Error]', JSON.stringify(error, null, 2));
        return res.status(400).json({ success: false, error: error });
      }

      res.json({ success: true, message: 'Email envoyé', id: data?.id });
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
