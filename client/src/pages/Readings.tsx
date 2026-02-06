import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { exportReadings } from "@/lib/exportUtils";
import { getQuranJuzLink } from "@/../../shared/quranLinks";

export default function Readings() {
  const [selectedFriday, setSelectedFriday] = useState<number>(181);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const utils = trpc.useUtils();
  const { data: fridays } = trpc.fridays.getAll.useQuery();
  const { data: readings, isLoading } = trpc.readings.getByFriday.useQuery(
    { fridayNumber: selectedFriday },
    { enabled: !!selectedFriday }
  );

  // التحديث التلقائي كل 30 ثانية
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      utils.readings.getByFriday.invalidate({ fridayNumber: selectedFriday });
      setLastUpdate(new Date());
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [autoRefresh, selectedFriday, utils]);

  const updateStatus = trpc.readings.updateStatus.useMutation({
    onSuccess: () => {
      utils.readings.getByFriday.invalidate({ fridayNumber: selectedFriday });
      utils.stats.getFridayStats.invalidate({ fridayNumber: selectedFriday });
      setLastUpdate(new Date());
      toast.success("✅ تم تحديث حالة القراءة بنجاح");
    },
    onError: () => {
      toast.error("❌ حدث خطأ أثناء تحديث الحالة");
    },
  });

  const filteredReadings = useMemo(() => {
    if (!readings) return [];
    if (!searchTerm) return readings;

    const term = searchTerm.toLowerCase();
    return readings.filter(
      (r) =>
        r.person1Name.toLowerCase().includes(term) ||
        r.person2Name.toLowerCase().includes(term) ||
        r.person3Name.toLowerCase().includes(term)
    );
  }, [readings, searchTerm]);

  const handleCheckboxChange = (
    readingId: number,
    personNumber: 1 | 2 | 3,
    currentStatus: boolean
  ) => {
    updateStatus.mutate({
      readingId,
      personNumber,
      status: !currentStatus,
    });
  };

  const handleManualRefresh = () => {
    utils.readings.getByFriday.invalidate({ fridayNumber: selectedFriday });
    setLastUpdate(new Date());
    toast.success("🔄 تم تحديث البيانات");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل القراءات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>📖</span>
              جدول القراءات
            </h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-2 px-3 py-1">
                <CheckCircle2 className="h-4 w-4" />
                متصل بـ Telegram
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Friday Selector */}
          <Card>
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">اختيار الجمعة</label>
              <Select
                value={selectedFriday.toString()}
                onValueChange={(value) => setSelectedFriday(Number(value))}
              >
                <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">البحث عن شخص</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث باسم الشخص..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto Refresh Control */}
          <Card>
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">التحديث التلقائي</label>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="flex-1"
                >
                  {autoRefresh ? "مفعّل" : "معطّل"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                آخر تحديث: {formatLastUpdate()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">تكامل Telegram نشط</p>
            <p>
              عندما يرسل المشارك <code className="bg-blue-100 px-1 rounded">/تم</code> في البوت،
              سيتم تحديث الجدول تلقائياً خلال 30 ثانية. يمكنك أيضاً الضغط على "تحديث" للتحديث الفوري.
            </p>
          </div>
        </div>

        {/* Readings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              القراءات - الجمعة {selectedFriday}
              {searchTerm && ` (نتائج البحث: ${filteredReadings.length})`}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (readings) {
                  exportReadings(readings, selectedFriday);
                  toast.success("✅ تم تصدير البيانات بنجاح");
                }
              }}
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير CSV
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary/20">
                    <th className="p-3 text-right font-bold">الجزء</th>
                    <th className="p-3 text-right font-bold">رابط المصحف</th>
                    <th className="p-3 text-right font-bold">الختمة</th>
                    <th className="p-3 text-right font-bold">المجموعة</th>
                    <th className="p-3 text-right font-bold" colSpan={3}>الشخص الأول</th>
                    <th className="p-3 text-right font-bold" colSpan={3}>الشخص الثاني</th>
                    <th className="p-3 text-right font-bold" colSpan={3}>الشخص الثالث</th>
                  </tr>
                  <tr className="bg-muted/50 text-xs border-b">
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-center">الحالة</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-center">الحالة</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-center">الحالة</th>
                    <th className="p-2 text-right">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-muted-foreground">
                        لا توجد نتائج
                      </td>
                    </tr>
                  ) : (
                    filteredReadings.map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{reading.juzNumber}</td>
                        <td className="p-3">
                          <a
                            href={getQuranJuzLink(reading.juzNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                          >
                            📝 افتح المصحف
                          </a>
                        </td>
                        <td className="p-3">{reading.khatmaNumber}</td>
                        <td className="p-3">{reading.groupNumber}</td>
                        
                        {/* Person 1 */}
                        <td className="p-3">{reading.person1Name}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={reading.person1Status}
                              onCheckedChange={() =>
                                handleCheckboxChange(reading.id, 1, reading.person1Status)
                              }
                            />
                            {reading.person1Status && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {reading.person1Status ? (
                            <span className="text-green-700 font-medium">
                              {formatDate(reading.person1Date)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        
                        {/* Person 2 */}
                        <td className="p-3">{reading.person2Name}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={reading.person2Status}
                              onCheckedChange={() =>
                                handleCheckboxChange(reading.id, 2, reading.person2Status)
                              }
                            />
                            {reading.person2Status && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {reading.person2Status ? (
                            <span className="text-green-700 font-medium">
                              {formatDate(reading.person2Date)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        
                        {/* Person 3 */}
                        <td className="p-3">{reading.person3Name}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={reading.person3Status}
                              onCheckedChange={() =>
                                handleCheckboxChange(reading.id, 3, reading.person3Status)
                              }
                            />
                            {reading.person3Status && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {reading.person3Status ? (
                            <span className="text-green-700 font-medium">
                              {formatDate(reading.person3Date)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {filteredReadings.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {filteredReadings.length}
                    </p>
                    <p className="text-sm text-muted-foreground">إجمالي القراءات</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredReadings.filter(r => r.person1Status && r.person2Status && r.person3Status).length}
                    </p>
                    <p className="text-sm text-muted-foreground">مكتملة</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {filteredReadings.filter(r => !r.person1Status || !r.person2Status || !r.person3Status).length}
                    </p>
                    <p className="text-sm text-muted-foreground">منتظرة</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
