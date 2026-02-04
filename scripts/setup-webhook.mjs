import * as dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = "https://3000-in77ue6pwa0mxr69upg56-f19f248a.sg1.manus.computer/api/telegram/webhook";

async function setupWebhook() {
  try {
    console.log("🔄 جاري تفعيل Webhook للبوت...");
    console.log(`📡 URL: ${WEBHOOK_URL}`);

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ["message"],
        }),
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log("✅ تم تفعيل Webhook بنجاح!");
      console.log(`📝 الوصف: ${data.description}`);
    } else {
      console.error("❌ فشل تفعيل Webhook:");
      console.error(data);
    }

    // التحقق من حالة Webhook
    console.log("\n🔍 جاري التحقق من حالة Webhook...");
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const infoData = await infoResponse.json();

    if (infoData.ok) {
      console.log("📊 معلومات Webhook:");
      console.log(`   URL: ${infoData.result.url}`);
      console.log(`   عدد التحديثات المعلقة: ${infoData.result.pending_update_count}`);
      if (infoData.result.last_error_message) {
        console.log(`   آخر خطأ: ${infoData.result.last_error_message}`);
      }
    }
  } catch (error) {
    console.error("❌ خطأ:", error);
  }
}

setupWebhook();
