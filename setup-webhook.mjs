import 'dotenv/config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `https://3000-in77ue6pwa0mxr69upg56-f19f248a.sg1.manus.computer/api/telegram/webhook`;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

console.log('🔧 Setting up Telegram webhook...');
console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);

try {
  // تفعيل Webhook
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message'],
      }),
    }
  );

  const data = await response.json();

  if (data.ok) {
    console.log('✅ Webhook set successfully!');
    console.log('📋 Response:', data.result);
    
    // التحقق من معلومات Webhook
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const infoData = await infoResponse.json();
    
    if (infoData.ok) {
      console.log('\n📊 Webhook Info:');
      console.log('   URL:', infoData.result.url);
      console.log('   Pending updates:', infoData.result.pending_update_count);
      console.log('   Last error:', infoData.result.last_error_message || 'None');
    }
  } else {
    console.error('❌ Failed to set webhook:', data.description);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
