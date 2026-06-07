import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const apiKey = process.env.MOYASAR_SECRET_KEY;
      if (!apiKey) {
        throw new Error('مفتاح MOYASAR_SECRET_KEY غير موجود في ملف .env');
      }

      const { plan, userId } = req.body;
      const amount = plan === 'monthly' ? 2600 : 26000; // 26 SAR or 260 SAR (in halalas)
      
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      
      const response = await fetch('https://api.moyasar.com/v1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64')
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'SAR',
          description: `اشتراك معلم Pro - ${plan === 'monthly' ? 'شهري' : 'سنوي'}`,
          success_url: `${appUrl}/settings?payment=success&plan=${plan}`,
          back_url: `${appUrl}/settings?payment=cancel`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في إنشاء فاتورة ميسر');
      }

      res.json({ id: data.id, url: data.url });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'حدث خطأ في بوابة الدفع.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
