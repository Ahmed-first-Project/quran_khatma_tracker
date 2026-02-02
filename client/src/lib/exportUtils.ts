/**
 * تصدير البيانات إلى CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // الحصول على الأعمدة من أول صف
  const headers = Object.keys(data[0]);
  
  // إنشاء محتوى CSV
  let csv = headers.join(",") + "\n";
  
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csv += values.join(",") + "\n";
  });

  // إضافة BOM لدعم UTF-8 في Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  
  // تحميل الملف
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * تصدير إحصائيات الجمعات
 */
export function exportFridaysStats(stats: any[]) {
  const data = stats.map((stat) => ({
    "الجمعة": stat.fridayNumber,
    "التاريخ": stat.dateGregorian,
    "المكتمل": stat.completed,
    "المنتظر": stat.pending,
    "الإجمالي": stat.total,
    "النسبة المئوية": `${stat.percentage}%`,
    "الحالة": stat.status,
  }));
  
  exportToCSV(data, `احصائيات_الجمعات_${new Date().toISOString().split("T")[0]}`);
}

/**
 * تصدير أفضل القراء
 */
export function exportTopReaders(readers: any[]) {
  const data = readers.map((reader, index) => ({
    "الترتيب": index + 1,
    "الاسم": reader.name,
    "المكتمل": reader.completed,
    "من أصل": reader.total,
    "النسبة المئوية": `${reader.percentage}%`,
  }));
  
  exportToCSV(data, `افضل_القراء_${new Date().toISOString().split("T")[0]}`);
}

/**
 * تصدير القراءات
 */
export function exportReadings(readings: any[], fridayNumber: number) {
  const data: any[] = [];
  
  readings.forEach((reading) => {
    // إضافة صف لكل شخص في القراءة
    [1, 2, 3].forEach((personNum) => {
      const personName = reading[`person${personNum}Name`];
      const personStatus = reading[`person${personNum}Status`];
      const personDate = reading[`person${personNum}Date`];
      
      data.push({
        "الجمعة": reading.fridayNumber,
        "الجزء": reading.juzNumber,
        "الختمة": reading.khatmaNumber,
        "المجموعة": reading.groupNumber,
        "الاسم": personName,
        "الحالة": personStatus ? "مكتمل" : "منتظر",
        "التاريخ والوقت": personDate
          ? new Date(personDate).toLocaleString("ar-EG")
          : "-",
      });
    });
  });
  
  exportToCSV(data, `قراءات_الجمعة_${fridayNumber}_${new Date().toISOString().split("T")[0]}`);
}

/**
 * حفظ البيانات في LocalStorage
 */
export function saveToLocalStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

/**
 * استرجاع البيانات من LocalStorage
 */
export function loadFromLocalStorage(key: string) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
}
