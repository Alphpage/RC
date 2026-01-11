import React, { useState, useRef, useEffect } from 'react';
import { RentalPoint, CashRegister, Employee, User, UserRole } from '../types';
import { Store, CreditCard, Users, Plus, Trash2, MapPin, X, Check, Pencil, Briefcase, Coins, Shield, UserPlus, UserCircle, Percent } from 'lucide-react';

interface SettingsViewProps {
  points: RentalPoint[];
  registers: CashRegister[];
  employees: Employee[];
  users: User[];
  currentUser: User;
  setPoints: (points: RentalPoint[]) => void;
  setRegisters: (registers: CashRegister[]) => void;
  setEmployees: (employees: Employee[]) => void;
  setUsers: (users: User[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  points, registers, employees, users, currentUser, setPoints, setRegisters, setEmployees, setUsers
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isManager = currentUser.role === UserRole.MANAGER;
  const isSupervisor = currentUser.role === UserRole.SUPERVISOR;

  // Define allowed sections based on role with explicit type
  const allowedSections: string[] = [];
  if (isAdmin || isManager) allowedSections.push('points', 'registers', 'employees');
  if (isAdmin) allowedSections.push('users');
  if (isSupervisor) allowedSections.push('registers');

  const [activeSection, setActiveSection] = useState<'points' | 'registers' | 'employees' | 'users'>(
    allowedSections[0] as any
  );
  
  useEffect(() => {
    if (!allowedSections.includes(activeSection)) {
      setActiveSection(allowedSections[0] as any);
    }
  }, [currentUser.role]);
  
  // Quick Add State
  const [quickAddPointId, setQuickAddPointId] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');
  
  // Employee Add State
  const [quickAddPosition, setQuickAddPosition] = useState('Оператор');
  const [quickAddRate, setQuickAddRate] = useState('250');
  
  // User Add State
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [newUserPoints, setNewUserPoints] = useState<string[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [editAssignedPoints, setEditAssignedPoints] = useState<string[]>([]);
  const [editPointManagerId, setEditPointManagerId] = useState<string>('');
  const [editServicePercent, setEditServicePercent] = useState<string>('0');
  
  const quickInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  const getPointManager = (pointId: string) => {
    return users.find(u => u.role === UserRole.SUPERVISOR && u.assignedPointIds.includes(pointId));
  };

  // Helper to check if a supervisor can edit a specific point/item
  const canEditPoint = (pointId: string) => {
    if (isAdmin || isManager) return true;
    if (isSupervisor) return currentUser.assignedPointIds.includes(pointId);
    return false;
  };

  const handleAddItem = (pointId?: string) => {
    if (!quickAddValue && activeSection !== 'users') return;
    const id = Date.now().toString();
    
    if (activeSection === 'points' && (isAdmin || isManager)) {
      setPoints([...points, { id, name: quickAddValue, serviceSalePercent: 0 }]);
      setIsAddingPoint(false);
    } else if (activeSection === 'registers') {
        if (!pointId || !canEditPoint(pointId)) return;
        setRegisters([...registers, { id, name: quickAddValue, pointId: pointId }]);
    } else if (activeSection === 'employees' && (isAdmin || isManager)) {
        if (!pointId) return;
        setEmployees([...employees, { 
          id, 
          name: quickAddValue, 
          pointId: pointId, 
          hourlyRate: Number(quickAddRate) || 0, 
          position: quickAddPosition || 'Оператор' 
        }]);
    }
    
    setQuickAddPointId(null);
    setQuickAddValue('');
    setQuickAddPosition('Оператор');
    setQuickAddRate('250');
  };

  const handleAddUser = () => {
    if (!isAdmin || !newUserLogin || !newUserPass || !quickAddValue) return;
    const id = Date.now().toString();
    setUsers([...users, {
      id,
      login: newUserLogin,
      password: newUserPass,
      name: quickAddValue,
      role: newUserRole,
      assignedPointIds: newUserRole === UserRole.SUPERVISOR ? newUserPoints : []
    }]);
    setIsAddingUser(false);
    setQuickAddValue('');
    setNewUserLogin('');
    setNewUserPass('');
    setNewUserPoints([]);
    setNewUserRole(UserRole.SUPERVISOR);
  };

  const toggleUserPoint = (pointId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditAssignedPoints(prev => 
        prev.includes(pointId) ? prev.filter(p => p !== pointId) : [...prev, pointId]
      );
    } else {
      setNewUserPoints(prev => 
        prev.includes(pointId) ? prev.filter(p => p !== pointId) : [...prev, pointId]
      );
    }
  };

  const handleSaveEdit = () => {
    if (!editingId || !editValue) {
      setEditingId(null);
      return;
    }

    if (activeSection === 'points' && (isAdmin || isManager)) {
      setPoints(points.map(p => p.id === editingId ? { 
        ...p, 
        name: editValue,
        serviceSalePercent: Number(editServicePercent) || 0
      } : p));
      
      if (isAdmin) {
        // Only admin can reassign managers
        const newUsers = users.map(u => {
          if (u.role !== UserRole.SUPERVISOR) return u;
          const hadPoint = u.assignedPointIds.includes(editingId);
          const isNewManager = u.id === editPointManagerId;
          if (hadPoint && !isNewManager) return { ...u, assignedPointIds: u.assignedPointIds.filter(id => id !== editingId) };
          if (!hadPoint && isNewManager) return { ...u, assignedPointIds: [...u.assignedPointIds, editingId] };
          return u;
        });
        setUsers(newUsers);
      }
      
    } else if (activeSection === 'registers') {
      const reg = registers.find(r => r.id === editingId);
      if (reg && canEditPoint(reg.pointId)) {
        setRegisters(registers.map(r => r.id === editingId ? { ...r, name: editValue } : r));
      }
    } else if (activeSection === 'employees' && (isAdmin || isManager)) {
      setEmployees(employees.map(e => e.id === editingId ? { 
        ...e, 
        name: editValue,
        position: editPosition,
        hourlyRate: Number(editRate) || 0
      } : e));
    } else if (activeSection === 'users' && isAdmin) {
      setUsers(users.map(u => u.id === editingId ? {
        ...u,
        name: editValue,
        login: editLogin,
        password: editPass,
        role: editRole,
        assignedPointIds: editRole === UserRole.SUPERVISOR ? editAssignedPoints : []
      } : u));
    }

    setEditingId(null);
  };

  const deleteItem = (id: string) => {
    if (activeSection === 'points' && (isAdmin || isManager)) {
      setPoints(points.filter(p => p.id !== id));
      setRegisters(registers.filter(r => r.pointId !== id));
      setEmployees(employees.filter(e => e.pointId !== id));
    }
    if (activeSection === 'registers') {
      const reg = registers.find(r => r.id === id);
      if (reg && canEditPoint(reg.pointId)) {
        setRegisters(registers.filter(r => r.id !== id));
      }
    }
    if (activeSection === 'employees' && (isAdmin || isManager)) setEmployees(employees.filter(e => e.id !== id));
    if (activeSection === 'users' && isAdmin) setUsers(users.filter(u => u.id !== id));
  };

  const startQuickAdd = (pointId: string) => {
    setQuickAddPointId(pointId);
    setQuickAddValue('');
    setQuickAddPosition('Оператор');
    setQuickAddRate('250');
    setTimeout(() => quickInputRef.current?.focus(), 10);
  };

  const startEdit = (id: string, item: any) => {
    setEditingId(id);
    setEditValue(item.name);
    if (activeSection === 'employees') {
      setEditPosition(item.position || '');
      setEditRate(item.hourlyRate?.toString() || '');
    }
    if (activeSection === 'users') {
      setEditLogin(item.login || '');
      setEditPass(item.password || '');
      setEditRole(item.role || UserRole.SUPERVISOR);
      setEditAssignedPoints(item.assignedPointIds || []);
    }
    if (activeSection === 'points') {
      const manager = getPointManager(id);
      setEditPointManagerId(manager?.id || '');
      setEditServicePercent(item.serviceSalePercent?.toString() || '0');
    }
    setTimeout(() => editInputRef.current?.focus(), 10);
  };

  const roleName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Администратор';
      case UserRole.MANAGER: return 'Менеджер';
      case UserRole.SUPERVISOR: return 'Управляющий';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl overflow-x-auto">
        {allowedSections.includes('points') && (
          <button 
            onClick={() => { setActiveSection('points'); setEditingId(null); setIsAddingPoint(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeSection === 'points' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <Store size={14} /> Точки
          </button>
        )}
        {allowedSections.includes('registers') && (
          <button 
            onClick={() => { setActiveSection('registers'); setEditingId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeSection === 'registers' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <CreditCard size={14} /> Кассы
          </button>
        )}
        {allowedSections.includes('employees') && (
          <button 
            onClick={() => { setActiveSection('employees'); setEditingId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeSection === 'employees' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <Users size={14} /> Персонал
          </button>
        )}
        {allowedSections.includes('users') && (
          <button 
            onClick={() => { setActiveSection('users'); setEditingId(null); setIsAddingUser(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeSection === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <Shield size={14} /> Пользователи
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-6">
          
          {/* Points Tab Content */}
          {activeSection === 'points' && (isAdmin || isManager) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Список точек</h4>
                <button 
                  onClick={() => setIsAddingPoint(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
                >
                  <Plus size={12} /> Добавить точку
                </button>
              </div>

              {isAddingPoint && (
                <div className="flex items-center gap-1 bg-blue-50 p-2 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1">
                  <input 
                    ref={quickInputRef}
                    autoFocus
                    type="text"
                    value={quickAddValue}
                    onChange={(e) => setQuickAddValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem();
                      if (e.key === 'Escape') setIsAddingPoint(false);
                    }}
                    className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                    placeholder="Название новой точки..."
                  />
                  <button onClick={() => handleAddItem()} className="p-1.5 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
                  <button onClick={() => setIsAddingPoint(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"><X size={14} /></button>
                </div>
              )}

              <div className="space-y-2">
                {points.map(item => {
                  const manager = getPointManager(item.id);
                  return (
                    <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      {editingId === item.id ? (
                        <div className="p-3 bg-blue-50/50 space-y-3 animate-in fade-in">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Название точки</label>
                            <input 
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                          </div>
                          {isAdmin && (
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Управляющий</label>
                              <select 
                                value={editPointManagerId}
                                onChange={(e) => setEditPointManagerId(e.target.value)}
                                className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                              >
                                <option value="">Без управляющего</option>
                                {users.filter(u => u.role === UserRole.SUPERVISOR).map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Процент на продажу услуг</label>
                            <div className="relative">
                              <input 
                                type="number"
                                value={editServicePercent}
                                onChange={(e) => setEditServicePercent(e.target.value)}
                                className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 pr-7 text-xs font-bold outline-none"
                                placeholder="0"
                              />
                              <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold">Сохранить</button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 flex justify-between items-center">
                          <div>
                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                              <div className="flex items-center gap-1.5">
                                <UserCircle size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {manager ? manager.name : 'Без упр.'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Percent size={10} className="text-blue-400" />
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {item.serviceSalePercent || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(item.id, item)} className="text-slate-300 hover:text-blue-500 transition-colors p-1">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* USERS Tab Content */}
          {activeSection === 'users' && isAdmin && (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-2 px-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Список пользователей</h4>
                <button 
                  onClick={() => { setIsAddingUser(true); setEditingId(null); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
                >
                  <UserPlus size={12} /> Добавить
                </button>
              </div>

              {isAddingUser && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-3">
                  <h5 className="text-xs font-bold text-blue-700">Новый пользователь</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      value={quickAddValue}
                      onChange={(e) => setQuickAddValue(e.target.value)}
                      placeholder="Имя"
                      className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                    />
                     <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none font-bold"
                    >
                      <option value={UserRole.ADMIN}>Администратор</option>
                      <option value={UserRole.MANAGER}>Менеджер</option>
                      <option value={UserRole.SUPERVISOR}>Управляющий</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      value={newUserLogin}
                      onChange={(e) => setNewUserLogin(e.target.value)}
                      placeholder="Логин"
                      className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                    />
                    <input 
                      type="text"
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      placeholder="Пароль"
                      className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                    />
                  </div>
                  {newUserRole === UserRole.SUPERVISOR && (
                    <div className="bg-white rounded-lg p-2 border border-blue-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Доступ к точкам:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {points.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => toggleUserPoint(p.id)}
                            className={`text-[10px] font-bold p-1.5 rounded cursor-pointer border transition-all ${newUserPoints.includes(p.id) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                          >
                             {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setIsAddingUser(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                    <button onClick={handleAddUser} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Создать</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    {editingId === user.id ? (
                      <div className="p-4 bg-blue-50/30 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Имя</label>
                            <input 
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Роль</label>
                            <select 
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            >
                              <option value={UserRole.ADMIN}>Администратор</option>
                              <option value={UserRole.MANAGER}>Менеджер</option>
                              <option value={UserRole.SUPERVISOR}>Управляющий</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Логин</label>
                            <input 
                              type="text"
                              value={editLogin}
                              onChange={(e) => setEditLogin(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Пароль</label>
                            <input 
                              type="text"
                              value={editPass}
                              onChange={(e) => setEditPass(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                          </div>
                        </div>
                        {editRole === UserRole.SUPERVISOR && (
                          <div className="bg-white rounded-lg p-2 border border-blue-100">
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Доступ к точкам:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {points.map(p => (
                                <div 
                                  key={p.id} 
                                  onClick={() => toggleUserPoint(p.id, true)}
                                  className={`text-[10px] font-bold p-1.5 rounded cursor-pointer border transition-all ${editAssignedPoints.includes(p.id) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                >
                                   {p.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                          <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold">Сохранить</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                              user.role === UserRole.MANAGER ? 'bg-green-100 text-green-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {roleName(user.role)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Логин: <span className="font-mono text-slate-600">{user.login}</span></p>
                          {user.role === UserRole.SUPERVISOR && (
                            <p className="text-[10px] text-slate-400">
                              Точек: {user.assignedPointIds.length}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(user.id, user)} className="text-slate-300 hover:text-blue-500 transition-colors p-2">
                            <Pencil size={16} />
                          </button>
                          {user.login !== 'admin' && (
                            <button onClick={() => deleteItem(user.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registers and Employees Tabs */}
          {(activeSection === 'registers' || activeSection === 'employees') && points.filter(p => canEditPoint(p.id)).map(point => {
            const pointItems = activeSection === 'registers' 
              ? registers.filter(r => r.pointId === point.id)
              : employees.filter(e => e.pointId === point.id);
            const isQuickAdding = quickAddPointId === point.id;

            return (
              <div key={point.id} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-1 rounded-full ${activeSection === 'registers' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${activeSection === 'registers' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {point.name}
                    </h4>
                  </div>
                  <button 
                    onClick={() => startQuickAdd(point.id)}
                    className="p-1 rounded-md hover:bg-slate-100 text-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-1 ml-3">
                  {isQuickAdding && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-2 mb-2">
                      <input 
                        ref={quickInputRef}
                        type="text"
                        value={quickAddValue}
                        onChange={(e) => setQuickAddValue(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-400 outline-none"
                        placeholder={activeSection === 'registers' ? "Название кассы..." : "ФИО сотрудника..."}
                      />
                      {activeSection === 'employees' && (isAdmin || isManager) && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input 
                              type="text"
                              value={quickAddPosition}
                              onChange={(e) => setQuickAddPosition(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 pl-7 text-[10px] font-semibold focus:ring-1 focus:ring-blue-400 outline-none"
                              placeholder="Должность"
                            />
                            <Briefcase size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              value={quickAddRate}
                              onChange={(e) => setQuickAddRate(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 pl-7 text-[10px] font-semibold focus:ring-1 focus:ring-blue-400 outline-none"
                              placeholder="Ставка"
                            />
                            <Coins size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setQuickAddPointId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                        <button onClick={() => handleAddItem(point.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Добавить</button>
                      </div>
                    </div>
                  )}

                  {pointItems.length > 0 ? pointItems.map(item => (
                    <div key={item.id} className="bg-slate-50 rounded-xl group border border-slate-100 overflow-hidden">
                      {editingId === item.id ? (
                        <div className="p-3 bg-blue-50/50 space-y-2 animate-in fade-in">
                          <input 
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            placeholder="Имя"
                          />
                          {activeSection === 'employees' && (isAdmin || isManager) && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <input 
                                  type="text"
                                  value={editPosition}
                                  onChange={(e) => setEditPosition(e.target.value)}
                                  className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 pl-7 text-[10px] font-semibold"
                                  placeholder="Должность"
                                />
                                <Briefcase size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                              <div className="relative">
                                <input 
                                  type="number"
                                  value={editRate}
                                  onChange={(e) => setEditRate(e.target.value)}
                                  className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 pl-7 text-[10px] font-semibold"
                                  placeholder="Ставка"
                                />
                                <Coins size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold">Сохранить</button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{item.name}</p>
                            {activeSection === 'employees' && (
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                {(item as Employee).position} • {(item as Employee).hourlyRate}₽/час
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(item.id, item)} className="text-slate-300 hover:text-blue-500 transition-colors p-1">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : !isQuickAdding && (
                    <p className="text-[10px] text-slate-400 italic py-1">Пусто</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {points.length === 0 && (activeSection === 'registers' || activeSection === 'employees') && (
          <div className="py-12 text-center">
            <Store size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">Для начала работы добавьте точку проката</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;