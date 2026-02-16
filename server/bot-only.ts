import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import telegramWebhook from "./telegramWebhook";
import { startScheduler } from "./scheduler";
import { startHealthMonitoring } from "./botHealthMonitor";
import { startKeepAliveSystem } from "./keepAlive";

async function startBotServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "Quran Khatma Tracker Bot" });
  });

  // Telegram webhook
  app.use(telegramWebhook);

  // tRPC API (for database operations)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Simple homepage
  app.get("/", (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>بوت تتبع الختمة القرآنية</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
          h1 { font-size: 2.5rem; margin-bottom: 1rem; }
          p { font-size: 1.2rem; margin: 1rem 0; }
          a {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 2rem;
            transition: transform 0.3s;
          }
          a:hover { transform: scale(1.05); }
          .status { 
            background: rgba(76, 175, 80, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 10px;
            display: inline-block;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🕌 بوت تتبع الختمة القرآنية</h1>
          <p>البوت يعمل بنجاح على Railway</p>
          <div class="status">✅ الحالة: نشط</div>
          <p>للاستخدام، افتح Telegram وابحث عن:</p>
          <a href="https://t.me/rawda_khatma_bot" target="_blank">@rawda_khatma_bot</a>
        </div>
      </body>
      </html>
    `);
  });

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Bot server running on port ${port}`);
    console.log(`📱 Telegram webhook ready at /api/telegram/webhook`);
    
    // Start scheduler for automatic notifications
    startScheduler();
    console.log("⏰ Scheduler started");
    
    // Start bot health monitoring
    startHealthMonitoring();
    console.log("🏥 Health monitoring started");
    
    // Start keep-alive system
    startKeepAliveSystem();
    console.log("💓 Keep-alive system started");
  });
}

startBotServer().catch((error) => {
  console.error("❌ Failed to start bot server:", error);
  process.exit(1);
});
