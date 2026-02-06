import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserPlus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function ManageParticipants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<{ id: number; name: string } | null>(null);
  
  // New participant form
  const [newName, setNewName] = useState("");
  const [newGroupNumber, setNewGroupNumber] = useState("");

  const utils = trpc.useUtils();
  const { data: persons, isLoading } = trpc.persons.getAll.useQuery();

  // Get readings to show participant details
  const { data: allReadings } = trpc.readings.getAll.useQuery();

  const addPerson = trpc.persons.addPerson.useMutation({
    onSuccess: () => {
      utils.persons.getAll.invalidate();
      utils.readings.getAll.invalidate();
      setIsAddDialogOpen(false);
      setNewName("");
      setNewGroupNumber("");
      toast.success("تم إضافة المشترك بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة المشترك");
    },
  });

  const updatePerson = trpc.persons.updateName.useMutation({
    onSuccess: () => {
      utils.persons.getAll.invalidate();
      utils.readings.getAll.invalidate();
      setEditingPerson(null);
      toast.success("تم تحديث المشترك بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المشترك");
    },
  });

  const deletePerson = trpc.persons.deletePerson.useMutation({
    onSuccess: () => {
      utils.persons.getAll.invalidate();
      utils.readings.getAll.invalidate();
      toast.success("تم حذف المشترك بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف المشترك");
    },
  });

  const filteredPersons = useMemo(() => {
    if (!persons) return [];
    if (!searchTerm) return persons;

    const term = searchTerm.toLowerCase();
    return persons.filter((p) => p.name.toLowerCase().includes(term));
  }, [persons, searchTerm]);

  const handleAddPerson = () => {
    if (!newName.trim()) {
      toast.error("يرجى إدخال اسم المشترك");
      return;
    }
    if (!newGroupNumber || Number(newGroupNumber) < 1 || Number(newGroupNumber) > 60) {
      toast.error("يرجى إدخال رقم مجموعة صحيح (1-60)");
      return;
    }

    addPerson.mutate({
      name: newName.trim(),
      groupNumber: Number(newGroupNumber),
    });
  };

  const handleUpdatePerson = () => {
    if (!editingPerson) return;
    if (!editingPerson.name.trim()) {
      toast.error("يرجى إدخال اسم المشترك");
      return;
    }

    updatePerson.mutate({
      personId: editingPerson.id,
      newName: editingPerson.name.trim(),
    });
  };

  const handleDeletePerson = (personId: number, personName: string) => {
    if (confirm(`هل أنت متأكد من حذف المشترك "${personName}"؟\n\nسيتم حذف جميع قراءاته أيضاً.`)) {
      deletePerson.mutate({ personId });
    }
  };

  // Get participant details from readings
  const getParticipantDetails = (personName: string) => {
    if (!allReadings) return null;
    // Check if person is in any reading (person1, person2, or person3)
    const reading = allReadings.find((r) => 
      r.person1Name === personName || 
      r.person2Name === personName || 
      r.person3Name === personName
    );
    return reading ? {
      groupNumber: reading.groupNumber,
      fridayNumber: reading.fridayNumber,
      juzNumber: reading.juzNumber,
    } : null;
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
            <Users className="w-8 h-8" />
            إدارة المشاركين
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            إضافة، تعديل، وحذف المشاركين في الختمة القرآنية
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Search and Add Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">البحث عن مشترك</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث باسم المشترك..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Button */}
          <Card>
            <CardContent className="pt-6 flex items-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <UserPlus className="w-5 h-5 ml-2" />
                    إضافة مشترك جديد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مشترك جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">اسم المشترك</Label>
                      <Input
                        id="name"
                        placeholder="أدخل الاسم الكامل"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="group">رقم المجموعة (1-60)</Label>
                      <Input
                        id="group"
                        type="number"
                        min="1"
                        max="60"
                        placeholder="أدخل رقم المجموعة"
                        value={newGroupNumber}
                        onChange={(e) => setNewGroupNumber(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAddPerson}
                      disabled={addPerson.isPending}
                      className="w-full"
                    >
                      {addPerson.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 ml-2" />
                          إضافة المشترك
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                  <li>• استخدم زر "إضافة مشترك جديد" لإضافة مشترك جديد مع تحديد المجموعة</li>
                  <li>• اضغط على زر التعديل (✏️) لتعديل اسم المشترك</li>
                  <li>• اضغط على زر الحذف (🗑️) لحذف المشترك (سيتم حذف جميع قراءاته)</li>
                  <li>• يمكنك البحث عن مشترك معين باستخدام حقل البحث</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              قائمة المشاركين ({filteredPersons.length} مشترك)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary/20">
                    <th className="p-3 text-right font-bold w-20">الرقم</th>
                    <th className="p-3 text-right font-bold">الاسم</th>
                    <th className="p-3 text-right font-bold w-24">المجموعة</th>
                    <th className="p-3 text-right font-bold w-32">حالة Telegram</th>
                    <th className="p-3 text-center font-bold w-32">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersons.map((person, index) => {
                    const details = getParticipantDetails(person.name);
                    const isLinked = !!person.telegramChatId;

                    return (
                      <tr
                        key={person.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium text-center">{index + 1}</td>
                        <td className="p-3 font-medium">{person.name}</td>
                        <td className="p-3 text-center">
                          {details ? (
                            <span className="inline-block px-3 py-1 bg-primary/10 rounded-full text-sm font-bold">
                              {details.groupNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isLinked ? (
                            <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                              ✓ مربوط
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                              غير مربوط
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Button */}
                            <Dialog open={editingPerson?.id === person.id} onOpenChange={(open) => {
                              if (!open) setEditingPerson(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPerson({ id: person.id, name: person.name })}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>تعديل المشترك</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label htmlFor="edit-name">اسم المشترك</Label>
                                    <Input
                                      id="edit-name"
                                      value={editingPerson?.name || ""}
                                      onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleUpdatePerson}
                                    disabled={updatePerson.isPending}
                                    className="w-full"
                                  >
                                    {updatePerson.isPending ? (
                                      <>
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        جاري التحديث...
                                      </>
                                    ) : (
                                      <>
                                        <Pencil className="w-4 h-4 ml-2" />
                                        حفظ التعديلات
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleDeletePerson(person.id, person.name)}
                              disabled={deletePerson.isPending}
                            >
                              {deletePerson.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
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

          <Card className="border-2 border-green-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">✓</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {persons?.filter(p => p.telegramChatId).length || 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                مربوطون بـ Telegram
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">
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
