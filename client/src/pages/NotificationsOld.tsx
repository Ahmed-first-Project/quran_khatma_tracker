import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Send, Users, UserCheck } from "lucide-react";

export default function Notifications() {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState<"all" | "admins">("all");

  const sendToAll = trpc.notifications.sendToAll.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إرسال الرسالة إلى ${data.count} شخص`);
      setMessage("");
    },
    onError: () => {
      toast.error("فشل إرسال الرسالة");
    },
  });

  const sendToAdmins = trpc.notifications.sendToAdmins.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إرسال الرسالة إلى ${data.count} مشرف`);
      setMessage("");
    },
    onError: () => {
      toast.error("فشل إرسال الرسالة");
    },
  });

  const sendDailyReport = trpc.notifications.sendDailyReport.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال التقرير اليومي للمشرفين");
    },
    onError: () => {
      toast.error("فشل إرسال التقرير");
    },
  });

  const sendWeeklyReminder = trpc.notifications.sendWeeklyReminder.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال التذكير الأسبوعي");
    },
    onError: () => {
      toast.error("فشل إرسال التذكير");
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("الرجاء كتابة رسالة");
      return;
    }

    if (recipient === "all") {
      sendToAll.mutate({ message });
    } else {
      sendToAdmins.mutate({ message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bell className="w-8 h-8 text-[#1F4E78]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#1F4E78]">
              إدارة التنبيهات
            </h1>
          </div>
          <p className="text-gray-600">
            إرسال رسائل وتنبيهات للمشاركين عبر Telegram
          </p>
        </div>

        {/* إرسال رسالة مخصصة */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              إرسال رسالة مخصصة
            </CardTitle>
            <CardDescription>
              أرسل رسالة مخصصة لجميع المشاركين أو للمشرفين فقط
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>المستلمون</Label>
              <div className="flex gap-2">
                <Button
                  variant={recipient === "all" ? "default" : "outline"}
                  onClick={() => setRecipient("all")}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 ml-2" />
                  جميع المشاركين
                </Button>
                <Button
                  variant={recipient === "admins" ? "default" : "outline"}
                  onClick={() => setRecipient("admins")}
                  className="flex-1"
                >
                  <UserCheck className="w-4 h-4 ml-2" />
                  المشرفون فقط
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sendToAll.isPending || sendToAdmins.isPending || !message.trim()}
              className="w-full bg-[#1F4E78] hover:bg-[#1F4E78]/90"
            >
              {(sendToAll.isPending || sendToAdmins.isPending) ? "جاري الإرسال..." : "إرسال الرسالة"}
            </Button>
          </CardContent>
        </Card>

        {/* إجراءات سريعة */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>
              إرسال تقارير وتذكيرات تلقائية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => sendDailyReport.mutate()}
              disabled={sendDailyReport.isPending}
              variant="outline"
              className="w-full justify-start"
            >
              📊 إرسال التقرير اليومي للمشرفين
            </Button>

            <Button
              onClick={() => {
                const fridayNumber = parseInt(prompt("أدخل رقم الجمعة (181-210):") || "181");
                if (fridayNumber >= 181 && fridayNumber <= 210) {
                  sendWeeklyReminder.mutate({ fridayNumber });
                } else {
                  toast.error("رقم الجمعة غير صحيح");
                }
              }}
              disabled={sendWeeklyReminder.isPending}
              variant="outline"
              className="w-full justify-start"
            >
              🌙 إرسال تذكير أسبوعي للمشاركين
            </Button>
          </CardContent>
        </Card>

        {/* معلومات */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-semibold">ملاحظات:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>يتم إرسال الرسائل فقط للمشاركين الذين ربطوا حساباتهم بـ Telegram</li>
                <li>التقرير اليومي يحتوي على إحصائيات القراءات المكتملة اليوم</li>
                <li>التذكير الأسبوعي يُرسل قبل موعد الجمعة بيوم واحد</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
