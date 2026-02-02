import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { exportFridaysStats, exportTopReaders } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function Statistics() {
  const { data: fridaysStats, isLoading: loadingFridays } = trpc.stats.getAllFridaysStats.useQuery();
  const { data: topReaders, isLoading: loadingReaders } = trpc.stats.getTopReaders.useQuery({ limit: 10 });

  if (loadingFridays || loadingReaders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>📊</span>
            الإحصائيات والتقارير
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Fridays Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>📅</span>
              إحصائيات الجمعات
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (fridaysStats) {
                  exportFridaysStats(fridaysStats);
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
                    <th className="p-3 text-right font-bold">الجمعة</th>
                    <th className="p-3 text-right font-bold">التاريخ</th>
                    <th className="p-3 text-right font-bold">المكتمل</th>
                    <th className="p-3 text-right font-bold">المنتظر</th>
                    <th className="p-3 text-right font-bold">النسبة</th>
                    <th className="p-3 text-right font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {fridaysStats?.map((stat) => (
                    <tr key={stat.fridayNumber} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{stat.fridayNumber}</td>
                      <td className="p-3">{stat.dateGregorian}</td>
                      <td className="p-3 text-green-600 dark:text-green-400 font-semibold">
                        {stat.completed}/{stat.total}
                      </td>
                      <td className="p-3 text-orange-600 dark:text-orange-400 font-semibold">
                        {stat.pending}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm min-w-[3rem]">{stat.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(stat.status)}`}>
                          {getStatusIcon(stat.percentage)} {stat.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!fridaysStats || fridaysStats.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Readers */}
        <Card className="border-2 border-secondary/30">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span>
              أفضل 10 أشخاص التزاماً
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (topReaders) {
                  exportTopReaders(topReaders);
                  toast.success("تم تصدير البيانات بنجاح");
                }
              }}
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير CSV
            </Button>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-secondary/10 border-b-2 border-secondary/20">
                    <th className="p-3 text-right font-bold">الترتيب</th>
                    <th className="p-3 text-right font-bold">الاسم</th>
                    <th className="p-3 text-right font-bold">المكتمل</th>
                    <th className="p-3 text-right font-bold">من أصل</th>
                    <th className="p-3 text-right font-bold">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {topReaders?.map((reader, index) => (
                    <tr
                      key={reader.name}
                      className={`border-b hover:bg-muted/30 transition-colors ${
                        index < 3 ? "bg-secondary/5" : ""
                      }`}
                    >
                      <td className="p-3">
                        <span className="text-2xl font-bold">
                          {getMedalIcon(index + 1)}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{reader.name}</td>
                      <td className="p-3 text-green-600 dark:text-green-400 font-semibold">
                        {reader.completed}
                      </td>
                      <td className="p-3 font-medium">{reader.total}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                reader.percentage === 100
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : "bg-gradient-to-r from-primary to-secondary"
                              }`}
                              style={{ width: `${reader.percentage}%` }}
                            />
                          </div>
                          <span className="font-bold min-w-[3rem]">{reader.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!topReaders || topReaders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📅</div>
              <div className="text-3xl font-bold text-primary mb-1">
                {fridaysStats?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                إجمالي الجمعات
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">👥</div>
              <div className="text-3xl font-bold text-secondary mb-1">
                180
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                إجمالي المشاركين
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📖</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {fridaysStats?.reduce((sum, stat) => sum + stat.completed, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                إجمالي القراءات المكتملة
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
