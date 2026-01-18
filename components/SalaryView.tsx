
import React, { useState } from 'react';
import { Employee, TimesheetEntry, SalaryCalculation, RentalPoint } from '../types';
import { Award, Wallet, Filter, Percent } from 'lucide-react';

interface SalaryViewProps {
  employees: Employee[];
  timesheets: TimesheetEntry[];
  points: RentalPoint[];
}

const RUSSIAN_MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

const SalaryView: React.FC<SalaryViewProps> = ({ employees, timesheets, points }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPointId, setSelectedPointId] = useState<string>('all');

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const calculateSalaries = (): SalaryCalculation[] => {
    // 1. Filter employees based on selected point
    let filteredEmployees = employees;
    if (selectedPointId !== 'all') {
      filteredEmployees = employees.filter(e => e.pointId === selectedPointId);
    }

    return filteredEmployees.map(emp => {
      // 2. Filter timesheets for this employee AND selected month/year
      const empTimesheets = timesheets.filter(t => {
        const d = new Date(t.date);
        return t.employeeId === emp.id && 
               d.getFullYear() === selectedYear && 
               d.getMonth() === selectedMonth;
      });

      const totalHours = empTimesheets.reduce((acc, curr) => acc + curr.hours, 0);
      const baseSalary = totalHours * emp.hourlyRate;
      
      // 3. Calculate Bonus based on Point's percentage
      const point = points.find(p => p.id === emp.pointId);
      const pointPercent = point?.salaryPercent || 0;
      const pointPercentBonus = baseSalary * (pointPercent / 100);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalHours,
        baseSalary,
        pointPercentBonus,
        total: baseSalary + pointPercentBonus
      };
    });
  };

  const calculations = calculateSalaries();
  const totalFund = calculations.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-4">
      
      {/* Filters Section (Copied from TimesheetView) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 flex-1">
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

            <div className="flex-1">
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
      </div>

      <div className="flex justify-between items-center px-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ведомость к выплате</h3>
        <span className="text-lg font-black text-slate-800 bg-slate-200 px-3 py-1 rounded-lg">
            Σ {totalFund.toLocaleString()}₽
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {calculations.length > 0 ? calculations.map(calc => (
          <div key={calc.employeeId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-800">{calc.employeeName}</h3>
                <p className="text-xs text-slate-500">{calc.totalHours} ч. отработано</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600 text-lg">{calc.total.toLocaleString()}₽</p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Wallet size={12} /> Оклад: {calc.baseSalary.toLocaleString()}₽
              </div>
              {calc.pointPercentBonus > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                  <Percent size={12} /> Бонус точки: {calc.pointPercentBonus.toLocaleString()}₽
                </div>
              )}
            </div>
          </div>
        )) : (
            <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">Нет данных за выбранный период</div>
        )}
      </div>
    </div>
  );
};

export default SalaryView;
