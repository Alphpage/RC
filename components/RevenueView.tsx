
import React, { useState, useMemo, useEffect } from 'react';
import { RentalPoint, CashRegister, RevenueEntry } from '../types';
import { TrendingUp, ChevronDown, ChevronUp, Save, CheckCircle2, ChevronLeft, ChevronRight, Lock, Wallet, CreditCard, RefreshCcw } from 'lucide-react';

interface RevenueViewProps {
  points: RentalPoint[];
  registers: CashRegister[];
  entries: RevenueEntry[];
  onSave: (entry: RevenueEntry) => void;
  isReadOnly?: boolean;
}

interface RegisterInputState {
  cash: string;
  card: string;
  refundCash: string;
  refundCard: string;
}

const RevenueView: React.FC<RevenueViewProps> = ({ points, registers, entries, onSave, isReadOnly = false }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, RegisterInputState>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialInputs: Record<string, RegisterInputState> = {};
    registers.forEach(reg => {
      const existing = entries.find(e => e.date === selectedDate && e.registerId === reg.id);
      if (existing) {
        initialInputs[reg.id] = {
          cash: existing.cash === 0 ? '' : existing.cash.toString(),
          card: existing.card === 0 ? '' : existing.card.toString(),
          refundCash: existing.refundCash === 0 ? '' : existing.refundCash.toString(),
          refundCard: existing.refundCard === 0 ? '' : existing.refundCard.toString()
        };
      } else {
        initialInputs[reg.id] = { cash: '', card: '', refundCash: '', refundCard: '' };
      }
    });
    setInputs(initialInputs);
  }, [selectedDate, registers, entries]);

  const handleDateChange = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleInputChange = (regId: string, field: keyof RegisterInputState, value: string) => {
    if (isReadOnly) return;
    setInputs(prev => ({
      ...prev,
      [regId]: {
        ...(prev[regId] || { cash: '', card: '', refundCash: '', refundCard: '' }),
        [field]: value
      }
    }));
    if (savedStatus[regId]) {
      setSavedStatus(prev => ({ ...prev, [regId]: false }));
    }
  };

  const handleSaveRegister = (pointId: string, regId: string) => {
    if (isReadOnly) return;
    const regInputs = inputs[regId];
    if (!regInputs) return;

    onSave({
      id: Math.random().toString(36).substr(2, 9),
      pointId,
      registerId: regId,
      date: selectedDate,
      cash: Number(regInputs.cash) || 0,
      card: Number(regInputs.card) || 0,
      refundCash: Number(regInputs.refundCash) || 0,
      refundCard: Number(regInputs.refundCard) || 0,
    });

    setSavedStatus(prev => ({ ...prev, [regId]: true }));
    setTimeout(() => setSavedStatus(prev => ({ ...prev, [regId]: false })), 2000);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.date === selectedDate);
  }, [entries, selectedDate]);

  const calculateTotal = (pointId: string, type: 'cash' | 'card') => {
    return filteredEntries
      .filter(e => e.pointId === pointId)
      .reduce((acc, curr) => {
        if (type === 'cash') return acc + curr.cash - curr.refundCash;
        return acc + curr.card - curr.refundCard;
      }, 0);
  };

  const formattedTotal = (num: number) => num.toLocaleString() + '₽';

  return (
    <div className="space-y-3 pb-20">
      {/* Date Selector - Compact */}
      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 sticky top-[130px] z-20">
        <button 
          onClick={() => handleDateChange(-1)}
          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
           <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Дата отчета</span>
           <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-black text-slate-800 bg-transparent outline-none cursor-pointer text-center"
          />
        </div>

        <button 
          onClick={() => handleDateChange(1)}
          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Points List - Compact style like SalaryView */}
      <div className="space-y-2">
        {points.map(point => {
          const cashTotal = calculateTotal(point.id, 'cash');
          const cardTotal = calculateTotal(point.id, 'card');
          const isExpanded = expandedPointId === point.id;
          const pointRegisters = registers.filter(r => r.pointId === point.id);

          return (
            <div key={point.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-1">
              <div 
                onClick={() => setExpandedPointId(isExpanded ? null : point.id)}
                className="p-3 cursor-pointer active:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{point.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Wallet size={10} className="text-green-500" />
                        <span className="text-[10px] font-black text-slate-900">{formattedTotal(cashTotal)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard size={10} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-900">{formattedTotal(cardTotal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-none">
                        {(cashTotal + cardTotal).toLocaleString()}₽
                      </p>
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Общий итог</p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-1">
                  <div className="p-2 space-y-2">
                    {pointRegisters.map(reg => {
                      const regInput = inputs[reg.id] || { cash: '', card: '', refundCash: '', refundCard: '' };
                      const isSaved = savedStatus[reg.id];

                      return (
                        <div key={reg.id} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{reg.name}</p>
                            {isSaved && <CheckCircle2 size={12} className="text-green-500" />}
                          </div>
                          
                          <div className="p-3 space-y-3">
                            {/* Income Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-green-600 uppercase tracking-widest px-1 flex items-center gap-1">
                                      <TrendingUp size={8} /> Наличные
                                    </label>
                                    <input 
                                        type="text" 
                                        inputMode="decimal"
                                        value={regInput.cash}
                                        disabled={isReadOnly}
                                        onChange={(e) => handleInputChange(reg.id, 'cash', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-blue-600 uppercase tracking-widest px-1 flex items-center gap-1">
                                      <CreditCard size={8} /> Карты
                                    </label>
                                    <input 
                                        type="text" 
                                        inputMode="decimal"
                                        value={regInput.card}
                                        disabled={isReadOnly}
                                        onChange={(e) => handleInputChange(reg.id, 'card', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Refund Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-red-500 uppercase tracking-widest px-1">Возврат Нал</label>
                                    <input 
                                        type="text" 
                                        inputMode="decimal"
                                        value={regInput.refundCash}
                                        disabled={isReadOnly}
                                        onChange={(e) => handleInputChange(reg.id, 'refundCash', e.target.value)}
                                        className="w-full bg-red-50/20 border border-red-100 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-red-500 uppercase tracking-widest px-1">Возврат Карт</label>
                                    <input 
                                        type="text" 
                                        inputMode="decimal"
                                        value={regInput.refundCard}
                                        disabled={isReadOnly}
                                        onChange={(e) => handleInputChange(reg.id, 'refundCard', e.target.value)}
                                        className="w-full bg-red-50/20 border border-red-100 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {!isReadOnly && (
                                <button 
                                onClick={() => handleSaveRegister(point.id, reg.id)}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    isSaved 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                }`}
                                >
                                {isSaved ? (
                                    <>
                                    <CheckCircle2 size={14} /> Сохранено
                                    </>
                                ) : (
                                    <>
                                    <Save size={14} /> Сохранить
                                    </>
                                )}
                                </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Summary Plate - Matches SalaryView */}
      {points.length > 0 && (
        <div className="p-4 bg-slate-900 rounded-2xl shadow-lg flex items-center justify-between text-white">
           <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Итого приход</span>
             <span className="text-[10px] text-slate-500 font-medium">За весь день по всем точкам</span>
           </div>
           <span className="text-xl font-black tabular-nums">
             {points.reduce((acc, point) => acc + calculateTotal(point.id, 'cash') + calculateTotal(point.id, 'card'), 0).toLocaleString()}₽
           </span>
        </div>
      )}
    </div>
  );
};

export default RevenueView;
