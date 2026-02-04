import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [selectedFriday, setSelectedFriday] = useState<number>(181);
  
  const { data: fridays, isLoading: loadingFridays } = trpc.fridays.getAll.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.stats.getFridayStats.useQuery(
    { fridayNumber: selectedFriday },
    { enabled: !!selectedFriday }
  );

  if (loadingFridays) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getFridayDate = (fridayNum: number) => {
    const friday = fridays?.find(f => f.fridayNumber === fridayNum);
    return friday?.dateGregorian || "";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return "🌟";
    if (percentage >= 60) return "👍";
    return "⚠️";
  };

  const getStatusClass = (status: string) => {
    if (status === "ممتازة") return "status-excellent";
    if (status === "جيدة") return "status-good";
    return "status-needs-attention";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🕌</span>
            <div>
              <h1 className="text-3xl font-bold">تطبيق تتبع الختمة القرآنية</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                الروضة الشاذلية العلوية
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Friday Selector */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📅</span>
              اختيار الجمعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedFriday.toString()}
              onValueChange={(value) => setSelectedFriday(Number(value))}
            >
              <SelectTrigger className="w-full text-lg">
                <SelectValue placeholder="اختر الجمعة" />
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

        {/* Statistics Card */}
        {loadingStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <Card className="border-2 border-secondary/30 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardTitle className="text-2xl text-center">
                الجمعة {stats.fridayNumber} - {getFridayDate(stats.fridayNumber)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Completed */}
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                    {stats.completed}/{stats.total}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-500 font-medium">
                    مكتمل ({stats.percentage}%)
                  </div>
                </div>

                {/* Pending */}
                <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-3xl font-bold text-orange-700 dark:text-orange-400 mb-1">
                    {stats.pending}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-500 font-medium">
                    منتظر
                  </div>
                </div>

                {/* Status */}
                <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary/30">
                  <div className="text-4xl mb-2">{getStatusIcon(stats.percentage)}</div>
                  <div className={`text-2xl font-bold mb-1 px-4 py-2 rounded-lg inline-block ${getStatusClass(stats.status)}`}>
                    {stats.status}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-2">
                    الحالة العامة
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">نسبة الإنجاز</span>
                  <span className="text-sm font-bold text-primary">{stats.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد بيانات متاحة لهذه الجمعة
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📖</div>
              <h3 className="text-xl font-bold mb-2">جدول القراءات</h3>
              <p className="text-sm text-muted-foreground">
                عرض وتحديث حالة القراءات لجميع المجموعات
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary/50">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">الإحصائيات</h3>
              <p className="text-sm text-muted-foreground">
                عرض إحصائيات مفصلة لجميع الجمعات والأفراد
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500/50">
            <a href="/manage-groups">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-xl font-bold mb-2">إدارة المجموعات</h3>
                <p className="text-sm text-muted-foreground">
                  إضافة، تعديل، وحذف المشاركين وربطهم بالمجموعات
                </p>
              </CardContent>
            </a>
          </Card>
        </div>
      </main>
    </div>
  );
}
