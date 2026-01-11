import React from 'react';
import { Tab, UserRole } from '../types';
import { Clock, HandCoins, Coins, Settings, Sparkles } from 'lucide-react';

const RubleIcon = ({ size = 24, ...props }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3h7a5 5 0 0 1 0 10H6" />
    <path d="M6 13h9" />
    <path d="M6 17h9" />
    <path d="M6 3v18" />
  </svg>
);

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userRole?: UserRole;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, userRole }) => {
  const navItems = [
    { id: Tab.REVENUE, icon: RubleIcon },
    { id: Tab.TIMESHEETS, icon: Clock },
    { id: Tab.ENCASHMENT, icon: HandCoins },
    { id: Tab.SALARY, icon: Coins },
    { id: Tab.AI_EDITOR, icon: Sparkles },
    { id: Tab.SETTINGS, icon: Settings },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30 shadow-sm overflow-x-auto scrollbar-hide">
      <div className="flex justify-around items-center p-2 min-w-max px-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all flex-shrink-0 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;