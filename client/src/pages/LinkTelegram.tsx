import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Loader2, Send } from "lucide-react";

export default function LinkTelegram() {
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const linkMutation = trpc.telegram.linkAccount.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.success) {
        setName("");
        setChatId("");
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        message: `حدث خطأ: ${error.message}`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!name.trim() || !chatId.trim()) {
      setResult({
        success: false,
        message: "يرجى إدخال الاسم و Chat ID",
      });
      return;
    }

    linkMutation.mutate({
      personName: name.trim(),
      chatId: chatId.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F4E78] via-[#2a5a8a] to-[#1F4E78] py-8 px-4">
      <div className="container max-w-2xl">
        <Card className="shadow-2xl border-[#D4AF37]/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Send className="w-16 h-16 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-3xl font-bold text-[#1F4E78]">
              ربط حساب Telegram
            </CardTitle>
            <CardDescription className="text-lg">
              اربط حسابك في Telegram لتلقي التنبيهات والتذكيرات
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* تعليمات */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm space-y-2">
                <p className="font-semibold text-blue-900">📱 كيفية الربط:</p>
                <ol className="list-decimal mr-6 space-y-1 text-blue-800">
                  <li>افتح البوت: <a href="https://t.me/rawda_khatma_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">@rawda_khatma_bot</a></li>
                  <li>اضغط "Start" لبدء المحادثة</li>
                  <li>أرسل الأمر: <code className="bg-blue-100 px-2 py-1 rounded">/start</code></li>
                  <li>انسخ الـ Chat ID الذي سيرسله البوت</li>
                  <li>الصقه هنا مع اسمك الكامل</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* النموذج */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">
                  الاسم الكامل
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="مثال: أحمد اللاذقاني"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg h-12"
                  disabled={linkMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  أدخل اسمك كما هو مسجل في قائمة المشاركين
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chatId" className="text-base font-semibold">
                  Telegram Chat ID
                </Label>
                <Input
                  id="chatId"
                  type="text"
                  placeholder="مثال: 123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="text-lg h-12 font-mono"
                  disabled={linkMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  الصق الـ Chat ID الذي حصلت عليه من البوت
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-[#1F4E78] hover:bg-[#1F4E78]/90"
                disabled={linkMutation.isPending}
              >
                {linkMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الربط...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-5 w-5" />
                    ربط الحساب
                  </>
                )}
              </Button>
            </form>

            {/* النتيجة */}
            {result && (
              <Alert
                className={
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <AlertDescription
                    className={
                      result.success ? "text-green-800" : "text-red-800"
                    }
                  >
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* معلومات إضافية */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                💡 ملاحظات مهمة:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 mr-6 list-disc">
                <li>تأكد من كتابة اسمك بالضبط كما هو في القائمة</li>
                <li>يمكنك ربط حساب واحد فقط لكل شخص</li>
                <li>ستصلك رسالة ترحيب من البوت عند نجاح الربط</li>
                <li>يمكنك إلغاء الربط في أي وقت من خلال المشرف</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* رابط العودة */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white hover:text-[#D4AF37] transition-colors font-semibold"
          >
            ← العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
