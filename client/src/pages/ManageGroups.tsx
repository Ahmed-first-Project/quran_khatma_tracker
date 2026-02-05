import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit2, UserPlus, CheckCircle2, XCircle, Filter, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageGroups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [telegramFilter, setTelegramFilter] = useState<string>("all");
  
  // حالات الحوارات
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // بيانات النماذج
  const [newPersonName, setNewPersonName] = useState("");
  const [editingPerson, setEditingPerson] = useState<{ id: number; name: string } | null>(null);
  const [deletingPersonId, setDeletingPersonId] = useState<number | null>(null);

  // جلب البيانات
  const { data: persons, isLoading, refetch } = trpc.persons.getAll.useQuery();
  const { data: allReadings } = trpc.readings.getAll.useQuery();

  // حساب المجموعات لكل شخص
  const personGroups = useMemo(() => {
    if (!allReadings || !persons) return new Map<number, number[]>();
    
    const groupsMap = new Map<number, number[]>();
    
    persons.forEach(person => {
      const groups = new Set<number>();
      allReadings.forEach(reading => {
        if (
          reading.person1Name === person.name ||
          reading.person2Name === person.name ||
          reading.person3Name === person.name
        ) {
          groups.add(reading.groupNumber);
        }
      });
      groupsMap.set(person.id, Array.from(groups).sort((a, b) => a - b));
    });
    
    return groupsMap;
  }, [allReadings, persons]);

  // Mutations
  const addPersonMutation = trpc.persons.addPerson.useMutation({
    onSuccess: () => {
      toast.success("✅ تمت إضافة المشارك بنجاح");
      refetch();
      setIsAddDialogOpen(false);
      setNewPersonName("");
    },
    onError: (error: any) => {
      toast.error("❌ فشلت إضافة المشارك: " + error.message);
    },
  });

  const updateNameMutation = trpc.persons.updateName.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث اسم المشارك بنجاح");
      refetch();
      setIsEditDialogOpen(false);
      setEditingPerson(null);
    },
    onError: (error: any) => {
      toast.error("❌ فشل تحديث الاسم: " + error.message);
    },
  });

  const deletePersonMutation = trpc.persons.deletePerson.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف المشارك بنجاح");
      refetch();
      setIsDeleteDialogOpen(false);
      setDeletingPersonId(null);
    },
    onError: (error: any) => {
      toast.error("❌ فشل حذف المشارك: " + error.message);
    },
  });

  // استخراج المجموعات الفريدة
  const uniqueGroups = Array.from(
    new Set(allReadings?.map((r) => r.groupNumber) || [])
  ).sort((a, b) => a - b);

  // فلترة البيانات
  const filteredPersons = persons?.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const personGroupsList = personGroups.get(person.id) || [];
    const matchesGroup = 
      groupFilter === "all" || 
      personGroupsList.includes(parseInt(groupFilter));
    
    const matchesTelegram = 
      telegramFilter === "all" ||
      (telegramFilter === "linked" && person.telegramChatId) ||
      (telegramFilter === "not_linked" && !person.telegramChatId);
    
    return matchesSearch && matchesGroup && matchesTelegram;
  }) || [];

  // معالجات الأحداث
  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      toast.error("الرجاء إدخال اسم المشارك");
      return;
    }
    // addPerson لا يحتاج groupNumber - يضاف الشخص فقط
    addPersonMutation.mutate({ name: newPersonName, groupNumber: 1 });
  };

  const handleEditPerson = () => {
    if (!editingPerson || !editingPerson.name.trim()) {
      toast.error("الرجاء إدخال اسم المشارك");
      return;
    }
    updateNameMutation.mutate({
      personId: editingPerson.id,
      newName: editingPerson.name,
    });
  };

  const handleDeletePerson = () => {
    if (!deletingPersonId) return;
    deletePersonMutation.mutate({ personId: deletingPersonId });
  };

  const openEditDialog = (person: any) => {
    setEditingPerson({
      id: person.id,
      name: person.name,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (personId: number) => {
    setDeletingPersonId(personId);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">إدارة المشاركين والمجموعات</CardTitle>
              <CardDescription>
                إضافة وتعديل وحذف المشاركين وعرض مجموعاتهم
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة مشارك جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* شريط البحث والفلترة */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="فلترة حسب المجموعة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المجموعات</SelectItem>
                {uniqueGroups.map((group) => (
                  <SelectItem key={group} value={group.toString()}>
                    المجموعة {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={telegramFilter} onValueChange={setTelegramFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="حالة Telegram" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="linked">مربوط</SelectItem>
                <SelectItem value="not_linked">غير مربوط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{persons?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المشاركين</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {persons?.filter(p => p.telegramChatId).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">مربوط بـ Telegram</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {persons?.filter(p => !p.telegramChatId).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">غير مربوط</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الجدول */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">المجموعات</TableHead>
                  <TableHead className="text-right">حالة Telegram</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersons.map((person) => {
                    const groups = personGroups.get(person.id) || [];
                    return (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell>
                          {groups.length === 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <Users className="h-3 w-3" />
                              لا توجد مجموعات
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {groups.map((group) => (
                                <Badge key={group} variant="outline">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {person.telegramChatId ? (
                            <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              مربوط
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              غير مربوط
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(person)}
                              className="gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              تعديل
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(person.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-4 text-sm text-muted-foreground">
            عرض {filteredPersons.length} من {persons?.length || 0} مشارك
          </div>

          {/* ملاحظة */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> لربط المشارك بمجموعة معينة، يجب إضافة اسمه في جدول القراءات من صفحة "القراءات".
              المجموعات المعروضة هنا هي المجموعات التي يظهر فيها اسم المشارك في جدول القراءات.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* حوار إضافة مشارك */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مشارك جديد</DialogTitle>
            <DialogDescription>
              أدخل اسم المشارك. يمكنك ربطه بالمجموعات لاحقاً من صفحة القراءات.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                placeholder="مثال: أحمد محمد العلي"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddPerson} disabled={addPersonMutation.isPending}>
              {addPersonMutation.isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تعديل مشارك */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل اسم المشارك</DialogTitle>
            <DialogDescription>
              قم بتعديل الاسم. سيتم تحديثه تلقائياً في جميع القراءات.
            </DialogDescription>
          </DialogHeader>
          {editingPerson && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">الاسم الكامل</Label>
                <Input
                  id="edit-name"
                  value={editingPerson.name}
                  onChange={(e) =>
                    setEditingPerson({ ...editingPerson, name: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditPerson} disabled={updateNameMutation.isPending}>
              {updateNameMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المشارك وجميع قراءاته من النظام. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePersonMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
