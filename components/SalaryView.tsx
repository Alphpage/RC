
import React, { useState, useMemo } from 'react';
import { RentalPoint, Employee, TimesheetEntry, SalaryCalculation, SalaryAdjustment } from '../types';
import { Award, Wallet, Filter, Calendar, AlertTriangle, Minus, Plus, Settings2, ChevronDown, ChevronUp } from 'lucide-react';

interface SalaryViewProps {
  points: RentalPoint[];
  employees: Employee[];
  timesheets: TimesheetEntry[];
  adjustments: SalaryAdjustment[];
  onUpdateAdjustment: (adj: SalaryAdjustment) => void;
  isReadOnly?: boolean;
}

const RUSSIAN_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const SalaryView: React.FC<SalaryViewProps> = ({ points, employees, timesheets, adjustments, onUpdateAdjustment, isReadOnly = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPointId, setSelectedPointId] = useState<string>('all');
  const [expandedAdjId, setExpandedAdjId] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const calculations = useMemo(() => {
    const filteredEmployees = selectedPointId === 'all' 
      ? employees 
      : employees.filter(e => e.pointId === selectedPointId);

    const yearMonthPrefix = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    
    return filteredEmployees.map(emp => {
      const empTimesheets = timesheets.filter(t => 
        t.employeeId === emp.id && 
        t.date.startsWith(yearMonthPrefix)
      );
      
      const totalHours = empTimesheets.reduce((acc, curr) => acc + curr.hours, 0);
      const baseSalary = totalHours * emp.hourlyRate;
      
      const adj = adjustments.find(a => 
        a.employeeId === emp.id && a.year === selectedYear && a.month === selectedMonth
      );
      
      const bonus = adj?.bonus || 0;
      const fine = adj?.fine || 0;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalHours,
        baseSalary,
        bonus,
        fine,
        total: baseSalary + bonus - fine
      };
    }).filter(calc => calc.totalHours > 0 || selectedPointId !== 'all');
  }, [employees, timesheets, selectedYear, selectedMonth, selectedPointId, adjustments]);

  const handleAdjustChange = (empId: string, field: 'bonus' | 'fine', value: string) => {
    if (isReadOnly) return;
    const numValue = parseFloat(value) || 0;
    const existing = adjustments.find(a => 
      a.employeeId === empId && a.year === selectedYear && a.month === selectedMonth
    );
    
    onUpdateAdjustment({
      employeeId: empId,
      year: selectedYear,
      month: selectedMonth,
      bonus: field === 'bonus' ? numValue : (existing?.bonus || 0),
      fine: field === 'fine' ? numValue : (existing?.fine || 0)
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Год</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Месяц</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
            >
              {RUSSIAN_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Точка проката</label>
          <div className="relative">
            <select 
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold pl-8 outline-none"
            >
              <option value="all">Все точки</option>
              {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Salary List */}
      <div className="space-y-2">
        {calculations.length > 0 ? calculations.map(calc => (
          <div key={calc.employeeId} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-1">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-slate-800 text-sm truncate">{calc.employeeName}</h3>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {calc.totalHours} ч • {calc.baseSalary.toLocaleString()}₽
                  </span>
                  {calc.bonus > 0 && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                      +{calc.bonus.toLocaleString()}
                    </span>
                  )}
                  {calc.fine > 0 && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                      -{calc.fine.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {!isReadOnly && (
                    <button 
                      onClick={() => setExpandedAdjId(expandedAdjId === calc.employeeId ? null : calc.employeeId)}
                      className={`p-1.5 rounded-lg transition-colors ${expandedAdjId === calc.employeeId ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 hover:text-blue-500'}`}
                    >
                      <Settings2 size={14} />
                    </button>
                  )}
                  <p className="text-base font-black text-slate-900 leading-none">
                    {calc.total.toLocaleString()}₽
                  </p>
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">К выплате</p>
              </div>
            </div>
            
            {/* Adjustment Form (Hidden behind button) */}
            {expandedAdjId === calc.employeeId && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 animate-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-green-600 uppercase tracking-widest px-1">Премия (+)</label>
                  <input 
                    type="number"
                    inputMode="decimal"
                    value={calc.bonus === 0 ? '' : calc.bonus}
                    onChange={(e) => handleAdjustChange(calc.employeeId, 'bonus', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-red-600 uppercase tracking-widest px-1">Штраф (-)</label>
                  <input 
                    type="number"
                    inputMode="decimal"
                    value={calc.fine === 0 ? '' : calc.fine}
                    onChange={(e) => handleAdjustChange(calc.employeeId, 'fine', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-xs font-medium">Нет данных за этот период</p>
          </div>
        )}
      </div>

      {calculations.length > 0 && (
        <div className="p-4 bg-slate-900 rounded-2xl shadow-lg flex items-center justify-between text-white">
           <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Итого фонд</span>
             <span className="text-[10px] text-slate-500 font-medium">{RUSSIAN_MONTHS[selectedMonth]} {selectedYear}</span>
           </div>
           <span className="text-xl font-black tabular-nums">
             {calculations.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}₽
           </span>
        </div>
      )}
    </div>
  );
};

export default SalaryView;
