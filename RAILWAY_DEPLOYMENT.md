# دليل نشر المشروع على Railway

## المتطلبات
- حساب Railway: https://railway.app
- حساب GitHub
- Telegram Bot Token

## خطوات النشر

### 1. رفع الكود على GitHub

```bash
cd /home/ubuntu/quran_khatma_tracker
git init
git add .
git commit -m "Initial commit: Quran Khatma Tracker"
git remote add origin https://github.com/Ahmed-first-Project/quran_khatma_tracker.git
git push -u origin main
```

### 2. إنشاء مشروع على Railway

1. افتح https://railway.app
2. اضغط "New Project"
3. اختر "Deploy from GitHub repo"
4. اختر المستودع: `Ahmed-first-Project/quran_khatma_tracker`

### 3. إضافة قاعدة بيانات MySQL

1. في لوحة Railway، اضغط "+ New"
2. اختر "Database" → "MySQL"
3. انتظر حتى يتم إنشاء قاعدة البيانات

### 4. إعداد المتغيرات البيئية

في لوحة Railway، اذهب إلى "Variables" وأضف:

```
NODE_ENV=production
DATABASE_URL=${{MySQL.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=<ضع_التوكن_هنا>
PORT=3000
```

**ملاحظة:** `${{MySQL.DATABASE_URL}}` سيتم استبداله تلقائياً برابط قاعدة البيانات.

### 5. نشر المشروع

1. اضغط "Deploy"
2. انتظر حتى يكتمل البناء (Build)
3. ستحصل على رابط المشروع (مثل: `https://quran-khatma-tracker.up.railway.app`)

### 6. تحديث Telegram Webhook

استخدم هذا الأمر لتحديث webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<railway-url>/api/telegram/webhook"}'
```

استبدل:
- `<TELEGRAM_BOT_TOKEN>` بالتوكن الخاص بك
- `<railway-url>` برابط المشروع على Railway

### 7. نقل البيانات

سيتم توفير سكريبت لنقل البيانات من Manus إلى Railway.

## التحقق من عمل البوت

1. افتح Telegram
2. ابحث عن البوت: `@rawda_khatma_bot`
3. أرسل `/start`
4. تحقق من استجابة البوت

## الصيانة

- **السجلات (Logs):** اذهب إلى "Deployments" → "View Logs"
- **إعادة التشغيل:** اضغط "Restart"
- **التحديثات:** فقط اعمل `git push` وسيتم النشر تلقائياً

## المميزات

✅ **عمل 24/7** بدون انقطاع
✅ **تحديث تلقائي** عند push إلى GitHub
✅ **سجلات مباشرة** (Real-time logs)
✅ **قاعدة بيانات مدمجة** (MySQL)
✅ **مجاني** للمشاريع الصغيرة ($5 رصيد شهري)

## الدعم

إذا واجهت أي مشكلة:
1. تحقق من السجلات في Railway
2. تحقق من المتغيرات البيئية
3. تحقق من webhook URL في Telegram
