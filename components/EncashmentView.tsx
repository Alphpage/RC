
import React, { useState, useMemo } from 'react';
import { RentalPoint, CashRegister, EncashmentEntry, RevenueEntry } from '../types';
import { HandCoins, History, ChevronDown, ChevronUp, Plus, Calendar, CreditCard, AlertCircle, Check } from 'lucide-react';

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
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2 mb-2 px-1">
        <HandCoins className="text-slate-400" size={18} />
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Контроль наличности</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {points.map(point => {
          const totalCash = calculateCashBalance(point.id);
          const isExpanded = expandedPointId === point.id;
          const pointRegisters = registers.filter(r => r.pointId === point.id);
          const isHighRisk = totalCash > 20000;
          const pointHistory = entries
            .filter(e => e.pointId === point.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <div key={point.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
              {/* Point Plate Header */}
              <div 
                onClick={() => setExpandedPointId(isExpanded ? null : point.id)}
                className={`p-5 cursor-pointer flex justify-between items-center transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
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
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-4">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Plus size={12} /> Новая инкассация
                      </h4>
                      
                      {/* Register Chips Selector */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Откуда забираем?</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {pointRegisters.map(r => (
                            <button
                              key={r.id}
                              onClick={() => setNewEncashment({...newEncashment, registerId: r.id})}
                              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                newEncashment.registerId === r.id 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                                : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {r.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Дата</p>
                             <input 
                              type="date"
                              value={newEncashment.date}
                              onChange={(e) => setNewEncashment({...newEncashment, date: e.target.value})}
                              className="w-full bg-white border border-blue-100 rounded-xl px-2 py-3 text-xs font-bold text-center h-[50px]"
                            />
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Сумма</p>
                            <input 
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={newEncashment.amount}
                              onChange={(e) => setNewEncashment({...newEncashment, amount: e.target.value})}
                              className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 h-[50px] placeholder-slate-200"
                            />
                        </div>
                      </div>

                      <button 
                        onClick={() => handleAddEncashment(point.id)}
                        disabled={!newEncashment.registerId || !newEncashment.amount}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={18} /> Провести инкассацию
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
