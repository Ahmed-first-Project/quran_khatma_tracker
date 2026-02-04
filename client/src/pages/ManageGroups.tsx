import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit2, Save, X, UserPlus } from "lucide-react";
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

export default function ManageGroups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonGroup, setNewPersonGroup] = useState<number>(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // جلب جميع الأشخاص
  const { data: persons, isLoading, refetch } = trpc.persons.getAll.useQuery();

  // جلب جميع القراءات لمعرفة المجموعات
  const { data: allReadings } = trpc.readings.getAll.useQuery();

  // Mutations
  const updateNameMutation = trpc.persons.updateName.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الاسم بنجاح");
      refetch();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث الاسم: " + error.message);
    },
  });

  const addPersonMutation = trpc.persons.addPerson.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة المشارك بنجاح");
      refetch();
      setIsAddDialogOpen(false);
      setNewPersonName("");
      setNewPersonGroup(1);
    },
    onError: (error) => {
      toast.error("فشل إضافة المشارك: " + error.message);
    },
  });

  const deletePersonMutation = trpc.persons.deletePerson.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المشارك بنجاح");
      refetch();
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error("فشل حذف المشارك: " + error.message);
    },
  });

  // حساب المجموعة لكل شخص من القراءات
  const personGroupMap = useMemo(() => {
    if (!allReadings || !persons) return new Map<string, number>();
    
    const map = new Map<string, number>();
    allReadings.forEach((reading: any) => {
      if (!map.has(reading.person1Name)) {
        map.set(reading.person1Name, reading.groupNumber);
      }
      if (!map.has(reading.person2Name)) {
        map.set(reading.person2Name, reading.groupNumber);
      }
      if (!map.has(reading.person3Name)) {
        map.set(reading.person3Name, reading.groupNumber);
      }
    });
    
    return map;
  }, [allReadings, persons]);

  // فلترة الأشخاص
  const filteredPersons = useMemo(() => {
    if (!persons) return [];
    
    return persons.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase());
      const personGroup = personGroupMap.get(person.name);
      const matchesGroup = groupFilter === null || personGroup === groupFilter;
      
      return matchesSearch && matchesGroup;
    });
  }, [persons, searchTerm, groupFilter, personGroupMap]);

  // دالة حفظ التعديل
  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    
    updateNameMutation.mutate({
      personId: editingId,
      newName: editingName.trim(),
    });
  };

  // دالة إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // دالة بدء التعديل
  const handleStartEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  // دالة إضافة شخص جديد
  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      toast.error("يرجى إدخال اسم المشارك");
      return;
    }
    
    addPersonMutation.mutate({
      name: newPersonName.trim(),
      groupNumber: newPersonGroup,
    });
  };

  // دالة حذف شخص
  const handleDeletePerson = (id: number) => {
    deletePersonMutation.mutate({ personId: id });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#1F4E78]">
            إدارة الأسماء والمجموعات
          </CardTitle>
          <CardDescription>
            إضافة، تعديل، وحذف أسماء المشاركين وربطهم بالمجموعات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1F4E78]">
                    {persons?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المشاركين</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#D4AF37]">
                    {filteredPersons.length}
                  </div>
                  <div className="text-sm text-gray-600">نتائج البحث</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    60
                  </div>
                  <div className="text-sm text-gray-600">عدد المجموعات</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أدوات البحث والفلترة */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="ابحث عن اسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={groupFilter === null ? "" : groupFilter}
                onChange={(e) => setGroupFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="">جميع المجموعات</option>
                {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>المجموعة {num}</option>
                ))}
              </select>
              
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#1F4E78]">
                <Plus className="ml-2" size={20} />
                إضافة مشارك
              </Button>
            </div>
          </div>

          {/* الجدول */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1F4E78]">
                  <TableHead className="text-white text-right">الرقم</TableHead>
                  <TableHead className="text-white text-right">الاسم</TableHead>
                  <TableHead className="text-white text-right">المجموعة</TableHead>
                  <TableHead className="text-white text-right">حالة Telegram</TableHead>
                  <TableHead className="text-white text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersons.map((person, index) => {
                  const isEditing = editingId === person.id;
                  const personGroup = personGroupMap.get(person.name);
                  
                  return (
                    <TableRow key={person.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{person.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {personGroup ? (
                          <Badge variant="outline" className="bg-blue-50">
                            المجموعة {personGroup}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            غير محدد
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {person.telegramChatId ? (
                          <Badge className="bg-green-500">
                            مرتبط
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            غير مرتبط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateNameMutation.isPending}
                                className="bg-green-600"
                              >
                                <Save size={16} className="ml-1" />
                                حفظ
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X size={16} className="ml-1" />
                                إلغاء
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(person.id, person.name)}
                              >
                                <Edit2 size={16} className="ml-1" />
                                تعديل
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteConfirmId(person.id)}
                              >
                                <Trash2 size={16} className="ml-1" />
                                حذف
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredPersons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد نتائج مطابقة للبحث
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog إضافة مشارك */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مشارك جديد</DialogTitle>
            <DialogDescription>
              أدخل اسم المشارك واختر المجموعة التي ينتمي إليها
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">المجموعة</Label>
              <select
                id="group"
                value={newPersonGroup}
                onChange={(e) => setNewPersonGroup(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-md"
              >
                {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>المجموعة {num}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddPerson}
              disabled={addPersonMutation.isPending}
              className="bg-[#1F4E78]"
            >
              <UserPlus size={16} className="ml-2" />
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog تأكيد الحذف */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المشارك؟ سيتم حذف جميع قراءاته أيضاً.
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDeletePerson(deleteConfirmId)}
              disabled={deletePersonMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 size={16} className="ml-2" />
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
