
import React, { useState, useRef, useMemo } from 'react';
import { RentalPoint, CashRegister, Employee, User, UserRole, AuditQuestion, AuditRequirement } from '../types';
import { Store, CreditCard, Users, Plus, Trash2, X, Check, Pencil, Briefcase, Coins, Shield, UserPlus, UserCircle, Percent, ClipboardCheck, AlertTriangle, ChevronRight, ChevronLeft, LayoutGrid } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  points: RentalPoint[];
  registers: CashRegister[];
  employees: Employee[];
  users: User[];
  morningAuditQuestions: AuditQuestion[];
  eveningAuditQuestions: AuditQuestion[];
  setPoints: (points: RentalPoint[]) => void;
  setRegisters: (registers: CashRegister[]) => void;
  setEmployees: (employees: Employee[]) => void;
  setUsers: (users: User[]) => void;
  setMorningAuditQuestions: (q: AuditQuestion[]) => void;
  setEveningAuditQuestions: (q: AuditQuestion[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser,
  points, registers, employees, users, morningAuditQuestions, eveningAuditQuestions, 
  setPoints, setRegisters, setEmployees, setUsers, setMorningAuditQuestions, setEveningAuditQuestions
}) => {
  // Navigation State: 'menu' shows the list, others show specific section
  const [activeSection, setActiveSection] = useState<'menu' | 'points' | 'registers' | 'employees' | 'users' | 'audits'>('menu');
  const [activeAuditTab, setActiveAuditTab] = useState<'morning' | 'evening'>('morning');
  
  // Role Based Visibility
  const allowedSections = useMemo(() => {
    if (currentUser.role === UserRole.SUPERVISOR) {
        return ['registers', 'employees'];
    }
    return ['points', 'registers', 'employees', 'users', 'audits'];
  }, [currentUser.role]);

  // Quick Add State
  const [quickAddPointId, setQuickAddPointId] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddPercent, setQuickAddPercent] = useState(''); 
  
  // Employee Add State
  const [quickAddPosition, setQuickAddPosition] = useState('Оператор');
  const [quickAddRate, setQuickAddRate] = useState('250');
  
  // User Add State
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [newUserPoints, setNewUserPoints] = useState<string[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Audit Add State
  const [newAuditText, setNewAuditText] = useState('');
  const [newAuditTrigger, setNewAuditTrigger] = useState<'yes' | 'no' | 'always' | ''>('');
  const [newAuditReqTypes, setNewAuditReqTypes] = useState<AuditRequirement[]>([]);
  const [isAddingAudit, setIsAddingAudit] = useState(false);

  // Audit Edit State
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [editAuditText, setEditAuditText] = useState('');
  const [editAuditTrigger, setEditAuditTrigger] = useState<'yes' | 'no' | 'always' | ''>('');
  const [editAuditReqTypes, setEditAuditReqTypes] = useState<AuditRequirement[]>([]);

  // Edit State (Common)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPercent, setEditPercent] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [editAssignedPoints, setEditAssignedPoints] = useState<string[]>([]);
  const [editPointManagerId, setEditPointManagerId] = useState<string>('');
  
  const quickInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  const getPointManager = (pointId: string) => {
    return users.find(u => u.role === UserRole.SUPERVISOR && u.assignedPointIds.includes(pointId));
  };

  const resetForms = () => {
    setEditingId(null);
    setIsAddingPoint(false);
    setIsAddingUser(false);
    setIsAddingAudit(false);
    setEditingAuditId(null);
    setQuickAddPointId(null);
  };

  const handleSectionChange = (section: typeof activeSection) => {
      resetForms();
      setActiveSection(section);
  };

  const handleAddItem = (pointId?: string) => {
    if (!quickAddValue && activeSection !== 'users') return;
    const id = Date.now().toString();
    
    if (activeSection === 'points') {
      setPoints([...points, { 
        id, 
        name: quickAddValue,
        salaryPercent: Number(quickAddPercent) || 0
      }]);
      setIsAddingPoint(false);
      setQuickAddPercent('');
    } else if (activeSection === 'registers') {
        if (!pointId) return;
        setRegisters([...registers, { id, name: quickAddValue, pointId: pointId }]);
    } else if (activeSection === 'employees') {
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
    if (!newUserLogin || !newUserPass || !quickAddValue) return;
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

  const handleAddAudit = () => {
    if (!newAuditText) return;
    const newQ: AuditQuestion = {
        id: Date.now().toString(),
        text: newAuditText,
        requireOnAnswer: newAuditTrigger === '' ? null : newAuditTrigger,
        requirementType: newAuditReqTypes
    };

    if (activeAuditTab === 'morning') {
        setMorningAuditQuestions([...morningAuditQuestions, newQ]);
    } else {
        setEveningAuditQuestions([...eveningAuditQuestions, newQ]);
    }
    setNewAuditText('');
    setNewAuditTrigger('');
    setNewAuditReqTypes([]);
    setIsAddingAudit(false);
  };

  const toggleReqType = (type: AuditRequirement) => {
      setNewAuditReqTypes(prev => 
          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
  };

  const startEditAudit = (q: AuditQuestion) => {
    setEditingAuditId(q.id);
    setEditAuditText(q.text);
    setEditAuditTrigger(q.requireOnAnswer || '');
    setEditAuditReqTypes(q.requirementType);
  };

  const toggleEditReqType = (type: AuditRequirement) => {
    setEditAuditReqTypes(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSaveAuditEdit = () => {
    if (!editingAuditId || !editAuditText) return;

    const updatedQ: AuditQuestion = {
        id: editingAuditId,
        text: editAuditText,
        requireOnAnswer: editAuditTrigger === '' ? null : editAuditTrigger,
        requirementType: editAuditReqTypes
    };

    if (activeAuditTab === 'morning') {
        setMorningAuditQuestions(morningAuditQuestions.map(q => q.id === editingAuditId ? updatedQ : q));
    } else {
        setEveningAuditQuestions(eveningAuditQuestions.map(q => q.id === editingAuditId ? updatedQ : q));
    }
    setEditingAuditId(null);
  };

  const deleteAudit = (id: string) => {
      if (activeAuditTab === 'morning') {
          setMorningAuditQuestions(morningAuditQuestions.filter(q => q.id !== id));
      } else {
          setEveningAuditQuestions(eveningAuditQuestions.filter(q => q.id !== id));
      }
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

    if (activeSection === 'points') {
      setPoints(points.map(p => p.id === editingId ? { 
        ...p, 
        name: editValue,
        salaryPercent: Number(editPercent) || 0
      } : p));
      
      const newUsers = users.map(u => {
        if (u.role !== UserRole.SUPERVISOR) return u;
        const hadPoint = u.assignedPointIds.includes(editingId);
        const isNewManager = u.id === editPointManagerId;
        if (hadPoint && !isNewManager) return { ...u, assignedPointIds: u.assignedPointIds.filter(id => id !== editingId) };
        if (!hadPoint && isNewManager) return { ...u, assignedPointIds: [...u.assignedPointIds, editingId] };
        return u;
      });
      setUsers(newUsers);
      
    } else if (activeSection === 'registers') {
      setRegisters(registers.map(r => r.id === editingId ? { ...r, name: editValue } : r));
    } else if (activeSection === 'employees') {
      setEmployees(employees.map(e => e.id === editingId ? { 
        ...e, 
        name: editValue,
        position: editPosition,
        hourlyRate: Number(editRate) || 0
      } : e));
    } else if (activeSection === 'users') {
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
    if (activeSection === 'points') {
      setPoints(points.filter(p => p.id !== id));
      setRegisters(registers.filter(r => r.pointId !== id));
      setEmployees(employees.filter(e => e.pointId !== id));
    }
    if (activeSection === 'registers') setRegisters(registers.filter(r => r.id !== id));
    if (activeSection === 'employees') setEmployees(employees.filter(e => e.id !== id));
    if (activeSection === 'users') setUsers(users.filter(u => u.id !== id));
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
    
    if (activeSection === 'points') {
      setEditPercent(item.salaryPercent?.toString() || '');
      const manager = getPointManager(id);
      setEditPointManagerId(manager?.id || '');
    }
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

  const canEditUser = (targetUser: User) => {
      if (currentUser.role === UserRole.ADMIN) return true;
      if (currentUser.role === UserRole.MANAGER) {
          // Managers cannot create/edit/delete Admins or other Managers
          return targetUser.role !== UserRole.ADMIN && targetUser.role !== UserRole.MANAGER;
      }
      return false;
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <button 
            onClick={() => handleSectionChange('menu')}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
              <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 text-slate-800">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  {icon}
              </div>
              <h2 className="text-lg font-bold">{title}</h2>
          </div>
      </div>
  );

  const MenuButton = ({ 
      icon: Icon, 
      title, 
      desc, 
      onClick, 
      colorClass = "text-blue-600 bg-blue-50" 
  }: { 
      icon: any, 
      title: string, 
      desc: string, 
      onClick: () => void, 
      colorClass?: string 
  }) => (
      <button 
          onClick={onClick}
          className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
      >
          <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
              </div>
              <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">{title}</h3>
                  <p className="text-xs text-slate-400 font-medium">{desc}</p>
              </div>
          </div>
          <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
      </button>
  );

  // --- MAIN MENU RENDER ---
  if (activeSection === 'menu') {
      return (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allowedSections.includes('points') && (
                      <MenuButton 
                        icon={Store} 
                        title="Точки проката" 
                        desc={`${points.length} активных точек`}
                        onClick={() => handleSectionChange('points')} 
                    />
                  )}
                  {allowedSections.includes('registers') && (
                      <MenuButton 
                        icon={CreditCard} 
                        title="Кассы и терминалы" 
                        desc={`${registers.length} устройств`}
                        onClick={() => handleSectionChange('registers')}
                        colorClass="text-purple-600 bg-purple-50"
                    />
                  )}
                  {allowedSections.includes('employees') && (
                      <MenuButton 
                        icon={Users} 
                        title="Сотрудники" 
                        desc={`${employees.length} человек в штате`}
                        onClick={() => handleSectionChange('employees')} 
                        colorClass="text-green-600 bg-green-50"
                    />
                  )}
                  {allowedSections.includes('users') && (
                      <MenuButton 
                        icon={Shield} 
                        title="Пользователи и Доступы" 
                        desc={`${users.length} аккаунтов`}
                        onClick={() => handleSectionChange('users')}
                        colorClass="text-orange-600 bg-orange-50"
                    />
                  )}
                  {allowedSections.includes('audits') && (
                      <MenuButton 
                        icon={ClipboardCheck} 
                        title="Настройка Аудитов" 
                        desc="Чек-листы открытия и закрытия"
                        onClick={() => handleSectionChange('audits')} 
                        colorClass="text-teal-600 bg-teal-50"
                    />
                  )}
              </div>
              
              <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-3">
                  <LayoutGrid size={20} className="text-slate-400" />
                  <p className="text-xs text-slate-500 font-medium">
                      Выберите раздел для настройки справочников системы. Изменения применяются мгновенно.
                  </p>
              </div>
          </div>
      );
  }

  // --- SECTIONS RENDER ---
  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px] animate-in slide-in-from-right-8 duration-300">
          
      {/* Points Tab Content */}
      {activeSection === 'points' && allowedSections.includes('points') && (
        <div className="space-y-4">
          {renderSectionHeader("Точки проката", <Store size={20} />)}
          
          <div className="flex justify-between items-center mb-2 px-1">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Список точек</h4>
            <button 
              onClick={() => setIsAddingPoint(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} /> Добавить точку
            </button>
          </div>

          {isAddingPoint && (
            <div className="grid grid-cols-[1fr_80px_auto_auto] gap-2 items-center bg-blue-50 p-2 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 max-w-xl">
              <input 
                ref={quickInputRef}
                autoFocus
                type="text"
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none w-full"
                placeholder="Название..."
              />
              <div className="relative">
                <input 
                  type="number"
                  value={quickAddPercent}
                  onChange={(e) => setQuickAddPercent(e.target.value)}
                  className="bg-white border border-blue-200 rounded-lg px-2 py-1.5 pl-6 text-xs font-semibold outline-none w-full"
                  placeholder="%"
                />
                <Percent size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button onClick={() => handleAddItem()} className="p-1.5 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
              <button onClick={() => setIsAddingPoint(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {points.map(item => {
              const manager = getPointManager(item.id);
              return (
                <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  {editingId === item.id ? (
                    <div className="p-3 bg-blue-50/50 space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-[1fr_80px] gap-2">
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
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">% ЗП</label>
                            <input 
                              type="number"
                              value={editPercent}
                              onChange={(e) => setEditPercent(e.target.value)}
                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                        </div>
                      </div>
                      
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
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                        <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold">Сохранить</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 flex justify-between items-center h-full">
                      <div>
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                                <UserCircle size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-500 font-medium">
                                    {manager ? manager.name : 'Нет упр.'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                                <Percent size={8} className="text-green-600" />
                                <span className="text-[9px] text-green-700 font-bold">{item.salaryPercent || 0}% ЗП</span>
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
      {activeSection === 'users' && allowedSections.includes('users') && (
        <div className="space-y-4">
            {renderSectionHeader("Пользователи", <Shield size={20} />)}
            <div className="flex justify-between items-center mb-2 px-1">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Список пользователей</h4>
            <button 
              onClick={() => { setIsAddingUser(true); setEditingId(null); }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UserPlus size={14} /> Добавить
            </button>
          </div>

          {isAddingUser && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-3 md:max-w-2xl">
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
                  {/* Managers cannot create Admins or Managers */}
                  {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Администратор</option>}
                  {currentUser.role === UserRole.ADMIN && <option value={UserRole.MANAGER}>Менеджер</option>}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm h-fit">
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
                          {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Администратор</option>}
                          {currentUser.role === UserRole.ADMIN && <option value={UserRole.MANAGER}>Менеджер</option>}
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
                    {canEditUser(user) && (
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
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDITS Tab Content */}
      {activeSection === 'audits' && allowedSections.includes('audits') && (
          <div className="space-y-4">
              {renderSectionHeader("Аудиты", <ClipboardCheck size={20} />)}
              <div className="flex bg-slate-50 rounded-lg p-1 w-fit mb-4">
                  <button 
                    onClick={() => setActiveAuditTab('morning')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeAuditTab === 'morning' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                  >
                      Утренний аудит
                  </button>
                  <button 
                    onClick={() => setActiveAuditTab('evening')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeAuditTab === 'evening' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                  >
                      Вечерний аудит
                  </button>
              </div>

              <div className="flex justify-between items-center mb-2 px-1">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Вопросы {activeAuditTab === 'morning' ? 'утреннего' : 'вечернего'} аудита
                  </h4>
                  <button 
                      onClick={() => setIsAddingAudit(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                      <Plus size={14} /> Добавить
                  </button>
              </div>

              {isAddingAudit && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-3">
                      <input 
                          type="text"
                          value={newAuditText}
                          onChange={(e) => setNewAuditText(e.target.value)}
                          placeholder="Текст вопроса"
                          className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none"
                          autoFocus
                      />
                      <div className="flex flex-col gap-3">
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Требовать подтверждение если ответ:</label>
                              <select 
                                  value={newAuditTrigger}
                                  onChange={(e) => setNewAuditTrigger(e.target.value as any)}
                                  className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                              >
                                  <option value="">Не требовать</option>
                                  <option value="yes">Да</option>
                                  <option value="no">Нет</option>
                                  <option value="always">Всегда</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Тип требования (можно несколько):</label>
                              <div className={`flex gap-3 ${!newAuditTrigger ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={newAuditReqTypes.includes('photo')}
                                          onChange={() => toggleReqType('photo')}
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-xs font-bold text-slate-600">Фото</span>
                                  </label>
                                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={newAuditReqTypes.includes('comment')}
                                          onChange={() => toggleReqType('comment')}
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-xs font-bold text-slate-600">Комментарий</span>
                                  </label>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                          <button onClick={() => setIsAddingAudit(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                          <button onClick={handleAddAudit} disabled={!newAuditText} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold disabled:opacity-50">Добавить</button>
                      </div>
                  </div>
              )}

              <div className="space-y-2">
                  {(activeAuditTab === 'morning' ? morningAuditQuestions : eveningAuditQuestions).map((q) => (
                      <div key={q.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                          {editingAuditId === q.id ? (
                              <div className="p-4 bg-blue-50/50 space-y-3 animate-in fade-in">
                                  <input 
                                      type="text"
                                      value={editAuditText}
                                      onChange={(e) => setEditAuditText(e.target.value)}
                                      placeholder="Текст вопроса"
                                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none"
                                  />
                                  <div className="flex flex-col gap-3">
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Требовать подтверждение если ответ:</label>
                                          <select 
                                              value={editAuditTrigger}
                                              onChange={(e) => setEditAuditTrigger(e.target.value as any)}
                                              className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                                          >
                                              <option value="">Не требовать</option>
                                              <option value="yes">Да</option>
                                              <option value="no">Нет</option>
                                              <option value="always">Всегда</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Тип требования:</label>
                                          <div className={`flex gap-3 ${!editAuditTrigger ? 'opacity-50 pointer-events-none' : ''}`}>
                                              <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 cursor-pointer">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={editAuditReqTypes.includes('photo')}
                                                      onChange={() => toggleEditReqType('photo')}
                                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                  />
                                                  <span className="text-xs font-bold text-slate-600">Фото</span>
                                              </label>
                                              <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 cursor-pointer">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={editAuditReqTypes.includes('comment')}
                                                      onChange={() => toggleEditReqType('comment')}
                                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                  />
                                                  <span className="text-xs font-bold text-slate-600">Комментарий</span>
                                              </label>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                      <button onClick={() => setEditingAuditId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Отмена</button>
                                      <button onClick={handleSaveAuditEdit} disabled={!editAuditText} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold disabled:opacity-50">Сохранить</button>
                                  </div>
                              </div>
                          ) : (
                              <div className="p-3 flex justify-between items-center">
                                  <div>
                                      <p className="text-sm font-bold text-slate-700">{q.text}</p>
                                      {q.requireOnAnswer && (
                                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                                              <AlertTriangle size={10} />
                                              Условие: 
                                              <b className="mx-1">{q.requireOnAnswer === 'yes' ? 'Да' : q.requireOnAnswer === 'no' ? 'Нет' : 'Всегда'}</b>
                                               -> Требовать: 
                                              <span className="ml-1 font-bold">
                                                  {q.requirementType.map(t => t === 'photo' ? 'Фото' : 'Коммент').join(' + ')}
                                              </span>
                                          </p>
                                      )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => startEditAudit(q)} className="text-slate-300 hover:text-blue-500 transition-colors p-1">
                                          <Pencil size={14} />
                                      </button>
                                      <button onClick={() => deleteAudit(q.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
                  {(activeAuditTab === 'morning' ? morningAuditQuestions : eveningAuditQuestions).length === 0 && (
                      <p className="text-center text-sm text-slate-400 italic py-4">Вопросов нет</p>
                  )}
              </div>
          </div>
      )}

      {/* Registers and Employees Tabs */}
      {(activeSection === 'registers' || activeSection === 'employees') && (
        <div className="space-y-4">
          {renderSectionHeader(activeSection === 'registers' ? "Кассы и терминалы" : "Персонал", activeSection === 'registers' ? <CreditCard size={20} /> : <Users size={20} />)}
          
          {points.map(point => {
            const pointItems = activeSection === 'registers' 
              ? registers.filter(r => r.pointId === point.id)
              : employees.filter(e => e.pointId === point.id);
            const isQuickAdding = quickAddPointId === point.id;

            return (
              <div key={point.id} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-1 rounded-full ${activeSection === 'registers' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${activeSection === 'registers' ? 'text-purple-600' : 'text-green-600'}`}>
                      {point.name}
                    </h4>
                  </div>
                  <button 
                    onClick={() => startQuickAdd(point.id)}
                    className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${activeSection === 'registers' ? 'text-purple-600' : 'text-green-600'}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-1 ml-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {isQuickAdding && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-2 mb-2 col-span-full md:col-span-1">
                      <input 
                        ref={quickInputRef}
                        type="text"
                        value={quickAddValue}
                        onChange={(e) => setQuickAddValue(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-400 outline-none"
                        placeholder={activeSection === 'registers' ? "Название кассы..." : "ФИО сотрудника..."}
                      />
                      {activeSection === 'employees' && (
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
                    <div key={item.id} className="bg-slate-50 rounded-xl group border border-slate-100 overflow-hidden h-fit">
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
                          {activeSection === 'employees' && (
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
                    <p className="text-[10px] text-slate-400 italic py-1 col-span-full">Пусто</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {points.length === 0 && (activeSection === 'registers' || activeSection === 'employees') && (
        <div className="py-12 text-center">
          <Store size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-400 font-medium">Для начала работы добавьте точку проката</p>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
