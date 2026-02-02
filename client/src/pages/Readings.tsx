import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { exportReadings } from "@/lib/exportUtils";

export default function Readings() {
  const [selectedFriday, setSelectedFriday] = useState<number>(181);
  const [searchTerm, setSearchTerm] = useState("");
  
  const utils = trpc.useUtils();
  const { data: fridays } = trpc.fridays.getAll.useQuery();
  const { data: readings, isLoading } = trpc.readings.getByFriday.useQuery(
    { fridayNumber: selectedFriday },
    { enabled: !!selectedFriday }
  );

  const updateStatus = trpc.readings.updateStatus.useMutation({
    onSuccess: () => {
      utils.readings.getByFriday.invalidate({ fridayNumber: selectedFriday });
      utils.stats.getFridayStats.invalidate({ fridayNumber: selectedFriday });
      toast.success("تم تحديث حالة القراءة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>📖</span>
            جدول القراءات
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  toast.success("تم تصدير البيانات بنجاح");
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
                    <th className="p-2 text-center">☑</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-center">☑</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-center">☑</th>
                    <th className="p-2 text-right">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.map((reading) => (
                    <tr
                      key={reading.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">{reading.juzNumber}</td>
                      <td className="p-3">{reading.khatmaNumber}</td>
                      <td className="p-3">{reading.groupNumber}</td>
                      
                      {/* Person 1 */}
                      <td className="p-3">{reading.person1Name}</td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={reading.person1Status}
                          onCheckedChange={() =>
                            handleCheckboxChange(reading.id, 1, reading.person1Status)
                          }
                          className={`w-6 h-6 ${
                            reading.person1Status ? "checkbox-completed" : "checkbox-pending"
                          }`}
                        />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(reading.person1Date)}
                      </td>
                      
                      {/* Person 2 */}
                      <td className="p-3">{reading.person2Name}</td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={reading.person2Status}
                          onCheckedChange={() =>
                            handleCheckboxChange(reading.id, 2, reading.person2Status)
                          }
                          className={`w-6 h-6 ${
                            reading.person2Status ? "checkbox-completed" : "checkbox-pending"
                          }`}
                        />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(reading.person2Date)}
                      </td>
                      
                      {/* Person 3 */}
                      <td className="p-3">{reading.person3Name}</td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={reading.person3Status}
                          onCheckedChange={() =>
                            handleCheckboxChange(reading.id, 3, reading.person3Status)
                          }
                          className={`w-6 h-6 ${
                            reading.person3Status ? "checkbox-completed" : "checkbox-pending"
                          }`}
                        />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(reading.person3Date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReadings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? "لا توجد نتائج للبحث"
                  : "لا توجد قراءات لهذه الجمعة"}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
