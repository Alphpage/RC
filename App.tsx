
import React, { useState, useMemo } from 'react';
import { Tab, RentalPoint, CashRegister, Employee, RevenueEntry, TimesheetEntry, EncashmentEntry, User, UserRole, MorningReport, EveningReport, PointSchedule, EmployeeSchedule, AuditQuestion, AuditReport } from './types';
import Navigation from './components/Navigation';
import Header from './components/Header';
import PointsView from './components/PointsView';
import TimesheetView from './components/TimesheetView';
import EncashmentView from './components/EncashmentView';
import SalaryView from './components/SalaryView';
import SettingsView from './components/SettingsView';
import SchedulesView from './components/SchedulesView';
import LoginView from './components/LoginView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.POINTS);
  const [authError, setAuthError] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock Data - Users
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', login: 'admin', password: 'admin', name: 'Администратор', role: UserRole.ADMIN, assignedPointIds: [] },
    { id: 'u2', login: 'manager', password: 'manager', name: 'Менеджер (Чтение)', role: UserRole.MANAGER, assignedPointIds: [] },
    { id: 'u3', login: 'user', password: 'user', name: 'Управляющий Центр', role: UserRole.SUPERVISOR, assignedPointIds: ['1'] }
  ]);
  
  // Initial Mock Data - Business
  const [points, setPoints] = useState<RentalPoint[]>([
    { id: '1', name: 'Точка Центр', salaryPercent: 10 },
    { id: '2', name: 'Парк Победы', salaryPercent: 5 },
    { id: '3', name: 'Набережная', salaryPercent: 7 }
  ]);
  
  const [registers, setRegisters] = useState<CashRegister[]>([
    { id: 'r1', pointId: '1', name: 'Касса 1 (Центр)' },
    { id: 'r2', pointId: '1', name: 'Терминал 1 (Центр)' },
    { id: 'r3', pointId: '2', name: 'Основная (Парк)' },
    { id: 'r4', pointId: '3', name: 'Касса Набережная' }
  ]);
  
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 'e1', name: 'Иванов Иван', position: 'Старший оператор', pointId: '1', hourlyRate: 300 },
    { id: 'e2', name: 'Петрова Анна', position: 'Оператор', pointId: '1', hourlyRate: 250 },
    { id: 'e3', name: 'Сидоров Олег', position: 'Оператор', pointId: '2', hourlyRate: 280 },
    { id: 'e4', name: 'Смирнова Елена', position: 'Стажер', pointId: '3', hourlyRate: 200 }
  ]);

  // Schedules
  const [pointSchedules, setPointSchedules] = useState<PointSchedule[]>([]);
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);

  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [encashmentEntries, setEncashmentEntries] = useState<EncashmentEntry[]>([]);
  const [morningReports, setMorningReports] = useState<MorningReport[]>([]);
  const [eveningReports, setEveningReports] = useState<EveningReport[]>([]);

  // Audit State
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [morningQuestions, setMorningQuestions] = useState<AuditQuestion[]>([
    { id: 'mq1', text: 'Полы чистые?', requireOnAnswer: 'no', requirementType: ['photo'] },
    { id: 'mq2', text: 'Техника включена?', requireOnAnswer: 'no', requirementType: ['comment'] }
  ]);
  const [eveningQuestions, setEveningQuestions] = useState<AuditQuestion[]>([
    { id: 'eq1', text: 'Мусор вынесен?', requireOnAnswer: 'no', requirementType: ['photo'] },
    { id: 'eq2', text: 'Техника на зарядке?', requireOnAnswer: 'no', requirementType: ['comment'] }
  ]);

  // Auth Handlers
  const handleLogin = (login: string, pass: string) => {
    const user = users.find(u => u.login === login && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setAuthError('');
      setActiveTab(Tab.POINTS);
    } else {
      setAuthError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // RBAC Filtering
  const visiblePoints = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) {
      return points;
    }
    // Supervisor sees only assigned points
    return points.filter(p => currentUser.assignedPointIds.includes(p.id));
  }, [points, currentUser]);

  const isReadOnly = currentUser?.role === UserRole.MANAGER;

  // Logic Handlers
  const handleSaveMorningReport = (report: MorningReport) => {
    setMorningReports(prev => {
        const idx = prev.findIndex(r => r.id === report.id || (r.pointId === report.pointId && r.date === report.date));
        if (idx > -1) {
            const copy = [...prev];
            copy[idx] = report;
            return copy;
        }
        return [...prev, report];
    });
  };

  const handleSaveAuditReport = (report: AuditReport) => {
      setAuditReports(prev => {
          const idx = prev.findIndex(r => r.pointId === report.pointId && r.date === report.date && r.type === report.type);
          if (idx > -1) {
              const copy = [...prev];
              copy[idx] = report;
              return copy;
          }
          return [...prev, report];
      });
  };

  const handleSaveEveningReport = (
      pointId: string, 
      date: string, 
      revenues: { regId: string, cash: number, card: number, refundCash: number, refundCard: number }[],
      empHours: { empId: string, start: string, end: string }[],
      closeTime: string
  ) => {
      // 1. Save Revenue Data
      const newRevenueEntries = revenues.map(r => ({
          id: Math.random().toString(36).substr(2, 9),
          pointId,
          registerId: r.regId,
          date,
          cash: r.cash,
          card: r.card,
          refundCash: r.refundCash,
          refundCard: r.refundCard
      }));
      
      setRevenueEntries(prev => {
          const filtered = prev.filter(e => !(e.pointId === pointId && e.date === date));
          return [...filtered, ...newRevenueEntries];
      });

      // 2. Calculate Hours & Update Timesheet
      const newTimesheets = empHours.map(h => {
          const start = new Date(`2000-01-01T${h.start}`);
          const end = new Date(`2000-01-01T${h.end}`);
          let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (diff < 0) diff += 24; // Handle over midnight

          return {
              id: Math.random().toString(36).substr(2, 9),
              pointId,
              employeeId: h.empId,
              date,
              hours: parseFloat(diff.toFixed(1)),
              startTime: h.start,
              endTime: h.end
          };
      });

      setTimesheetEntries(prev => {
          // Remove old entries for this point/date to avoid duplicates if re-submitting
          const filtered = prev.filter(e => !(e.pointId === pointId && e.date === date));
          return [...filtered, ...newTimesheets];
      });

      // 3. Save Report Meta
      setEveningReports(prev => {
          const existingIdx = prev.findIndex(r => r.pointId === pointId && r.date === date);
          const newReport: EveningReport = {
              id: existingIdx > -1 ? prev[existingIdx].id : Date.now().toString(),
              pointId,
              date,
              closeTime: closeTime, 
              cashVerified: true
          };
          
          if (existingIdx > -1) {
              const copy = [...prev];
              copy[existingIdx] = newReport;
              return copy;
          }
          return [...prev, newReport];
      });
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case Tab.POINTS:
        return (
          <PointsView 
            points={visiblePoints}
            registers={registers}
            employees={employees}
            revenueEntries={revenueEntries}
            encashmentEntries={encashmentEntries}
            morningReports={morningReports}
            eveningReports={eveningReports}
            auditReports={auditReports}
            pointSchedules={pointSchedules}
            employeeSchedules={employeeSchedules}
            morningAuditQuestions={morningQuestions}
            eveningAuditQuestions={eveningQuestions}
            onSaveMorning={handleSaveMorningReport}
            onSaveEvening={handleSaveEveningReport}
            onSaveAudit={handleSaveAuditReport}
            isReadOnly={isReadOnly}
          />
        );
      case Tab.SCHEDULES:
        return (
            <SchedulesView 
                points={visiblePoints}
                employees={employees}
                pointSchedules={pointSchedules}
                employeeSchedules={employeeSchedules}
                setPointSchedules={setPointSchedules}
                setEmployeeSchedules={setEmployeeSchedules}
            />
        );
      case Tab.TIMESHEETS:
        return (
          <TimesheetView 
            points={visiblePoints} 
            employees={employees} 
            entries={timesheetEntries}
            onUpdate={(updated) => setTimesheetEntries(updated)}
            isReadOnly={isReadOnly}
          />
        );
      case Tab.ENCASHMENT:
        return (
          <EncashmentView 
            points={visiblePoints} 
            registers={registers} 
            entries={encashmentEntries}
            revenueEntries={revenueEntries}
            onAdd={(entry) => setEncashmentEntries([...encashmentEntries, entry])}
            isReadOnly={isReadOnly}
          />
        );
      case Tab.SALARY:
        return (
          <SalaryView 
            employees={employees.filter(e => visiblePoints.some(vp => vp.id === e.pointId))} 
            timesheets={timesheetEntries}
            points={points} 
          />
        );
      case Tab.SETTINGS:
        return (
          <SettingsView 
            currentUser={currentUser}
            points={points} 
            registers={registers} 
            employees={employees}
            users={users}
            morningAuditQuestions={morningQuestions}
            eveningAuditQuestions={eveningQuestions}
            setPoints={setPoints}
            setRegisters={setRegisters}
            setEmployees={setEmployees}
            setUsers={setUsers}
            setMorningAuditQuestions={setMorningQuestions}
            setEveningAuditQuestions={setEveningQuestions}
          />
        );
      default:
        return null;
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 overflow-x-hidden font-inter">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={currentUser.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col w-full md:h-screen md:overflow-y-auto relative">
        <Header 
          title={activeTab} 
          user={currentUser} 
          onLogout={handleLogout} 
          onMenuToggle={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 px-4 py-6 w-full max-w-7xl mx-auto md:pb-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
