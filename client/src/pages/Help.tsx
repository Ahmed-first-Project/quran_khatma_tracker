import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, MessageCircle, Bell, Users, HelpCircle, CheckCircle2 } from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-[#1F4E78]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#1F4E78]">
              دليل الاستخدام
            </h1>
          </div>
          <p className="text-gray-600">
            كل ما تحتاج معرفته لاستخدام التطبيق بسهولة
          </p>
        </div>

        {/* للمشاركين الجدد */}
        <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F4E78]">
              <Users className="w-6 h-6" />
              للمشاركين الجدد - خطوات البدء
            </CardTitle>
            <CardDescription>
              اتبع هذه الخطوات البسيطة للبدء في استخدام النظام
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F4E78]">تأكد من إضافتك إلى النظام</h3>
                  <p className="text-sm text-gray-600">
                    تواصل مع المشرف للتأكد من أن اسمك مضاف إلى قائمة المشاركين
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F4E78]">افتح البوت على Telegram</h3>
                  <p className="text-sm text-gray-600">
                    احصل على رابط البوت من المشرف واضغط عليه لفتحه في Telegram
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F4E78]">اضغط "Start" أو "ابدأ"</h3>
                  <p className="text-sm text-gray-600">
                    في أول مرة تفتح البوت، اضغط على زر "Start" في أسفل الشاشة
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F4E78]">أرسل اسمك الكامل</h3>
                  <p className="text-sm text-gray-600">
                    اكتب اسمك الكامل <strong>بالضبط</strong> كما هو مسجل في النظام وأرسله للبوت
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-sm text-[#1F4E78]">مثال: أحمد محمد العلي</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-600">تم الربط بنجاح!</h3>
                  <p className="text-sm text-gray-600">
                    سيرسل لك البوت رسالة تأكيد. الآن يمكنك تسجيل قراءاتك واستقبال التذكيرات
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الأزرار التفاعلية */}
        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <MessageCircle className="w-5 h-5" />
              الأزرار التفاعلية في البوت
            </CardTitle>
            <CardDescription>
              استخدم الأزرار التفاعلية لتجربة أسهل وأسرع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-700 mb-4">
                البوت يوفر أزراراً تفاعلية تظهر تلقائياً بعد كل رسالة، مما يسهل عليك التنقل واستخدام الميزات:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">🕌 ابدأ الآن</div>
                  <p className="text-xs text-gray-600">رسالة ترحيب ومعلومات البرنامج</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">🏠 القائمة الرئيسية</div>
                  <p className="text-xs text-gray-600">عرض معلوماتك وجميع الأزرار</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">✅ سجّل قراءتك</div>
                  <p className="text-xs text-gray-600">تسجيل سريع للقراءة الحالية</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">📊 إحصائياتي</div>
                  <p className="text-xs text-gray-600">عرض حالة قراءاتك وترتيبك</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">📖 افتح المصحف</div>
                  <p className="text-xs text-gray-600">رابط مباشر للمصحف الشريف</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">🤲 دعاء ختم القرآن</div>
                  <p className="text-xs text-gray-600">دعاء الختم كاملاً</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">💬 نصائح القراءة</div>
                  <p className="text-xs text-gray-600">نصائح لتحسين القراءة</p>
                </div>
                <div className="p-3 bg-white border-2 border-green-200 rounded-lg">
                  <div className="font-semibold text-green-700 mb-1">❓ المساعدة</div>
                  <p className="text-xs text-gray-600">شرح جميع الأوامر</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-sm text-green-900">
                  💡 <strong>نصيحة:</strong> استخدم الأزرار بدلاً من كتابة الأوامر لتجربة أسرع وأسهل!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أوامر البوت */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              أوامر البوت
            </CardTitle>
            <CardDescription>
              الأوامر المتاحة للاستخدام في Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <code className="px-3 py-1 bg-[#1F4E78] text-white rounded font-mono text-sm">
                    /تم
                  </code>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">تسجيل القراءة</h3>
                    <p className="text-sm text-gray-600">
                      يسجل تلقائياً أول قراءة منتظرة لك. لا تحتاج إلى تحديد رقم الجمعة أو الجزء - سيتولى البوت ذلك تلقائياً.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <code className="px-3 py-1 bg-[#1F4E78] text-white rounded font-mono text-sm">
                    /help
                  </code>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">المساعدة</h3>
                    <p className="text-sm text-gray-600">
                      يعرض قائمة بجميع الأوامر المتاحة مع شرح مختصر لكل أمر.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <code className="px-3 py-1 bg-[#1F4E78] text-white rounded font-mono text-sm">
                    /حالتي
                  </code>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">عرض الحالة</h3>
                    <p className="text-sm text-gray-600">
                      يعرض ملخصاً لحالة قراءاتك: عدد القراءات المكتملة، المنتظرة، آخر قراءة مسجلة، وترتيبك في مجموعتك.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* التذكيرات التلقائية */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              التذكيرات التلقائية
            </CardTitle>
            <CardDescription>
              كيف يعمل نظام التذكيرات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700">
              إذا لم تسجل قراءتك حتى يوم الخميس، سيرسل لك البوت تذكيراً تلقائياً <strong>الساعة 6 مساءً بتوقيت الرياض</strong>.
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                💡 <strong>نصيحة:</strong> يمكنك تسجيل قراءتك في أي وقت قبل يوم الخميس لتجنب استلام التذكير.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* الأسئلة الشائعة */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              الأسئلة الشائعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>نسيت اسمي المسجل في النظام، كيف أعرفه؟</AccordionTrigger>
                <AccordionContent>
                  تواصل مع المشرف وسيزودك بالاسم الصحيح المسجل في النظام.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>أرسلت اسمي لكن البوت يقول أن الاسم غير موجود؟</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>تأكد من كتابة الاسم بنفس الطريقة المسجلة في النظام (نفس الحروف والمسافات).</p>
                    <p>إذا استمرت المشكلة، تواصل مع المشرف للتأكد من أن اسمك مضاف إلى النظام.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>أرسلت /تم لكن البوت يقول لا توجد قراءات منتظرة؟</AccordionTrigger>
                <AccordionContent>
                  هذا يعني أنك سجلت جميع قراءاتك المتاحة حتى الآن. انتظر حتى تبدأ الجمعة التالية.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>هل يمكنني تسجيل قراءة لجمعة سابقة؟</AccordionTrigger>
                <AccordionContent>
                  نعم، أمر <code>/تم</code> يسجل تلقائياً أقدم قراءة منتظرة لك. إذا كان لديك قراءات متأخرة، سيسجلها البوت بالترتيب.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>لم أستلم تذكيراً يوم الخميس؟</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>تأكد من أنك ربطت حسابك بالبوت بنجاح.</p>
                    <p>إذا كنت قد سجلت قراءتك قبل يوم الخميس، فلن تستلم تذكيراً.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>هل يمكنني إلغاء تسجيل قراءة بالخطأ؟</AccordionTrigger>
                <AccordionContent>
                  لا يمكن إلغاء التسجيل من خلال البوت. تواصل مع المشرف لتعديل السجل يدوياً.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>غيّرت رقم هاتفي أو حساب Telegram، ماذا أفعل؟</AccordionTrigger>
                <AccordionContent>
                  أرسل اسمك الكامل مرة أخرى من الحساب الجديد لتحديث الربط.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>هل يجب كتابة الأوامر أم يمكنني استخدام الأزرار؟</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>يمكنك استخدام الأزرار التفاعلية بدلاً من كتابة الأوامر - وهذا أسهل وأسرع!</p>
                    <p>الأزرار تظهر تلقائياً بعد كل رسالة من البوت.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>كيف أعرف أي جزء يجب أن أقرأ هذا الأسبوع؟</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>اضغط على زر "🏠 القائمة الرئيسية" في البوت.</p>
                    <p>سيعرض لك البوت معلوماتك: الجمعة الحالية، المجموعة، والجزء المخصص لك.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card className="bg-gradient-to-br from-[#1F4E78]/5 to-[#D4AF37]/5 border-2 border-[#D4AF37]/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-gray-700">
                إذا واجهت أي مشكلة غير مذكورة هنا، تواصل مع المشرف للحصول على المساعدة.
              </p>
              <p className="text-[#1F4E78] font-semibold">
                نسأل الله أن يتقبل منا ومنكم صالح الأعمال 🤲
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
