
import React, { useState, useMemo } from 'react';
import { RentalPoint, Employee, PointSchedule, EmployeeSchedule } from '../types';
import { Calendar, ChevronDown, Copy, Save, User, Clock, Plus, Trash2, X, Check, Store, ArrowDown } from 'lucide-react';

interface SchedulesViewProps {
  points: RentalPoint[];
  employees: Employee[];
  pointSchedules: PointSchedule[];
  employeeSchedules: EmployeeSchedule[];
  setPointSchedules: (s: PointSchedule[]) => void;
  setEmployeeSchedules: (s: EmployeeSchedule[]) => void;
}

const SchedulesView: React.FC<SchedulesViewProps> = ({ 
    points, employees, pointSchedules, employeeSchedules, setPointSchedules, setEmployeeSchedules 
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysToRender, setDaysToRender] = useState(14); // Render 2 weeks initially

  // State for adding new employee (keyed by date to allow independent inputs)
  const [newEmployeeSelections, setNewEmployeeSelections] = useState<Record<string, string>>({});

  // State for Copy Modal
  const [copyModalData, setCopyModalData] = useState<{isOpen: boolean, sourceDate: string}>({ isOpen: false, sourceDate: '' });
  const [copyTarget, setCopyTarget] = useState<'all' | 'weekdays' | 'weekends'>('all');
  const [copyWeeks, setCopyWeeks] = useState(1);

  // Focus State for Quick Picks Toolbar
  const [activeInput, setActiveInput] = useState<{
    type: 'point' | 'employee';
    date?: string;
    id?: string;
    field: 'openTime' | 'closeTime' | 'startTime' | 'endTime';
  } | null>(null);

  // Derived Data
  const selectedPoint = points.find(p => p.id === selectedPointId);
  const pointEmployees = employees.filter(e => e.pointId === selectedPointId);

  // Generate list of dates to display
  const datesList = useMemo(() => {
    return Array.from({ length: daysToRender }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return {
        iso: d.toISOString().split('T')[0],
        obj: d,
        dayName: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        dayNum: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      };
    });
  }, [startDate, daysToRender]);

  // --- Helpers & Handlers ---

  const getPointSchedule = (date: string) => pointSchedules.find(s => s.pointId === selectedPointId && s.date === date);
  const getEmpSchedules = (date: string) => employeeSchedules.filter(s => s.pointId === selectedPointId && s.date === date);

  const updatePointTime = (date: string, field: 'openTime' | 'closeTime', value: string) => {
    const newSchedules = [...pointSchedules];
    const idx = newSchedules.findIndex(s => s.pointId === selectedPointId && s.date === date);
    
    // Find previous values to keep consistency if creating new
    const prevOpen = getPointSchedule(date)?.openTime || '10:00';
    const prevClose = getPointSchedule(date)?.closeTime || '22:00';

    if (idx > -1) {
        newSchedules[idx] = { ...newSchedules[idx], [field]: value };
    } else {
        newSchedules.push({
            id: Date.now().toString() + Math.random(),
            pointId: selectedPointId,
            date: date,
            openTime: field === 'openTime' ? value : prevOpen,
            closeTime: field === 'closeTime' ? value : prevClose
        });
    }
    setPointSchedules(newSchedules);
  };

  const updateEmployeeTime = (id: string, field: 'startTime' | 'endTime', value: string) => {
    const newSchedules = employeeSchedules.map(s => s.id === id ? { ...s, [field]: value } : s);
    setEmployeeSchedules(newSchedules);
  };

  const addEmployee = (date: string) => {
    const empId = newEmployeeSelections[date];
    if (!empId) return;

    // Check overlap
    const existing = employeeSchedules.some(s => s.pointId === selectedPointId && s.date === date && s.employeeId === empId);
    if (existing) return;

    // Default times from point schedule
    const pSched = getPointSchedule(date);
    const start = pSched?.openTime || '10:00';
    const end = pSched?.closeTime || '22:00';

    setEmployeeSchedules([...employeeSchedules, {
        id: Date.now().toString() + Math.random(),
        employeeId: empId,
        pointId: selectedPointId,
        date: date,
        startTime: start,
        endTime: end
    }]);

    setNewEmployeeSelections({ ...newEmployeeSelections, [date]: '' });
  };

  const removeEmployee = (id: string) => {
    setEmployeeSchedules(employeeSchedules.filter(s => s.id !== id));
  };

  // --- Copy Logic ---
  const executeCopy = () => {
    if (!copyModalData.sourceDate) return;

    const sourcePoint = getPointSchedule(copyModalData.sourceDate);
    const sourceEmps = getEmpSchedules(copyModalData.sourceDate);
    
    // Defaults if source is empty
    const sOpen = sourcePoint?.openTime || '10:00';
    const sClose = sourcePoint?.closeTime || '22:00';

    const targetDates: string[] = [];
    const startObj = new Date(copyModalData.sourceDate);

    for (let i = 1; i <= copyWeeks * 7; i++) {
        const d = new Date(startObj);
        d.setDate(d.getDate() + i);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let shouldCopy = false;
        if (copyTarget === 'all') shouldCopy = true;
        if (copyTarget === 'weekdays' && !isWeekend) shouldCopy = true;
        if (copyTarget === 'weekends' && isWeekend) shouldCopy = true;

        if (shouldCopy) targetDates.push(d.toISOString().split('T')[0]);
    }

    // Clean existing for targets
    let newPS = pointSchedules.filter(s => !(s.pointId === selectedPointId && targetDates.includes(s.date)));
    let newES = employeeSchedules.filter(s => !(s.pointId === selectedPointId && targetDates.includes(s.date)));

    targetDates.forEach(date => {
        newPS.push({
            id: Date.now().toString() + Math.random(),
            pointId: selectedPointId,
            date,
            openTime: sOpen,
            closeTime: sClose
        });

        sourceEmps.forEach(e => {
            newES.push({
                id: Date.now().toString() + Math.random(),
                pointId: selectedPointId,
                employeeId: e.employeeId,
                date,
                startTime: e.startTime,
                endTime: e.endTime
            });
        });
    });

    setPointSchedules(newPS);
    setEmployeeSchedules(newES);
    setCopyModalData({ isOpen: false, sourceDate: '' });
  };

  // --- Toolbar Component ---
  const InputToolbar = () => {
    if (!activeInput) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-100/95 backdrop-blur border-t border-slate-200 p-2 z-50 flex flex-col gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom animate-in slide-in-from-bottom-10 duration-200">
        
        {/* 1. Point Time Suggestions */}
        {activeInput.type === 'point' && activeInput.date && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                 {['10:00', '11:00', '12:00', '14:00', '18:00', '21:00', '22:00', '23:00'].map(t => (
                    <button
                        key={t}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if (activeInput.date) {
                                updatePointTime(activeInput.date, activeInput.field as any, t);
                            }
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-white text-slate-700 rounded-lg text-sm font-bold shadow-sm border border-slate-200 active:bg-blue-50 active:text-blue-600 active:border-blue-200"
                    >
                        {t}
                    </button>
                 ))}
            </div>
        )}

        {/* 2. Employee Suggestions (Shifts + Times) */}
        {activeInput.type === 'employee' && activeInput.id && (
            <div className="flex flex-col gap-2">
                 {/* Presets */}
                 <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button 
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if(activeInput.id) {
                                updateEmployeeTime(activeInput.id, 'startTime', '10:00');
                                updateEmployeeTime(activeInput.id, 'endTime', '22:00');
                            }
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                        Полная (10-22)
                    </button>
                     <button 
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if(activeInput.id) {
                                updateEmployeeTime(activeInput.id, 'startTime', '10:00');
                                updateEmployeeTime(activeInput.id, 'endTime', '16:00');
                            }
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                        Утро (10-16)
                    </button>
                     <button 
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if(activeInput.id) {
                                updateEmployeeTime(activeInput.id, 'startTime', '16:00');
                                updateEmployeeTime(activeInput.id, 'endTime', '22:00');
                            }
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                        Вечер (16-22)
                    </button>
                 </div>
                 {/* Specific Times */}
                 <div className="flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-200 pt-2">
                     {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(t => (
                        <button
                            key={t}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                if (activeInput.id) {
                                    updateEmployeeTime(activeInput.id, activeInput.field as any, t);
                                }
                            }}
                            className="flex-shrink-0 px-3 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold shadow-sm border border-slate-200"
                        >
                            {t}
                        </button>
                     ))}
                 </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm rounded-b-2xl border-x border-b border-slate-200 p-3 -mt-6 mx-[-16px] px-6 mb-4">
        <div className="flex items-center gap-2">
            <Store className="text-slate-400" size={18} />
            <select 
                value={selectedPointId}
                onChange={(e) => setSelectedPointId(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none appearance-none"
            >
                {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={16} className="text-slate-400" />
        </div>
        <div className="flex justify-between items-center mt-2">
             <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded outline-none"
            />
             <div className="text-[10px] text-slate-400 font-medium">Показано {daysToRender} дней</div>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {datesList.map(date => {
            const pSched = getPointSchedule(date.iso);
            const eScheds = getEmpSchedules(date.iso);
            const open = pSched?.openTime || '10:00';
            const close = pSched?.closeTime || '22:00';

            return (
                <div key={date.iso} className={`bg-white rounded-xl shadow-sm border ${date.isWeekend ? 'border-red-100' : 'border-slate-100'} overflow-hidden`}>
                    {/* Date Header */}
                    <div className={`px-3 py-2 flex justify-between items-center ${date.isWeekend ? 'bg-red-50/50' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase w-8 ${date.isWeekend ? 'text-red-500' : 'text-slate-500'}`}>{date.dayName}</span>
                            <span className="text-sm font-black text-slate-800">{date.dayNum}</span>
                        </div>
                        <button 
                            onClick={() => setCopyModalData({ isOpen: true, sourceDate: date.iso })}
                            className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:bg-white px-2 py-0.5 rounded transition-colors"
                        >
                            <Copy size={10} /> Копировать
                        </button>
                    </div>

                    <div className="p-3 space-y-3">
                        {/* Point Time Row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <Clock size={12} /> Режим точки
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <input 
                                        type="time" 
                                        value={open}
                                        onFocus={() => setActiveInput({ type: 'point', date: date.iso, field: 'openTime' })}
                                        onBlur={() => setActiveInput(null)}
                                        onChange={(e) => updatePointTime(date.iso, 'openTime', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-center outline-none focus:border-blue-400 focus:bg-blue-50 focus:text-blue-700 transition-colors"
                                    />
                                </div>
                                <span className="text-slate-300 font-bold">-</span>
                                <div className="flex-1">
                                    <input 
                                        type="time" 
                                        value={close}
                                        onFocus={() => setActiveInput({ type: 'point', date: date.iso, field: 'closeTime' })}
                                        onBlur={() => setActiveInput(null)}
                                        onChange={(e) => updatePointTime(date.iso, 'closeTime', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-center outline-none focus:border-blue-400 focus:bg-blue-50 focus:text-blue-700 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-50"></div>

                        {/* Employees Row */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <User size={12} /> Сотрудники
                            </div>
                            
                            {eScheds.map(sch => {
                                const emp = employees.find(e => e.id === sch.employeeId);
                                if (!emp) return null;
                                return (
                                    <div key={sch.id} className="flex flex-col gap-1.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700">{emp.name}</span>
                                            <button onClick={() => removeEmployee(sch.id)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <input 
                                                type="time" 
                                                value={sch.startTime}
                                                onFocus={() => setActiveInput({ type: 'employee', id: sch.id, field: 'startTime' })}
                                                onBlur={() => setActiveInput(null)}
                                                onChange={(e) => updateEmployeeTime(sch.id, 'startTime', e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded px-1 py-1 text-[10px] font-bold text-center focus:border-blue-400 focus:bg-blue-50 focus:text-blue-700 outline-none transition-colors"
                                            />
                                            <span className="text-slate-300 text-[10px]">-</span>
                                             <input 
                                                type="time" 
                                                value={sch.endTime}
                                                onFocus={() => setActiveInput({ type: 'employee', id: sch.id, field: 'endTime' })}
                                                onBlur={() => setActiveInput(null)}
                                                onChange={(e) => updateEmployeeTime(sch.id, 'endTime', e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded px-1 py-1 text-[10px] font-bold text-center focus:border-blue-400 focus:bg-blue-50 focus:text-blue-700 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add Employee Input */}
                            <div className="flex gap-2 pt-1">
                                <div className="relative flex-1">
                                    <select 
                                        value={newEmployeeSelections[date.iso] || ''}
                                        onChange={(e) => setNewEmployeeSelections({...newEmployeeSelections, [date.iso]: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-600 outline-none appearance-none"
                                    >
                                        <option value="">+ Сотрудник</option>
                                        {pointEmployees
                                            .filter(e => !eScheds.some(s => s.employeeId === e.id))
                                            .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                                        }
                                    </select>
                                </div>
                                <button 
                                    onClick={() => addEmployee(date.iso)}
                                    disabled={!newEmployeeSelections[date.iso]}
                                    className="bg-blue-600 text-white rounded-lg px-3 py-1 text-xs shadow-sm disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
        
        <button 
            onClick={() => setDaysToRender(prev => prev + 7)}
            className="w-full py-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
            <ArrowDown size={14} /> Загрузить еще неделю
        </button>
      </div>

      <InputToolbar />

      {/* Copy Modal */}
      {copyModalData.isOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-lg">Копирование графика</h3>
                        <button onClick={() => setCopyModalData({ isOpen: false, sourceDate: '' })} className="bg-slate-100 p-1 rounded-full text-slate-500">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
                        Источник: <b>{new Date(copyModalData.sourceDate).toLocaleDateString()}</b>
                        <p className="mt-1 opacity-75">Копируется время работы точки и список сотрудников.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">На какие дни копировать?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'all', label: 'Все дни' },
                                    { id: 'weekdays', label: 'Будни' },
                                    { id: 'weekends', label: 'Выходные' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setCopyTarget(opt.id as any)}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                            copyTarget === opt.id 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">На какой период?</label>
                            <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button 
                                    onClick={() => setCopyWeeks(Math.max(1, copyWeeks - 1))}
                                    className="p-2 bg-white rounded-lg shadow-sm text-slate-600"
                                >
                                    -
                                </button>
                                <span className="font-black text-slate-800">{copyWeeks} нед.</span>
                                <button 
                                    onClick={() => setCopyWeeks(Math.min(10, copyWeeks + 1))}
                                    className="p-2 bg-white rounded-lg shadow-sm text-slate-600"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={executeCopy}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                        <Check size={18} /> Применить
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default SchedulesView;
