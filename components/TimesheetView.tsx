
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RentalPoint, Employee, TimesheetEntry } from '../types';
import { Calendar, Filter, Lock, Clock, X, Check } from 'lucide-react';

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
  
  // Quick Input State
  const [activeCell, setActiveCell] = useState<{ empId: string, day: number, hours: string, start?: string, end?: string } | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(selectedYear, selectedMonth, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 is Sunday, 6 is Saturday
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

  const updateHours = (empId: string, day: number, hoursVal: string, start?: string, end?: string) => {
    const employee = employees.find(e => e.id === empId);
    if (!employee) return;

    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const hours = parseFloat(hoursVal) || 0;

    const existingIndex = entries.findIndex(e => e.employeeId === employee.id && e.date === dateStr);
    
    let newEntries = [...entries];
    if (existingIndex > -1) {
      if (hours === 0) {
        newEntries.splice(existingIndex, 1);
      } else {
        newEntries[existingIndex] = { 
            ...newEntries[existingIndex], 
            hours,
            startTime: start,
            endTime: end
        };
      }
    } else if (hours > 0) {
      newEntries.push({
        id: Math.random().toString(36).substr(2, 9),
        pointId: employee.pointId,
        employeeId: employee.id,
        date: dateStr,
        hours,
        startTime: start,
        endTime: end
      });
    }
    onUpdate(newEntries);
  };

  const getEntry = (employeeId: string, day: number) => {
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return entries.find(e => e.employeeId === employeeId && e.date === dateStr);
  };

  const handleCellClick = (empId: string, day: number) => {
    if (isReadOnly) return;
    const entry = getEntry(empId, day);
    setActiveCell({ 
        empId, 
        day, 
        hours: entry ? entry.hours.toString() : '',
        start: entry?.startTime || '10:00',
        end: entry?.endTime || '22:00'
    });
  };

  const QuickInputModal = () => {
    if (!activeCell) return null;
    const [start, setStart] = useState(activeCell.start || '10:00');
    const [end, setEnd] = useState(activeCell.end || '22:00');
    const [calcHours, setCalcHours] = useState(activeCell.hours);

    useEffect(() => {
        if (start && end) {
            const d1 = new Date(`2000-01-01T${start}`);
            const d2 = new Date(`2000-01-01T${end}`);
            let diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);
            if (diff < 0) diff += 24;
            setCalcHours(diff.toFixed(1));
        }
    }, [start, end]);

    const handleSave = () => {
        updateHours(activeCell.empId, activeCell.day, calcHours, start, end);
        setActiveCell(null);
    };

    const handleClear = () => {
        updateHours(activeCell.empId, activeCell.day, '0');
        setActiveCell(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setActiveCell(null)}>
            <div 
                className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-600" size={18} />
                        <h3 className="font-bold text-slate-800">Часы работы</h3>
                    </div>
                    <button onClick={() => setActiveCell(null)} className="p-1 bg-slate-100 rounded-full text-slate-500">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Начало</label>
                        <input 
                            type="time" 
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Конец</label>
                         <input 
                            type="time" 
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold outline-none"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                    <span className="text-xs font-bold text-blue-800 uppercase">Итого часов:</span>
                    <input 
                        type="number"
                        value={calcHours}
                        onChange={(e) => setCalcHours(e.target.value)}
                        className="w-20 text-right bg-transparent text-xl font-black text-blue-700 outline-none border-b border-blue-300 pb-1"
                    />
                </div>

                <div className="flex gap-3">
                     <button 
                        onClick={handleClear}
                        className="flex-1 py-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors uppercase tracking-wider"
                    >
                        Очистить
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] bg-slate-900 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                        <Check size={18} /> Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <QuickInputModal />

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
          <div className="absolute top-2 right-2 z-50 bg-slate-100 px-2 py-1 rounded text-[9px] font-bold text-slate-500 flex items-center gap-1 opacity-80">
            <Lock size={10} /> Только чтение
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-40 bg-slate-50 border-r border-b border-slate-100 p-3 text-left min-w-[140px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
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
                    {/* Point Header Row */}
                    {selectedPointId === 'all' && (
                      <tr>
                        <td 
                          className="bg-blue-50/90 border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.02)]"
                        >
                          {point?.name}
                        </td>
                        <td 
                          colSpan={daysInMonth} 
                          className="bg-blue-50/90 border-b border-slate-100 px-3 py-1.5"
                        >
                          {/* Empty spacer for the rest of the row */}
                        </td>
                      </tr>
                    )}
                    {/* Employee Rows */}
                    {emps.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="sticky left-0 z-20 bg-white border-r border-b border-slate-50 p-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{emp.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{emp.position}</p>
                        </td>
                        {daysArray.map(({ day, isWeekend }) => {
                          const entry = getEntry(emp.id, day);
                          return (
                            <td 
                              key={day} 
                              onClick={() => handleCellClick(emp.id, day)}
                              className={`border-b border-slate-50 p-1 cursor-pointer ${isWeekend ? 'bg-red-50/20' : ''}`}
                            >
                              <div className={`w-full text-center p-1 rounded transition-colors flex flex-col items-center justify-center min-h-[32px] ${entry ? (isWeekend ? 'text-red-600' : 'text-blue-600') : 'text-slate-200'}`}>
                                  <span className="text-xs font-bold">{entry?.hours || '-'}</span>
                                  {entry?.startTime && entry?.endTime && (
                                    <span className="text-[8px] leading-none opacity-80 mt-0.5">
                                      {entry.startTime}-{entry.endTime}
                                    </span>
                                  )}
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
    </div>
  );
};

export default TimesheetView;
