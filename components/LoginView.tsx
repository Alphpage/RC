
import React, { useState } from 'react';
import { UserRole } from '../types';
import { Lock, User as UserIcon, LogIn } from 'lucide-react';

interface LoginViewProps {
  onLogin: (login: string, password: string) => void;
  error?: string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, error }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(login, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">RentControl Pro</h1>
          <p className="text-slate-500 text-sm mt-1">Система управления прокатом</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Логин"
              />
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Пароль"
              />
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Войти в систему
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">
            Демо доступы
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2 rounded-lg text-center cursor-pointer hover:bg-slate-100" onClick={() => {setLogin('admin'); setPassword('admin');}}>
              <p className="text-xs font-bold text-slate-700">admin</p>
              <p className="text-[9px] text-slate-400">Пароль: admin</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center cursor-pointer hover:bg-slate-100" onClick={() => {setLogin('manager'); setPassword('manager');}}>
              <p className="text-xs font-bold text-slate-700">manager</p>
              <p className="text-[9px] text-slate-400">Пароль: manager</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center cursor-pointer hover:bg-slate-100" onClick={() => {setLogin('user'); setPassword('user');}}>
              <p className="text-xs font-bold text-slate-700">user</p>
              <p className="text-[9px] text-slate-400">Пароль: user</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
