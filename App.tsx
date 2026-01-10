import React, { useState, useMemo } from 'react';
import { Tab, UserRole } from './types';
import Navigation from './components/Navigation';
import Header from './components/Header';
import RevenueView from './components/RevenueView';
import TimesheetView from './components/TimesheetView';
import EncashmentView from './components/EncashmentView';
import SalaryView from './components/SalaryView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ImageEditorView from './components/ImageEditorView';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<any | null>('rc_current_user', null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REVENUE);
  const [authError, setAuthError] = useState<string>('');

  const INITIAL_USERS: any[] = [
    { id: 'u1', login: 'admin', password: 'admin', name: 'Администратор', role: UserRole.ADMIN, assignedPointIds: [] },
    { id: 'u2', login: 'manager', password: 'manager', name: 'Менеджер Сети', role: UserRole.MANAGER, assignedPointIds: [] },
    { id: 'u3', login: 'user', password: 'user', name: 'Управляющий', role: UserRole.SUPERVISOR, assignedPointIds: ['1'] }
  ];

  const INITIAL_POINTS: any[] = [
    { id: '1', name: 'Точка Центр', serviceSalePercent: 10 },
    { id: '2', name: 'Парк Победы', serviceSalePercent: 15 }
  ];

  const [users, setUsers] = useLocalStorage<any[]>('rc_users', INITIAL_USERS);
  const [points, setPoints] = useLocalStorage<any[]>('rc_points', INITIAL_POINTS);
  const [registers, setRegisters] = useLocalStorage<any[]>('rc_registers', []);
  const [employees, setEmployees] = useLocalStorage<any[]>('rc_employees', []);
  const [revenueEntries, setRevenueEntries] = useLocalStorage<any[]>('rc_revenue', []);
  const [timesheetEntries, setTimesheetEntries] = useLocalStorage<any[]>('rc_timesheets', []);
  const [encashmentEntries, setEncashmentEntries] = useLocalStorage<any[]>('rc_encashment', []);
  const [salaryAdjustments, setSalaryAdjustments] = useLocalStorage<any[]>('rc_salary_adjustments', []);

  const handleLogin = (login: string, pass: string) => {
    const user = users.find(u => u.login === login && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setAuthError('');
      setActiveTab(Tab.REVENUE);
    } else {
      setAuthError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => setCurrentUser(null);

  const visiblePoints = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) return points;
    return points.filter(p => (currentUser.assignedPointIds || []).includes(p.id));
  }, [points, currentUser]);

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case Tab.REVENUE:
        return <RevenueView points={visiblePoints} registers={registers} entries={revenueEntries} onSave={(e) => setRevenueEntries(prev => {
          const idx = prev.findIndex(item => item.date === e.date && item.registerId === e.registerId);
          if (idx > -1) { const u = [...prev]; u[idx] = e; return u; } return [...prev, e];
        })} />;
      case Tab.TIMESHEETS:
        return <TimesheetView points={visiblePoints} employees={employees} entries={timesheetEntries} onUpdate={setTimesheetEntries} />;
      case Tab.ENCASHMENT:
        return <EncashmentView points={visiblePoints} registers={registers} entries={encashmentEntries} revenueEntries={revenueEntries} onAdd={(e) => setEncashmentEntries([...encashmentEntries, e])} />;
      case Tab.SALARY:
        return <SalaryView points={visiblePoints} employees={employees} timesheets={timesheetEntries} adjustments={salaryAdjustments} onUpdateAdjustment={(adj) => setSalaryAdjustments(prev => {
          const idx = prev.findIndex(a => a.employeeId === adj.employeeId && a.year === adj.year && a.month === adj.month);
          if (idx > -1) { const u = [...prev]; u[idx] = adj; return u; } return [...prev, adj];
        })} />;
      case Tab.AI_EDITOR:
        return <ImageEditorView />;
      case Tab.SETTINGS:
        return <SettingsView points={points} registers={registers} employees={employees} users={users} currentUser={currentUser} setPoints={setPoints} setRegisters={setRegisters} setEmployees={setEmployees} setUsers={setUsers} />;
      default: return null;
    }
  };

  if (!currentUser) return <LoginView onLogin={handleLogin} error={authError} />;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <Header title={activeTab} user={currentUser} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} userRole={currentUser.role} />
      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;