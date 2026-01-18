
import React, { useState, useMemo } from 'react';
import { RentalPoint, CashRegister, EncashmentEntry, RevenueEntry } from '../types';
import { Banknote, History, ChevronDown, ChevronUp, Plus, Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface EncashmentViewProps {
  points: RentalPoint[];
  registers: CashRegister[];
  entries: EncashmentEntry[];
  revenueEntries: RevenueEntry[]; // Added to calculate current balance
  onAdd: (entry: EncashmentEntry) => void;
  isReadOnly?: boolean;
}

const EncashmentView: React.FC<EncashmentViewProps> = ({ points, registers, entries, revenueEntries, onAdd, isReadOnly = false }) => {
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [newEncashment, setNewEncashment] = useState({
    registerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate current cash balance for a specific point or register
  const calculateCashBalance = (pointId: string, registerId?: string) => {
    const totalRevenueCash = revenueEntries
      .filter(e => e.pointId === pointId && (!registerId || e.registerId === registerId))
      .reduce((acc, curr) => acc + (curr.cash - curr.refundCash), 0);
    
    const totalEncashment = entries
      .filter(e => e.pointId === pointId && (!registerId || e.registerId === registerId))
      .reduce((acc, curr) => acc + curr.amount, 0);

    return totalRevenueCash - totalEncashment;
  };

  const handleAddEncashment = (pointId: string) => {
    if (!newEncashment.registerId || !newEncashment.amount) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      pointId,
      registerId: newEncashment.registerId,
      date: newEncashment.date,
      amount: Number(newEncashment.amount),
    });

    setNewEncashment({
      registerId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Banknote className="text-slate-400" size={18} />
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Контроль наличности</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {points.map(point => {
          const totalCash = calculateCashBalance(point.id);
          const isExpanded = expandedPointId === point.id;
          const pointRegisters = registers.filter(r => r.pointId === point.id);
          const isHighRisk = totalCash > 20000;
          const pointHistory = entries
            .filter(e => e.pointId === point.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <div key={point.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 h-fit ${isExpanded ? 'row-span-2' : ''}`}>
              {/* Point Plate Header */}
              <div 
                onClick={() => setExpandedPointId(isExpanded ? null : point.id)}
                className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{point.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Наличные на точке</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-black tabular-nums transition-colors ${isHighRisk ? 'text-red-600' : 'text-slate-900'}`}>
                      {totalCash.toLocaleString()}₽
                    </p>
                    {isHighRisk && (
                      <div className="flex items-center gap-1 text-[8px] text-red-500 font-bold uppercase justify-end animate-pulse">
                        <AlertCircle size={8} /> Превышен лимит
                      </div>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-50 space-y-6 bg-white">
                  
                  {/* Register Balances */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CreditCard size={12} /> Остатки по кассам
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {pointRegisters.map(reg => {
                        const regCash = calculateCashBalance(point.id, reg.id);
                        return (
                          <div key={reg.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-xs font-semibold text-slate-600">{reg.name}</span>
                            <span className="text-sm font-bold text-slate-800">{regCash.toLocaleString()}₽</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Encashment Form */}
                  {!isReadOnly && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-3">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Plus size={12} /> Новая инкассация
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <select 
                            value={newEncashment.registerId}
                            onChange={(e) => setNewEncashment({...newEncashment, registerId: e.target.value})}
                            className="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-xs font-bold"
                          >
                            <option value="">Выберите кассу</option>
                            {pointRegisters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <input 
                          type="date"
                          value={newEncashment.date}
                          onChange={(e) => setNewEncashment({...newEncashment, date: e.target.value})}
                          className="bg-white border border-blue-100 rounded-lg px-3 py-2 text-xs font-bold"
                        />
                        <input 
                          type="number"
                          placeholder="Сумма"
                          value={newEncashment.amount}
                          onChange={(e) => setNewEncashment({...newEncashment, amount: e.target.value})}
                          className="bg-white border border-blue-100 rounded-lg px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <button 
                        onClick={() => handleAddEncashment(point.id)}
                        disabled={!newEncashment.registerId || !newEncashment.amount}
                        className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-100 active:scale-95 disabled:opacity-30 disabled:shadow-none transition-all"
                      >
                        Инкассировать
                      </button>
                    </div>
                  )}

                  {/* History List */}
                  {pointHistory.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <History size={12} /> История (последние 5)
                      </h4>
                      <div className="space-y-1">
                        {pointHistory.slice(0, 5).map(h => (
                          <div key={h.id} className="flex justify-between items-center py-2 px-1 border-b border-slate-50 last:border-0">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700">
                                {registers.find(r => r.id === h.registerId)?.name || 'Неизв. касса'}
                              </span>
                              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                <Calendar size={10} /> {h.date}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-800">-{h.amount.toLocaleString()}₽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-100 rounded-2xl flex items-start gap-3 border border-slate-200 mt-4">
        <AlertCircle size={16} className="text-slate-400 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-tight">
          Баланс наличности рассчитывается как: <br/>
          <b>(Приход Нал - Возврат Нал) - Все инкассации</b>. <br/>
          Следите за остатком, чтобы не превышать лимит хранения.
        </p>
      </div>
    </div>
  );
};

export default EncashmentView;
