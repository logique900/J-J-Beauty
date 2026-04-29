import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // Helper to create transport
  const getTransporter = () => {
    const port = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  };

  const checkMock = () => {
    return (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS);
  };

  const getFromEmail = () => process.env.SMTP_FROM || `"Boutique" <${process.env.SMTP_USER}>`;

  const handleError = (res: express.Response, error: any) => {
    console.error('Erreur SMTP:', error);
    let errorMessage = String(error.message || error);
    if (errorMessage.includes('Unexpected socket close')) {
        errorMessage = "Connexion SMTP perdue. Vérifiez le port (465/587) et le paramètre sécurisé.";
    } else if (errorMessage.includes('Invalid login') || errorMessage.includes('535')) {
        errorMessage = "Erreur d'authentification SMTP : Utilisateur/Mot de passe incorrect.";
    }
    res.status(500).json({ success: false, error: errorMessage });
  };

  // --- API ROUTES ---
  
  // Endpoint to send order notification emails (to Admin only on checkout)
  app.post('/api/send-order-email', async (req, res) => {
    try {
      const { customerEmail, customerName, orderId, adminEmail, totalAmount, items, shippingAddress, paymentMethod, deliveryMethod } = req.body;
      
      if (checkMock()) {
        console.log(`[Mock Email] Order ${orderId} by ${customerName} (${totalAmount} DT)`);
        console.log(`[Mock Email] Would send notification to Admin: ${adminEmail}`);
        return res.json({ 
          success: true, 
          message: 'Simulation réussie. Configurez les variables SMTP_HOST, SMTP_USER, SMTP_PASS pour des emails réels.',
          mock: true
        });
      }

      const transporter = getTransporter();
      const fromEmail = getFromEmail();

      // Format items
      const itemsHtml = items ? items.map((i: any) => `<li>${i.quantity}x ${i.name} (${i.price} DT/u) = ${i.quantity * i.price} DT</li>`).join('') : '';

      // Envoi à l'administrateur (Admin Notification)
      const adminEmailResult = await transporter.sendMail({
        from: fromEmail, 
        to: adminEmail,
        subject: `🚨 Nouvelle Commande reçue #${orderId} - (${totalAmount} DT)`,
        html: `
          <h1>Nouvelle Commande à traiter</h1>
          <p><strong>Réf:</strong> #${orderId}</p>
          <p><strong>Client:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Téléphone:</strong> ${shippingAddress?.phone || 'N/A'}</p>
          <p><strong>Adresse:</strong> ${shippingAddress?.address1}, ${shippingAddress?.city}, ${shippingAddress?.country}</p>
          <p><strong>Livraison:</strong> ${deliveryMethod === 'delivery' ? 'À domicile' : 'En magasin'}</p>
          <p><strong>Paiement:</strong> ${paymentMethod}</p>
          <p><strong>Montant Total:</strong> ${totalAmount} DT</p>
          <h3>Articles :</h3>
          <ul>${itemsHtml}</ul>
          <br />
          <a href="${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin">Gérer les commandes</a>
        `
      });

      console.log('Admin Email Result:', adminEmailResult.messageId);
      
      res.json({ success: true, adminEmailResult: adminEmailResult.messageId });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Endpoint to send confirmation mail to user
  app.post('/api/send-order-confirmation', async (req, res) => {
    try {
      const { customerEmail, customerName, orderId, totalAmount } = req.body;
      
      if (checkMock()) {
         console.log(`[Mock Email] Would send CONFIRMATION to ${customerEmail} for order ${orderId}`);
         return res.json({ success: true, mock: true });
      }

      const transporter = getTransporter();
      
      const customerEmailResult = await transporter.sendMail({
        from: getFromEmail(),
        to: customerEmail,
        subject: `Confirmation de votre commande #${orderId}`,
        html: `
          <h1>Bonne nouvelle, ${customerName} !</h1>
          <p>Votre commande <strong>#${orderId}</strong> d'un montant de <strong>${totalAmount} DT</strong> a été <strong>validée</strong> par notre équipe.</p>
          <p>Nous préparons l'expédition. Vous la recevrez très prochainement !</p>
        `
      });

      res.json({ success: true, customerEmailResult: customerEmailResult.messageId });
    } catch(error) {
      handleError(res, error);
    }
  });

  // Endpoint to send cancellation mail to user
  app.post('/api/send-order-cancellation', async (req, res) => {
    try {
      const { customerEmail, customerName, orderId, reason } = req.body;
      
      if (checkMock()) {
         console.log(`[Mock Email] Would send CANCELLATION to ${customerEmail} for order ${orderId}`);
         return res.json({ success: true, mock: true });
      }

      const transporter = getTransporter();
      
      const customerEmailResult = await transporter.sendMail({
        from: getFromEmail(),
        to: customerEmail,
        subject: `Annulation de votre commande #${orderId}`,
        html: `
          <h1>Bonjour ${customerName},</h1>
          <p>Nous sommes au regret de vous informer que votre commande <strong>#${orderId}</strong> a dû être annulée.</p>
          ${reason ? `<p><strong>Motif:</strong> ${reason}</p>` : ''}
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        `
      });

      res.json({ success: true, customerEmailResult: customerEmailResult.messageId });
    } catch(error) {
      handleError(res, error);
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In Express v4 we use * 
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
