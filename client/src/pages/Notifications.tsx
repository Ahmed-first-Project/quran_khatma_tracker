import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Send, Clock, CheckCircle2, XCircle, Users, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Notifications() {
  const [selectedFriday, setSelectedFriday] = useState<number>(181);
  const [isSending, setIsSending] = useState(false);

  // جلب البيانات
  const { data: fridays } = trpc.fridays.getAll.useQuery();
  const { data: pendingReadings, refetch: refetchPending } = trpc.notifications.getPendingReadings.useQuery(
    { fridayNumber: selectedFriday },
    { enabled: !!selectedFriday }
  );
  const { data: notificationHistory } = trpc.notifications.getByFriday.useQuery(
    { fridayNumber: selectedFriday },
    { enabled: !!selectedFriday }
  );
  const { data: settings, refetch: refetchSettings } = trpc.notifications.getSettings.useQuery();

  // Mutations
  const sendRemindersMutation = trpc.notifications.sendReminders.useMutation({
    onSuccess: (result) => {
      toast.success(`تم إرسال ${result.sent} تذكير بنجاح`);
      if (result.failed > 0) {
        toast.error(`فشل إرسال ${result.failed} تذكير`);
      }
      refetchPending();
    },
    onError: (error) => {
      toast.error(`خطأ في إرسال التذكيرات: ${error.message}`);
    },
  });

  const updateSettingMutation = trpc.notifications.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الإعداد بنجاح");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`خطأ في تحديث الإعداد: ${error.message}`);
    },
  });

  // الحصول على قيمة إعداد معين
  const getSetting = (key: string) => {
    return settings?.find(s => s.settingKey === key)?.settingValue || '';
  };

  // تحديث إعداد
  const handleUpdateSetting = (key: string, value: string, description?: string) => {
    updateSettingMutation.mutate({ key, value, description });
  };

  // إرسال التذكيرات
  const handleSendReminders = async () => {
    if (!selectedFriday) {
      toast.error("يرجى اختيار جمعة");
      return;
    }

    setIsSending(true);
    try {
      await sendRemindersMutation.mutateAsync({
        fridayNumber: selectedFriday,
        notificationType: 'manual',
      });
    } finally {
      setIsSending(false);
    }
  };

  const autoRemindersEnabled = getSetting('auto_reminders_enabled') === 'true';
  const currentFridayNumber = parseInt(getSetting('current_friday_number')) || 181;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bell className="w-8 h-8 text-[#1F4E78]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#1F4E78]">
              إدارة الإشعارات
            </h1>
          </div>
          <p className="text-gray-600">
            إرسال تذكيرات للمشاركين وإدارة الإشعارات التلقائية
          </p>
        </div>

        {/* الإعدادات */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات الإشعارات التلقائية
            </CardTitle>
            <CardDescription>
              تفعيل وإدارة التذكيرات التلقائية التي ترسل كل خميس الساعة 6 مساءً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-reminders">تفعيل التذكيرات التلقائية</Label>
                <p className="text-sm text-muted-foreground">
                  إرسال تذكيرات تلقائية كل خميس الساعة 6 مساءً
                </p>
              </div>
              <Switch
                id="auto-reminders"
                checked={autoRemindersEnabled}
                onCheckedChange={(checked) => {
                  handleUpdateSetting(
                    'auto_reminders_enabled',
                    checked ? 'true' : 'false',
                    'تفعيل/تعطيل التذكيرات التلقائية'
                  );
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-friday">رقم الجمعة الحالية</Label>
              <Select
                value={currentFridayNumber.toString()}
                onValueChange={(value) => {
                  handleUpdateSetting(
                    'current_friday_number',
                    value,
                    'رقم الجمعة الحالية للتذكيرات التلقائية'
                  );
                }}
              >
                <SelectTrigger id="current-friday">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fridays?.map((friday) => (
                    <SelectItem key={friday.id} value={friday.fridayNumber.toString()}>
                      الجمعة {friday.fridayNumber} - {friday.dateGregorian}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                سيتم إرسال التذكيرات التلقائية للمشاركين المتأخرين في هذه الجمعة
              </p>
            </div>
          </CardContent>
        </Card>

        {/* إرسال تذكيرات يدوية */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              إرسال تذكيرات يدوية
            </CardTitle>
            <CardDescription>
              اختر جمعة وأرسل تذكيرات فورية لجميع المشاركين المتأخرين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select
                value={selectedFriday?.toString()}
                onValueChange={(value) => setSelectedFriday(parseInt(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="اختر جمعة" />
                </SelectTrigger>
                <SelectContent>
                  {fridays?.map((friday) => (
                    <SelectItem key={friday.id} value={friday.fridayNumber.toString()}>
                      الجمعة {friday.fridayNumber} - {friday.dateGregorian}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleSendReminders}
                disabled={isSending || !selectedFriday || (pendingReadings?.length || 0) === 0}
                className="gap-2 bg-[#1F4E78] hover:bg-[#1F4E78]/90"
              >
                <Send className="w-4 h-4" />
                {isSending ? "جاري الإرسال..." : "إرسال التذكيرات"}
              </Button>
            </div>

            {/* المشاركون المتأخرون */}
            {pendingReadings && pendingReadings.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  المشاركون المتأخرون ({pendingReadings.length})
                </div>
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {pendingReadings.map((reading, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span className="font-medium">{reading.name}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>الجزء {reading.juzNumber}</span>
                        <span>•</span>
                        <span>المجموعة {reading.groupNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingReadings && pendingReadings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>جميع المشاركين أكملوا قراءاتهم! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* سجل الإشعارات */}
        <Card className="border-2 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              سجل الإشعارات
            </CardTitle>
            <CardDescription>
              آخر الإشعارات المرسلة للجمعة المختارة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationHistory && notificationHistory.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {notificationHistory.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.recipientName}</span>
                        <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                          {notification.status === 'sent' ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> تم الإرسال</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> فشل</>
                          )}
                        </Badge>
                        <Badge variant="outline">{notification.notificationType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString('ar-SA')}
                      </p>
                      {notification.errorMessage && (
                        <p className="text-sm text-destructive mt-1">{notification.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2" />
                <p>لا توجد إشعارات مرسلة لهذه الجمعة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
