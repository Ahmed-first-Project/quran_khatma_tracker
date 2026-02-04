import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Loader2, Search } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyReadings() {
  const [name, setName] = useState("");
  const [searchedName, setSearchedName] = useState("");
  
  const { data: readings, isLoading, refetch } = trpc.readings.getByPersonName.useQuery(
    { name: searchedName },
    { enabled: !!searchedName }
  );
  
  const markCompleteMutation = trpc.readings.markComplete.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل القراءة بنجاح! ✅");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تسجيل القراءة");
    },
  });
  
  const handleSearch = () => {
    if (name.trim()) {
      setSearchedName(name.trim());
    }
  };
  
  // تحديد موضع الشخص في القراءة (1, 2, أو 3)
  const getPersonPosition = (reading: any) => {
    if (reading.person1Name === searchedName) return 1;
    if (reading.person2Name === searchedName) return 2;
    if (reading.person3Name === searchedName) return 3;
    return 0;
  };
  
  const getCompletionStatus = (reading: any) => {
    const position = getPersonPosition(reading);
    if (position === 1) return reading.person1Status;
    if (position === 2) return reading.person2Status;
    if (position === 3) return reading.person3Status;
    return false;
  };
  
  const getCompletionDate = (reading: any) => {
    const position = getPersonPosition(reading);
    if (position === 1) return reading.person1Date;
    if (position === 2) return reading.person2Date;
    if (position === 3) return reading.person3Date;
    return null;
  };
  
  const handleMarkComplete = (readingId: number, position: number) => {
    markCompleteMutation.mutate({ readingId, position });
  };
  
  const completedCount = readings?.filter(r => getCompletionStatus(r)).length || 0;
  const totalCount = readings?.length || 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F4E78]/5 to-[#D4AF37]/5 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1F4E78]">قراءاتي</h1>
            <p className="text-gray-600 mt-1">تتبع قراءاتك في الختمة القرآنية</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>
        
        {/* Search Section */}
        {!searchedName && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>ابحث عن قراءاتك</CardTitle>
              <CardDescription>أدخل اسمك كما هو مسجل في القائمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="مثال: احمد اللاذقاني"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="text-right"
                />
                <Button onClick={handleSearch} disabled={!name.trim()}>
                  <Search className="ml-2 h-4 w-4" />
                  بحث
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Results Section */}
        {searchedName && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>قراءات: {searchedName}</CardTitle>
                    <CardDescription>
                      {`${completedCount} من ${totalCount} قراءة مكتملة`}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSearchedName("")}>
                    تغيير الاسم
                  </Button>
                </div>
              </CardHeader>
            </Card>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#1F4E78]" />
              </div>
            ) : readings && readings.length > 0 ? (
              <div className="space-y-4">
                {readings.map((reading) => {
                  const completed = getCompletionStatus(reading);
                  const completedAt = getCompletionDate(reading);
                  const position = getPersonPosition(reading);
                  
                  return (
                    <Card key={reading.id} className={completed ? "border-green-500" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Badge variant="outline" className="text-[#1F4E78]">
                                الجمعة {reading.fridayNumber}
                              </Badge>
                              <Badge variant="outline">
                                الجزء {reading.juzNumber}
                              </Badge>
                              <Badge variant="outline">
                                الختمة {reading.khatmaNumber}
                              </Badge>
                              <Badge variant="outline">
                                المجموعة {reading.groupNumber}
                              </Badge>
                            </div>
                            
                            {completed && completedAt && (
                              <p className="text-sm text-green-600">
                                ✓ تم القراءة في: {new Date(completedAt).toLocaleString("ar-EG", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => handleMarkComplete(reading.id, position)}
                            disabled={completed || markCompleteMutation.isPending}
                            variant={completed ? "outline" : "default"}
                            className={completed ? "bg-green-50" : "bg-[#1F4E78] hover:bg-[#1F4E78]/90"}
                          >
                            {completed ? (
                              <>
                                <CheckCircle2 className="ml-2 h-5 w-5 text-green-600" />
                                مكتمل
                              </>
                            ) : (
                              <>
                                <Circle className="ml-2 h-5 w-5" />
                                تسجيل القراءة
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">لم يتم العثور على قراءات لهذا الاسم</p>
                  <p className="text-sm text-gray-400 mt-2">تأكد من كتابة الاسم بالضبط كما هو في القائمة</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
