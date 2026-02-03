import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Save, Users } from "lucide-react";
import { toast } from "sonner";

export default function ManageParticipants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editedNames, setEditedNames] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: persons, isLoading } = trpc.persons.getAll.useQuery();

  const bulkUpdate = trpc.persons.bulkUpdate.useMutation({
    onSuccess: (result) => {
      utils.persons.getAll.invalidate();
      utils.readings.getByFriday.invalidate();
      utils.stats.getAllFridaysStats.invalidate();
      utils.stats.getTopReaders.invalidate();
      
      setEditedNames({});
      setIsSaving(false);
      toast.success(result.message || "تم حفظ التغييرات بنجاح");
    },
    onError: () => {
      setIsSaving(false);
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    },
  });

  const filteredPersons = useMemo(() => {
    if (!persons) return [];
    if (!searchTerm) return persons;

    const term = searchTerm.toLowerCase();
    return persons.filter((p) => p.name.toLowerCase().includes(term));
  }, [persons, searchTerm]);

  const handleNameChange = (personId: number, newName: string) => {
    setEditedNames((prev) => ({
      ...prev,
      [personId]: newName,
    }));
  };

  const handleSaveAll = () => {
    const updates = Object.entries(editedNames)
      .filter(([_, name]) => name.trim().length > 0)
      .map(([id, name]) => ({
        id: Number(id),
        name: name.trim(),
      }));

    if (updates.length === 0) {
      toast.info("لا توجد تغييرات للحفظ");
      return;
    }

    setIsSaving(true);
    bulkUpdate.mutate({ updates });
  };

  const hasChanges = Object.keys(editedNames).length > 0;

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
            <Users className="w-8 h-8" />
            إدارة المشاركين
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            قم بتعديل أسماء المشاركين الافتراضية إلى الأسماء الحقيقية
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Search and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6 flex items-end">
              <Button
                onClick={handleSaveAll}
                disabled={!hasChanges || isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    حفظ جميع التغييرات ({Object.keys(editedNames).length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h3 className="font-bold text-lg mb-2">تعليمات الاستخدام</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• قم بتعديل الأسماء في الحقول أدناه</li>
                  <li>• يمكنك البحث عن شخص معين باستخدام حقل البحث</li>
                  <li>• اضغط على "حفظ جميع التغييرات" لتطبيق التعديلات</li>
                  <li>• سيتم تحديث الاسم في جميع القراءات والإحصائيات تلقائياً</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              قائمة المشاركين ({filteredPersons.length} شخص)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary/20">
                    <th className="p-3 text-right font-bold w-20">الرقم</th>
                    <th className="p-3 text-right font-bold">الاسم الحالي</th>
                    <th className="p-3 text-right font-bold">الاسم الجديد</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersons.map((person, index) => {
                    const currentValue = editedNames[person.id] ?? person.name;
                    const hasChanged = editedNames[person.id] !== undefined;

                    return (
                      <tr
                        key={person.id}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          hasChanged ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                        }`}
                      >
                        <td className="p-3 font-medium text-center">{index + 1}</td>
                        <td className="p-3 text-muted-foreground">{person.name}</td>
                        <td className="p-3">
                          <Input
                            type="text"
                            value={currentValue}
                            onChange={(e) => handleNameChange(person.id, e.target.value)}
                            placeholder="أدخل الاسم الجديد"
                            className={`${
                              hasChanged
                                ? "border-yellow-500 focus:border-yellow-600"
                                : ""
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPersons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? "لا توجد نتائج للبحث"
                  : "لا يوجد مشاركون"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">👥</div>
              <div className="text-3xl font-bold text-primary mb-1">
                {persons?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                إجمالي المشاركين
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">✏️</div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {Object.keys(editedNames).length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                التعديلات المعلقة
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {filteredPersons.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                نتائج البحث
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
