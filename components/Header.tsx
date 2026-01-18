
import React from 'react';
import { Tab, User } from '../types';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  title: Tab;
  user: User;
  onLogout: () => void;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, onLogout, onMenuToggle }) => {
  const titles: Record<Tab, string> = {
    [Tab.POINTS]: 'Отчеты по точкам',
    [Tab.SCHEDULES]: 'Графики работы',
    [Tab.TIMESHEETS]: 'Табеля',
    [Tab.ENCASHMENT]: 'Инкассация',
    [Tab.SALARY]: 'Зарплата',
    [Tab.SETTINGS]: 'Настройки',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">{titles[title]}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {user.name}
          </p>
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all border border-slate-200"
        title="Выйти"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
};

export default Header;
