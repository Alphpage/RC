
import React, { useState, useMemo } from 'react';
import { RentalPoint, Employee, TimesheetEntry } from '../types';
import { Calendar, Filter, Lock, X, Check, Clock, Minus, Plus } from 'lucide-react';

interface TimesheetViewProps {
  points: RentalPoint[];
  employees: Employee[];
  entries: TimesheetEntry[];
  onUpdate: (entries: TimesheetEntry[]) => void;
  isReadOnly?: boolean;
}

const RUSSIAN_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const TimesheetView: React.FC<TimesheetViewProps> = ({ points, employees, entries, onUpdate, isReadOnly = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPointId, setSelectedPointId] = useState<string>('all');
  
  // Editor State
  const [editCell, setEditCell] = useState<{empId: string, day: number, name: string} | null>(null);
  const [tempHours, setTempHours] = useState<string>('');

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(selectedYear, selectedMonth, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; 
      return { day, isWeekend };
    });
  }, [selectedYear, selectedMonth, daysInMonth]);

  const groupedData = useMemo(() => {
    if (selectedPointId !== 'all') {
      const point = points.find(p => p.id === selectedPointId);
      const emps = employees.filter(e => e.pointId === selectedPointId);
      return emps.length > 0 ? [{ point, emps }] : [];
    }
    return points.map(point => ({
      point,
      emps: employees.filter(e => e.pointId === point.id)
    })).filter(group => group.emps.length > 0);
  }, [points, employees, selectedPointId]);

  const getHours = (employeeId: string, day: number) => {
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const entry = entries.find(e => e.employeeId === employeeId && e.date === dateStr);
    return entry ? entry.hours.toString() : '';
  };

  const openEditor = (empId: string, day: number, name: string) => {
    if (isReadOnly) return;
    const currentHours = getHours(empId, day);
    setTempHours(currentHours);
    setEditCell({ empId, day, name });
  };

  const saveHours = (hoursValue: string) => {
    if (!editCell) return;
    
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${editCell.day.toString().padStart(2, '0')}`;
    const hours = parseFloat(hoursValue) || 0;

    const existingIndex = entries.findIndex(e => e.employeeId === editCell.empId && e.date === dateStr);
    
    let newEntries = [...entries];
    if (existingIndex > -1) {
      if (hours === 0) {
        newEntries.splice(existingIndex, 1);
      } else {
        newEntries[existingIndex] = { ...newEntries[existingIndex], hours };
      }
    } else if (hours > 0) {
      newEntries.push({
        id: Math.random().toString(36).substr(2, 9),
        pointId: employees.find(e => e.id === editCell.empId)?.pointId || '',
        employeeId: editCell.empId,
        date: dateStr,
        hours
      });
    }
    onUpdate(newEntries);
    setEditCell(null);
  };

  const adjustHours = (amount: number) => {
    const current = parseFloat(tempHours) || 0;
    const next = Math.max(0, Math.min(24, current + amount));
    setTempHours(next.toString());
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Год</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Месяц</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {RUSSIAN_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Точка проката</label>
          <div className="relative">
            <select 
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold pl-9"
            >
              <option value="all">Все точки</option>
              {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {isReadOnly && (
          <div className="absolute top-2 right-2 z-10 bg-slate-100 px-2 py-1 rounded text-[9px] font-bold text-slate-500 flex items-center gap-1 opacity-80">
            <Lock size={10} /> Только чтение
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 bg-slate-50 border-r border-b border-slate-100 p-3 text-left min-w-[140px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Сотрудник</span>
                  </div>
                </th>
                {daysArray.map(({ day, isWeekend }) => (
                  <th key={day} className={`border-b border-slate-100 p-2 text-center min-w-[45px] ${isWeekend ? 'bg-red-50/50 text-red-500' : 'text-slate-400'}`}>
                    <span className="text-[10px] font-bold">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.length > 0 ? (
                groupedData.map(({ point, emps }) => (
                  <React.Fragment key={point?.id}>
                    {selectedPointId === 'all' && (
                      <tr>
                        <td className="bg-blue-50/90 border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          {point?.name}
                        </td>
                        <td colSpan={daysInMonth} className="bg-blue-50/90 border-b border-slate-100"></td>
                      </tr>
                    )}
                    {emps.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white border-r border-b border-slate-50 p-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{emp.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{emp.position}</p>
                        </td>
                        {daysArray.map(({ day, isWeekend }) => {
                          const val = getHours(emp.id, day);
                          return (
                            <td 
                              key={day} 
                              className={`border-b border-slate-50 p-0 relative ${isWeekend ? 'bg-red-50/20' : ''}`}
                              onClick={() => openEditor(emp.id, day, emp.name)}
                            >
                              <div className={`w-full h-10 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${val ? 'text-blue-600 bg-blue-50/30' : 'text-slate-300'} ${editCell?.empId === emp.id && editCell.day === day ? 'bg-blue-200 ring-2 ring-blue-500 ring-inset' : ''}`}>
                                {val || '-'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={daysInMonth + 1} className="p-8 text-center text-slate-400 text-xs italic">
                    Нет сотрудников для отображения
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Edit Sheet (Overlay) */}
      {editCell && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setEditCell(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl shadow-2xl border-t border-slate-100 p-5 pb-8 animate-in slide-in-from-bottom-full duration-300">
             <div className="flex justify-between items-start mb-6">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Редактирование часов</p>
                  <h3 className="text-lg font-bold text-slate-800">{editCell.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{editCell.day} {RUSSIAN_MONTHS[selectedMonth]}</p>
               </div>
               <button onClick={() => setEditCell(null)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                 <X size={20} />
               </button>
             </div>

             <div className="flex items-center justify-center gap-4 mb-8">
               <button onClick={() => adjustHours(-0.5)} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center active:bg-slate-200">
                 <Minus size={24} />
               </button>
               <div className="w-24 text-center">
                 <span className="text-4xl font-black text-slate-800">{tempHours || '0'}</span>
                 <span className="text-sm font-bold text-slate-400 ml-1">ч</span>
               </div>
               <button onClick={() => adjustHours(0.5)} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center active:bg-slate-200">
                 <Plus size={24} />
               </button>
             </div>

             <div className="grid grid-cols-4 gap-2 mb-6">
               {[12, 11, 10, 8].map(h => (
                 <button 
                  key={h} 
                  onClick={() => setTempHours(h.toString())}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors ${tempHours === h.toString() ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                 >
                   {h}
                 </button>
               ))}
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => saveHours('0')}
                className="py-3.5 bg-red-50 text-red-600 font-bold rounded-xl active:scale-95 transition-transform"
               >
                 Выходной (0)
               </button>
               <button 
                onClick={() => saveHours(tempHours)}
                className="py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                 <Check size={18} /> Сохранить
               </button>
             </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-2">
          <div className="bg-blue-200 text-blue-700 p-1 rounded-full mt-0.5">
            <Calendar size={12} />
          </div>
          <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
            Нажмите на ячейку, чтобы изменить часы.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimesheetView;
