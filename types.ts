
export enum Tab {
  REVENUE = 'revenue',
  TIMESHEETS = 'timesheets',
  ENCASHMENT = 'encashment',
  SALARY = 'salary',
  SETTINGS = 'settings',
  AI_EDITOR = 'ai_editor'
}

export enum UserRole {
  ADMIN = 'admin',       // Полные права (вкл. управление пользователями)
  MANAGER = 'manager',   // Управление точками, кассами и персоналом по всей сети
  SUPERVISOR = 'supervisor' // Ввод данных и управление кассами на своих точках
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
  serviceSalePercent?: number; // Процент на продажу услуг
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
}

export interface EncashmentEntry {
  id: string;
  pointId: string;
  registerId: string;
  date: string;
  amount: number;
}

export interface SalaryAdjustment {
  employeeId: string;
  year: number;
  month: number;
  bonus: number;
  fine: number;
}

export interface SalaryCalculation {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  baseSalary: number;
  bonus: number;
  fine: number;
  total: number;
}
