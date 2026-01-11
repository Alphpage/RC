
import React from 'react';
import { Tab, User } from '../types';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  title: Tab;
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
  const titles: Record<Tab, string> = {
    [Tab.REVENUE]: 'Выручка',
    [Tab.TIMESHEETS]: 'Табеля',
    [Tab.ENCASHMENT]: 'Инкассация',
    [Tab.SALARY]: 'Зарплата',
    [Tab.SETTINGS]: 'Настройки',
    [Tab.AI_EDITOR]: 'ИИ Редактор Фото'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-800 leading-none">{titles[title]}</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          {user.name}
        </p>
      </div>
      <button 
        onClick={onLogout}
        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
        title="Выйти"
      >
        <LogOut size={14} />
      </button>
    </header>
  );
};

export default Header;
