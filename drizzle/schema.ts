import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول الأشخاص - يحتوي على أسماء جميع المشاركين في الختمة
 */
export const persons = mysqlTable("persons", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  telegramChatId: varchar("telegramChatId", { length: 64 }), // Telegram Chat ID للمشارك
  telegramUsername: varchar("telegramUsername", { length: 64 }), // Telegram Username (اختياري)
  isAdmin: boolean("isAdmin").default(false).notNull(), // هل هو مشرف
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Person = typeof persons.$inferSelect;
export type InsertPerson = typeof persons.$inferInsert;

/**
 * جدول الجمعات - يحتوي على معلومات الجمعات الـ 30
 */
export const fridays = mysqlTable("fridays", {
  id: int("id").autoincrement().primaryKey(),
  fridayNumber: int("fridayNumber").notNull().unique(), // 181-210
  dateGregorian: varchar("dateGregorian", { length: 20 }).notNull(), // 21-11-2025
  dateHijri: varchar("dateHijri", { length: 20 }), // التاريخ الهجري
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Friday = typeof fridays.$inferSelect;
export type InsertFriday = typeof fridays.$inferInsert;

/**
 * جدول القراءات - يحتوي على معلومات القراءات لكل مجموعة
 */
export const readings = mysqlTable("readings", {
  id: int("id").autoincrement().primaryKey(),
  fridayNumber: int("fridayNumber").notNull(), // 181-210
  juzNumber: int("juzNumber").notNull(), // 1-30
  khatmaNumber: int("khatmaNumber").notNull(), // 1 أو 2
  groupNumber: int("groupNumber").notNull(), // 1-60
  
  // الشخص الأول
  person1Name: text("person1Name").notNull(),
  person1Status: boolean("person1Status").default(false).notNull(), // false = لم يقرأ، true = قرأ
  person1Date: datetime("person1Date"), // تاريخ ووقت القراءة
  
  // الشخص الثاني
  person2Name: text("person2Name").notNull(),
  person2Status: boolean("person2Status").default(false).notNull(),
  person2Date: datetime("person2Date"),
  
  // الشخص الثالث
  person3Name: text("person3Name").notNull(),
  person3Status: boolean("person3Status").default(false).notNull(),
  person3Date: datetime("person3Date"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reading = typeof readings.$inferSelect;
export type InsertReading = typeof readings.$inferInsert;

/**
 * جدول الإشعارات - يحتوي على سجل جميع الإشعارات المرسلة
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  fridayNumber: int("fridayNumber").notNull(), // رقم الجمعة
  recipientName: text("recipientName").notNull(), // اسم المستلم
  recipientChatId: varchar("recipientChatId", { length: 64 }).notNull(), // Telegram Chat ID
  messageText: text("messageText").notNull(), // نص الرسالة المرسلة
  notificationType: mysqlEnum("notificationType", ["reminder", "manual", "scheduled"]).notNull(), // نوع الإشعار
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(), // حالة الإرسال
  errorMessage: text("errorMessage"), // رسالة الخطأ إن وجدت
  sentAt: timestamp("sentAt"), // وقت الإرسال الفعلي
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * جدول إعدادات الإشعارات - يحتوي على إعدادات نظام التذكيرات التلقائية
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(), // مفتاح الإعداد
  settingValue: text("settingValue").notNull(), // قيمة الإعداد
  description: text("description"), // وصف الإعداد
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;
