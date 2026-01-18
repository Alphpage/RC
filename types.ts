
export enum Tab {
  POINTS = 'points', // Отчеты по точкам
  SCHEDULES = 'schedules', // Графики работы
  ENCASHMENT = 'encashment',
  TIMESHEETS = 'timesheets',
  SALARY = 'salary',
  SETTINGS = 'settings'
}

export enum UserRole {
  ADMIN = 'admin',       // Полные права
  MANAGER = 'manager',   // Только чтение всего
  SUPERVISOR = 'supervisor' // Ввод данных по своим точкам
}

export interface User {
  id: string;
  login: string;
  password?: string; // В реальном приложении хранить хэш
  name: string;
  role: UserRole;
  assignedPointIds: string[]; // Для управляющих
}

export interface RentalPoint {
  id: string;
  name: string;
  salaryPercent?: number; // Процент, учитываемый при расчете ЗП
}

export interface PointSchedule {
  id: string;
  pointId: string;
  date: string; // YYYY-MM-DD
  openTime: string;
  closeTime: string;
}

export interface CashRegister {
  id: string;
  pointId: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  pointId: string;
  hourlyRate: number;
}

export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  pointId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
}

export interface RevenueEntry {
  id: string;
  pointId: string;
  registerId: string;
  date: string;
  cash: number;
  card: number;
  refundCash: number;
  refundCard: number;
}

export interface TimesheetEntry {
  id: string;
  pointId: string;
  employeeId: string;
  date: string;
  hours: number;
  startTime?: string;
  endTime?: string;
}

export interface EncashmentEntry {
  id: string;
  pointId: string;
  registerId: string;
  date: string;
  amount: number;
}

export interface SalaryCalculation {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  baseSalary: number;
  pointPercentBonus: number;
  total: number;
}

export interface MorningReport {
  id: string;
  pointId: string;
  date: string;
  openTime: string;
  employeeIds: string[];
  media: string[]; // Base64 strings or URLs
  cashVerified: boolean;
}

export interface EveningReport {
  id: string;
  pointId: string;
  date: string;
  closeTime: string;
  cashVerified: boolean;
  // Данные о выручке и часах хранятся в RevenueEntry и TimesheetEntry,
  // но отчет связывает факт сдачи.
}

// --- Audit Types ---

export type AuditType = 'morning' | 'evening';

export type AuditRequirement = 'photo' | 'comment';

export interface AuditQuestion {
  id: string;
  text: string;
  // Logic: If user selects this answer, enforce requirement
  requireOnAnswer: 'yes' | 'no' | 'always' | null; 
  requirementType: AuditRequirement[]; // Array of requirements
}

export interface AuditAnswer {
  questionId: string;
  value: boolean; // true = Yes, false = No
  comment?: string;
  photo?: string;
}

export interface AuditReport {
  id: string;
  pointId: string;
  date: string;
  type: AuditType;
  answers: AuditAnswer[];
}
