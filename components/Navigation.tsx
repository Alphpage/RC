
import React from 'react';
import { Tab, UserRole } from '../types';
import { Clock, Landmark, Banknote, Settings, Store, X, CalendarClock, ClipboardList } from 'lucide-react';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userRole?: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, userRole, isOpen, onClose }) => {
  const navItems = [
    { id: Tab.POINTS, icon: ClipboardList, label: 'Отчеты по точкам', visible: true },
    { id: Tab.SCHEDULES, icon: CalendarClock, label: 'Графики работы', visible: true },
    { id: Tab.ENCASHMENT, icon: Landmark, label: 'Инкассация', visible: true },
    { id: Tab.TIMESHEETS, icon: Clock, label: 'Табеля', visible: true },
    { id: Tab.SALARY, icon: Banknote, label: 'Зарплата', visible: true },
    // Settings visible for everyone, permissions handled inside
    { id: Tab.SETTINGS, icon: Settings, label: 'Настройки', visible: true },
  ];

  const handleNavClick = (tabId: Tab) => {
    onTabChange(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl md:translate-x-0 md:static md:shadow-none border-r border-slate-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                    <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">RentControl</span>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.filter(item => item.visible).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Версия</p>
                <p className="text-xs text-slate-600 font-mono">1.3.1 Enterprise</p>
            </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
