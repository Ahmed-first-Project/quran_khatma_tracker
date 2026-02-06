/**
 * Bot Health Monitor
 * نظام مراقبة صحة البوت وإرسال تنبيهات للمشرف
 */

import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// آخر وقت تم فيه استقبال update من Telegram
let lastUpdateTime = Date.now();

// عداد الأخطاء المتتالية
let consecutiveErrors = 0;

// حالة البوت
interface BotHealth {
  isHealthy: boolean;
  lastUpdateTime: number;
  consecutiveErrors: number;
  lastError?: string;
}

/**
 * تحديث وقت آخر update
 */
export function recordUpdate(): void {
  lastUpdateTime = Date.now();
  consecutiveErrors = 0;
}

/**
 * تسجيل خطأ
 */
export function recordError(error: string): void {
  consecutiveErrors++;
  console.error(`[Bot Health] Error recorded (${consecutiveErrors} consecutive):`, error);
}

/**
 * الحصول على حالة صحة البوت
 */
export function getBotHealth(): BotHealth {
  const timeSinceLastUpdate = Date.now() - lastUpdateTime;
  const isHealthy = timeSinceLastUpdate < 5 * 60 * 1000 && consecutiveErrors < 5; // 5 دقائق و 5 أخطاء
  
  return {
    isHealthy,
    lastUpdateTime,
    consecutiveErrors,
  };
}

/**
 * فحص اتصال البوت مع Telegram
 */
export async function checkBotConnection(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[Bot Health] Bot token not configured");
    return false;
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`, {
      timeout: 5000,
    });
    
    if (response.data.ok) {
      console.log(`[Bot Health] Bot connection OK - @${response.data.result.username}`);
      return true;
    } else {
      console.error("[Bot Health] Bot connection failed:", response.data);
      return false;
    }
  } catch (error: any) {
    console.error("[Bot Health] Bot connection error:", error.message);
    return false;
  }
}

/**
 * فحص webhook
 */
export async function checkWebhook(): Promise<{ url: string; isSet: boolean }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { url: "", isSet: false };
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getWebhookInfo`, {
      timeout: 5000,
    });
    
    if (response.data.ok) {
      const webhookInfo = response.data.result;
      console.log(`[Bot Health] Webhook info:`, {
        url: webhookInfo.url,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message,
      });
      
      return {
        url: webhookInfo.url || "",
        isSet: !!webhookInfo.url,
      };
    } else {
      console.error("[Bot Health] Failed to get webhook info:", response.data);
      return { url: "", isSet: false };
    }
  } catch (error: any) {
    console.error("[Bot Health] Webhook check error:", error.message);
    return { url: "", isSet: false };
  }
}

/**
 * بدء مراقبة صحة البوت (كل 5 دقائق)
 */
export function startHealthMonitoring(): void {
  console.log("[Bot Health] Starting health monitoring...");
  
  // فحص فوري
  checkBotConnection();
  checkWebhook();
  
  // فحص دوري كل 5 دقائق
  setInterval(async () => {
    const health = getBotHealth();
    
    if (!health.isHealthy) {
      console.warn(`[Bot Health] ⚠️ Bot health warning:`, {
        timeSinceLastUpdate: Math.floor((Date.now() - health.lastUpdateTime) / 1000 / 60) + " minutes",
        consecutiveErrors: health.consecutiveErrors,
      });
      
      // فحص الاتصال
      const isConnected = await checkBotConnection();
      if (!isConnected) {
        console.error("[Bot Health] ❌ Bot connection lost!");
      }
      
      // فحص webhook
      const webhookInfo = await checkWebhook();
      if (!webhookInfo.isSet) {
        console.error("[Bot Health] ❌ Webhook not set!");
      }
    } else {
      console.log("[Bot Health] ✅ Bot is healthy");
    }
  }, 5 * 60 * 1000); // كل 5 دقائق
}
