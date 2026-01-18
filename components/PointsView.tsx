
import React, { useState, useMemo } from 'react';
import { RentalPoint, CashRegister, RevenueEntry, Employee, MorningReport, EveningReport, PointSchedule, EmployeeSchedule, AuditQuestion, AuditReport, AuditAnswer, AuditType } from '../types';
import { Camera, Clock, Users, CheckCircle2, ChevronRight, Upload, AlertCircle, Save, CheckSquare, Sun, Moon, Store, ChevronLeft, X, Plus, ClipboardCheck, MessageSquare, AlertTriangle } from 'lucide-react';

interface PointsViewProps {
  points: RentalPoint[];
  registers: CashRegister[];
  employees: Employee[];
  revenueEntries: RevenueEntry[];
  morningReports: MorningReport[];
  eveningReports: EveningReport[];
  auditReports: AuditReport[];
  pointSchedules: PointSchedule[];
  employeeSchedules: EmployeeSchedule[];
  encashmentEntries: any[]; // Для расчета кассы
  morningAuditQuestions: AuditQuestion[];
  eveningAuditQuestions: AuditQuestion[];
  onSaveMorning: (report: MorningReport) => void;
  onSaveEvening: (
      pointId: string, 
      date: string, 
      revenues: { regId: string, cash: number, card: number, refundCash: number, refundCard: number }[],
      empHours: { empId: string, start: string, end: string }[],
      closeTime: string
  ) => void;
  onSaveAudit: (report: AuditReport) => void;
  isReadOnly?: boolean;
}

const PointsView: React.FC<PointsViewProps> = ({ 
    points, registers, employees, revenueEntries, morningReports, eveningReports, auditReports, encashmentEntries, 
    pointSchedules, employeeSchedules, morningAuditQuestions, eveningAuditQuestions,
    onSaveMorning, onSaveEvening, onSaveAudit, isReadOnly 
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'morning' | 'evening' | 'morning_audit' | 'evening_audit' | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Form States - Common
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Morning/Evening States
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [revenueInputs, setRevenueInputs] = useState<Record<string, { cash: string, card: string, refundCash: string, refundCard: string }>>({});
  const [empTimes, setEmpTimes] = useState<Record<string, { start: string, end: string }>>({});

  // Audit State
  const [auditAnswers, setAuditAnswers] = useState<Record<string, AuditAnswer>>({});

  // Helpers
  const handleDateChange = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const calculateCashBalance = (pointId: string, registerId: string) => {
     // Простая логика: (Приход - Возврат) за все время - Инкассация
     const totalRevenue = revenueEntries
       .filter(e => e.registerId === registerId && e.date < selectedDate) // Только прошлые даты для входящего остатка
       .reduce((acc, curr) => acc + (curr.cash - curr.refundCash), 0);
     
     const totalEncashment = encashmentEntries
       .filter(e => e.registerId === registerId && e.date < selectedDate)
       .reduce((acc, curr) => acc + curr.amount, 0);

     return totalRevenue - totalEncashment;
  };

  const getTotalDailyRevenue = () => {
    let total = 0;
    Object.values(revenueInputs).forEach((val: { cash: string, card: string, refundCash: string, refundCard: string }) => {
        const cash = Number(val.cash) || 0;
        const card = Number(val.card) || 0;
        const refundCash = Number(val.refundCash) || 0;
        const refundCard = Number(val.refundCard) || 0;
        total += (cash + card) - (refundCash + refundCard);
    });
    return total;
  };

  const openReport = (pointId: string, type: 'morning' | 'evening' | 'morning_audit' | 'evening_audit') => {
    setActivePointId(pointId);
    setReportType(type);
    setCashConfirmed(false);
    setPhotos([]);
    setActiveField(null);
    setAuditAnswers({});
    
    const point = points.find(p => p.id === pointId);
    const pointEmps = employees.filter(e => e.pointId === pointId);
    
    // Find daily schedule
    const dailySchedule = pointSchedules.find(s => s.pointId === pointId && s.date === selectedDate);
    const scheduledOpen = dailySchedule?.openTime || '10:00';
    const scheduledClose = dailySchedule?.closeTime || '22:00';

    if (type === 'morning') {
        const existing = morningReports.find(r => r.pointId === pointId && r.date === selectedDate);
        if (existing) {
            setOpenTime(existing.openTime);
            setSelectedEmps(existing.employeeIds);
            setPhotos(existing.media);
            setCashConfirmed(existing.cashVerified);
        } else {
            setOpenTime(scheduledOpen);
            const scheduledEmpIds = employeeSchedules
                .filter(s => s.pointId === pointId && s.date === selectedDate && s.startTime)
                .map(s => s.employeeId);
            setSelectedEmps(scheduledEmpIds); 
        }
    } else if (type === 'evening') {
        const existing = eveningReports.find(r => r.pointId === pointId && r.date === selectedDate);
        if (existing) {
            setCloseTime(existing.closeTime);
            setCashConfirmed(existing.cashVerified);
        } else {
            setCloseTime(scheduledClose);
        }

        const pointRegs = registers.filter(r => r.pointId === pointId);
        const initialRev: any = {};
        pointRegs.forEach(r => {
            const entry = revenueEntries.find(e => e.registerId === r.id && e.date === selectedDate);
            initialRev[r.id] = {
                cash: entry?.cash.toString() || '',
                card: entry?.card.toString() || '',
                refundCash: entry?.refundCash.toString() || '',
                refundCard: entry?.refundCard.toString() || ''
            };
        });
        setRevenueInputs(initialRev);

        const initialTimes: any = {};
        pointEmps.forEach(e => {
            const empSchedule = employeeSchedules.find(s => s.employeeId === e.id && s.date === selectedDate);
            initialTimes[e.id] = { 
                start: empSchedule?.startTime || scheduledOpen, 
                end: empSchedule?.endTime || scheduledClose
            };
        });
        setEmpTimes(initialTimes);
    } else {
        // Audit
        const auditType = type === 'morning_audit' ? 'morning' : 'evening';
        const existing = auditReports.find(r => r.pointId === pointId && r.date === selectedDate && r.type === auditType);
        if (existing) {
            const answersMap: any = {};
            existing.answers.forEach(a => answersMap[a.questionId] = a);
            setAuditAnswers(answersMap);
        }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
          Array.from(files).forEach((file: File) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setPhotos(prev => [...prev, reader.result as string]);
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const handleAuditPhotoUpload = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAuditAnswers(prev => ({
                  ...prev,
                  [questionId]: { ...prev[questionId], photo: reader.result as string }
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const submitMorning = () => {
      if (!activePointId) return;
      onSaveMorning({
          id: Date.now().toString(),
          pointId: activePointId,
          date: selectedDate,
          openTime,
          employeeIds: selectedEmps,
          media: photos,
          cashVerified: cashConfirmed
      });
      setActivePointId(null);
  };

  const submitEvening = () => {
      if (!activePointId) return;
      
      const revenues = Object.entries(revenueInputs).map(([regId, val]) => {
          const v = val as { cash: string, card: string, refundCash: string, refundCard: string };
          return {
            regId,
            cash: Number(v.cash) || 0,
            card: Number(v.card) || 0,
            refundCash: Number(v.refundCash) || 0,
            refundCard: Number(v.refundCard) || 0
          };
      });

      const hours = Object.entries(empTimes).map(([empId, val]) => {
          const v = val as { start: string, end: string };
          return {
            empId,
            start: v.start,
            end: v.end
          };
      });

      onSaveEvening(activePointId, selectedDate, revenues, hours, closeTime);
      setActivePointId(null);
  };

  const submitAudit = () => {
      if (!activePointId || !reportType) return;
      const type = reportType === 'morning_audit' ? 'morning' : 'evening';
      
      onSaveAudit({
          id: Date.now().toString(),
          pointId: activePointId,
          date: selectedDate,
          type: type as AuditType,
          answers: Object.values(auditAnswers)
      });
      setActivePointId(null);
  };

  const TimeQuickPicks = ({ values, onSelect }: { values: string[], onSelect: (val: string) => void }) => (
    <div className="flex gap-2 mt-2 flex-wrap animate-in fade-in slide-in-from-top-1">
      {values.map(val => (
        <button
          key={val}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus loss
            onSelect(val);
          }}
          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors border border-blue-100"
        >
          {val}
        </button>
      ))}
    </div>
  );

  const ShiftQuickPicks = ({ onSelect }: { onSelect: (start: string, end: string) => void }) => (
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          <button 
            onClick={() => onSelect('10:00', '22:00')}
            className="flex-shrink-0 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
          >
              Полная (10-22)
          </button>
          <button 
            onClick={() => onSelect('10:00', '16:00')}
            className="flex-shrink-0 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
          >
              Утро (10-16)
          </button>
           <button 
            onClick={() => onSelect('16:00', '22:00')}
            className="flex-shrink-0 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
          >
              Вечер (16-22)
          </button>
      </div>
  );

  if (activePointId) {
      const point = points.find(p => p.id === activePointId);
      const pointEmps = employees.filter(e => e.pointId === activePointId);
      const pointRegs = registers.filter(r => r.pointId === activePointId);
      
      const isAudit = reportType === 'morning_audit' || reportType === 'evening_audit';
      const auditQuestions = reportType === 'morning_audit' ? morningAuditQuestions : eveningAuditQuestions;
      
      const getAuditTitle = () => {
          if (reportType === 'morning') return 'Открытие';
          if (reportType === 'morning_audit') return 'Утренний аудит';
          if (reportType === 'evening_audit') return 'Вечерний аудит';
          return 'Закрытие';
      };

      return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                  <button onClick={() => setActivePointId(null)} className="text-slate-500 font-bold text-sm hover:text-blue-600 flex items-center gap-1">
                      <ChevronRight size={16} className="rotate-180" /> Назад
                  </button>
                  <h2 className="font-bold text-slate-800">{getAuditTitle()}</h2>
                  <div className="w-10" />
              </div>

              <div className="p-4 space-y-6">
                  {/* Common: Date & Info */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Clock size={14} /> {selectedDate}
                      <span className="mx-2">•</span>
                      <Store size={14} /> {point?.name}
                  </div>

                  {isAudit && (
                      <div className="space-y-4">
                          {auditQuestions.map((q, idx) => {
                              const answer = auditAnswers[q.id];
                              const isRequiredTriggered = q.requireOnAnswer && 
                                  ((q.requireOnAnswer === 'always') ||
                                   (q.requireOnAnswer === 'yes' && answer?.value === true) || 
                                   (q.requireOnAnswer === 'no' && answer?.value === false));

                              return (
                                  <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                      <div className="flex justify-between items-start mb-3">
                                          <span className="text-sm font-bold text-slate-800">{idx + 1}. {q.text}</span>
                                      </div>
                                      
                                      <div className="flex gap-2 mb-3">
                                          <button 
                                            onClick={() => setAuditAnswers({...auditAnswers, [q.id]: { ...answer, questionId: q.id, value: true }})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${answer?.value === true ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                          >
                                              ДА
                                          </button>
                                          <button 
                                            onClick={() => setAuditAnswers({...auditAnswers, [q.id]: { ...answer, questionId: q.id, value: false }})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${answer?.value === false ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                          >
                                              НЕТ
                                          </button>
                                      </div>

                                      {isRequiredTriggered && (
                                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 animate-in fade-in space-y-2">
                                              <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 uppercase">
                                                  <AlertTriangle size={12} />
                                                  Требуется: {q.requirementType.map(t => t === 'photo' ? 'Фото' : 'Комментарий').join(' + ')}
                                              </div>
                                              
                                              {q.requirementType.includes('comment') && (
                                                  <textarea 
                                                      value={answer?.comment || ''}
                                                      onChange={(e) => setAuditAnswers({...auditAnswers, [q.id]: { ...answer, comment: e.target.value }})}
                                                      className="w-full bg-white border border-orange-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                                                      placeholder="Опишите ситуацию..."
                                                      rows={2}
                                                  />
                                              )}

                                              {q.requirementType.includes('photo') && (
                                                  <div className="flex items-center gap-3">
                                                      <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors">
                                                          <Camera size={16} className="text-orange-500" />
                                                          <span className="text-xs font-bold text-orange-700">Загрузить</span>
                                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAuditPhotoUpload(q.id, e)} />
                                                      </label>
                                                      {answer?.photo && (
                                                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-orange-200">
                                                              <img src={answer.photo} className="w-full h-full object-cover" alt="Audit" />
                                                          </div>
                                                      )}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                          
                          {auditQuestions.length === 0 && (
                              <p className="text-center text-slate-400 italic">Вопросы для аудита не настроены.</p>
                          )}

                          <button 
                              onClick={submitAudit}
                              disabled={auditQuestions.some(q => {
                                  const ans = auditAnswers[q.id];
                                  if (ans === undefined) return true; // Not answered
                                  const isTriggered = q.requireOnAnswer && 
                                    ((q.requireOnAnswer === 'always') ||
                                     (q.requireOnAnswer === 'yes' && ans.value === true) || 
                                     (q.requireOnAnswer === 'no' && ans.value === false));
                                  
                                  if (isTriggered) {
                                      if (q.requirementType.includes('comment') && !ans.comment) return true;
                                      if (q.requirementType.includes('photo') && !ans.photo) return true;
                                  }
                                  return false;
                              })}
                              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                              <Save size={18} /> Сохранить аудит
                          </button>
                      </div>
                  )}

                  {reportType === 'morning' && (
                      <>
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">1. Фото/Видео открытия</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <label className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400">
                                    <Camera size={20} />
                                    <span className="text-[9px] font-bold mt-1">Добавить</span>
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                                {photos.map((src, i) => (
                                    <div key={i} className="flex-shrink-0 w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                        <img src={src} className="w-full h-full object-cover" alt="report" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">2. Время открытия</label>
                            <div>
                                <input 
                                    type="time" 
                                    value={openTime} 
                                    onFocus={() => setActiveField('openTime')}
                                    onChange={(e) => setOpenTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {activeField === 'openTime' && (
                                    <TimeQuickPicks values={['10:00', '11:00', '12:00', '14:00', '16:00']} onSelect={setOpenTime} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">3. Сотрудники на смене</label>
                            
                            {/* Employee List */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedEmps.map(empId => {
                                    const emp = employees.find(e => e.id === empId);
                                    if (!emp) return null;
                                    return (
                                        <div key={empId} className="bg-blue-50 border border-blue-100 text-blue-800 pl-3 pr-2 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold animate-in zoom-in-50">
                                            {emp.name}
                                            <button 
                                                onClick={() => setSelectedEmps(selectedEmps.filter(id => id !== empId))}
                                                className="bg-blue-100 hover:bg-blue-200 rounded p-0.5 text-blue-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Dropdown Selector */}
                            <div className="relative">
                                <select 
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            if (!selectedEmps.includes(e.target.value)) {
                                                setSelectedEmps([...selectedEmps, e.target.value]);
                                            }
                                            e.target.value = ''; // Reset select
                                        }
                                    }}
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">+ Добавить сотрудника</option>
                                    {pointEmps.filter(e => !selectedEmps.includes(e.id)).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Plus size={20} />
                                </div>
                            </div>
                        </div>

                         <button 
                            onClick={submitMorning}
                            disabled={!cashConfirmed && photos.length === 0}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Сохранить отчет
                        </button>
                      </>
                  )}

                  {reportType === 'evening' && (
                      <>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="block text-xs font-bold text-slate-400 uppercase">1. Выручка за день</label>
                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    Итого: {getTotalDailyRevenue().toLocaleString()}₽
                                </span>
                            </div>
                            <div className="space-y-3">
                                {pointRegs.map(reg => (
                                    <div key={reg.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                        <p className="text-xs font-bold text-slate-700 mb-1">{reg.name}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="number" placeholder="Нал"
                                                value={revenueInputs[reg.id]?.cash}
                                                onFocus={() => setActiveField(null)}
                                                onChange={(e) => setRevenueInputs({...revenueInputs, [reg.id]: {...revenueInputs[reg.id], cash: e.target.value}})}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                                            />
                                            <input 
                                                type="number" placeholder="Безнал"
                                                value={revenueInputs[reg.id]?.card}
                                                onFocus={() => setActiveField(null)}
                                                onChange={(e) => setRevenueInputs({...revenueInputs, [reg.id]: {...revenueInputs[reg.id], card: e.target.value}})}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                                            />
                                            <input 
                                                type="number" placeholder="Возврат Нал"
                                                value={revenueInputs[reg.id]?.refundCash}
                                                onFocus={() => setActiveField(null)}
                                                onChange={(e) => setRevenueInputs({...revenueInputs, [reg.id]: {...revenueInputs[reg.id], refundCash: e.target.value}})}
                                                className="bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 placeholder:text-red-300"
                                            />
                                            <input 
                                                type="number" placeholder="Возврат Карта"
                                                value={revenueInputs[reg.id]?.refundCard}
                                                onFocus={() => setActiveField(null)}
                                                onChange={(e) => setRevenueInputs({...revenueInputs, [reg.id]: {...revenueInputs[reg.id], refundCard: e.target.value}})}
                                                className="bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 placeholder:text-red-300"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">2. Время закрытия</label>
                            <div>
                                <input 
                                    type="time" 
                                    value={closeTime} 
                                    onFocus={() => setActiveField('closeTime')}
                                    onChange={(e) => setCloseTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {activeField === 'closeTime' && (
                                    <TimeQuickPicks values={['18:00', '19:00', '20:00', '21:00', '22:00']} onSelect={setCloseTime} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">3. Отработанное время</label>
                            <div className="space-y-2">
                                {pointEmps.map(emp => (
                                    <div key={emp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-700">{emp.name}</span>
                                        </div>
                                        
                                        <ShiftQuickPicks onSelect={(s, e) => setEmpTimes({...empTimes, [emp.id]: { start: s, end: e }})} />

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <input 
                                                    type="time" 
                                                    value={empTimes[emp.id]?.start}
                                                    onChange={(e) => setEmpTimes({...empTimes, [emp.id]: {...empTimes[emp.id], start: e.target.value}})}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold"
                                                />
                                            </div>
                                            <span className="text-slate-400">-</span>
                                            <div className="flex-1">
                                                <input 
                                                    type="time" 
                                                    value={empTimes[emp.id]?.end}
                                                    onChange={(e) => setEmpTimes({...empTimes, [emp.id]: {...empTimes[emp.id], end: e.target.value}})}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                                <CheckSquare size={14} /> Подтверждение наличия
                            </h4>
                            <div className="space-y-2 mb-4">
                                {pointRegs.map(reg => (
                                    <div key={reg.id} className="flex justify-between text-xs">
                                        <span className="text-slate-600">{reg.name}</span>
                                        <span className="font-bold text-slate-800">
                                            {/* Mock calculated balance + current input cash if evening */}
                                            {(calculateCashBalance(activePointId, reg.id) + (reportType === 'evening' ? (Number(revenueInputs[reg.id]?.cash) || 0) : 0)).toLocaleString()}₽
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={cashConfirmed} 
                                    onChange={(e) => setCashConfirmed(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                                />
                                <span className="text-xs font-bold text-slate-700">Я подтверждаю наличие указанных сумм в кассах</span>
                            </label>
                        </div>

                         <button 
                            onClick={submitEvening}
                            disabled={!cashConfirmed}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Сохранить отчет
                        </button>
                      </>
                  )}
              </div>
          </div>
      );
  }

  // Dashboard List View
  return (
    <div className="space-y-4">
        {/* Date Picker with Navigation */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-6 max-w-sm mx-auto">
            <button 
                onClick={() => handleDateChange(-1)} 
                className="p-3 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors"
            >
                <ChevronLeft size={20} />
            </button>
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-bold text-lg text-slate-700 bg-transparent outline-none text-center w-full"
            />
             <button 
                onClick={() => handleDateChange(1)} 
                className="p-3 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors"
            >
                <ChevronRight size={20} />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {points.map(point => {
                const hasMorning = morningReports.some(r => r.pointId === point.id && r.date === selectedDate);
                const hasEvening = eveningReports.some(r => r.pointId === point.id && r.date === selectedDate);
                const hasMorningAudit = auditReports.some(r => r.pointId === point.id && r.date === selectedDate && r.type === 'morning');
                const hasEveningAudit = auditReports.some(r => r.pointId === point.id && r.date === selectedDate && r.type === 'evening');
                
                // Get display times for this specific date
                const dailySchedule = pointSchedules.find(s => s.pointId === point.id && s.date === selectedDate);
                const displayOpen = dailySchedule?.openTime || '10:00';
                const displayClose = dailySchedule?.closeTime || '22:00';

                const allDone = hasMorning && hasEvening && hasMorningAudit && hasEveningAudit;

                return (
                    <div key={point.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{point.name}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
                                        <Clock size={12} /> {displayOpen} - {displayClose}
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${allDone ? 'bg-green-500' : 'bg-orange-400'}`} />
                            </div>
                        </div>

                        <div className="p-4 flex-1 space-y-3">
                            {/* 1. Открытие */}
                            <button 
                                onClick={() => openReport(point.id, 'morning')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    hasMorning 
                                    ? 'bg-green-50 border-green-100 text-green-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${hasMorning ? 'bg-green-100' : 'bg-slate-100'}`}>
                                        <Sun size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase tracking-wider">Открытие</p>
                                        <p className="text-[10px] opacity-80">{hasMorning ? 'Отчет отправлен' : 'Ожидает заполнения'}</p>
                                    </div>
                                </div>
                                {hasMorning ? <CheckCircle2 size={18} /> : <ChevronRight size={18} className="text-slate-300" />}
                            </button>

                            {/* 2. Аудит Утро */}
                             <button 
                                onClick={() => openReport(point.id, 'morning_audit')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    hasMorningAudit
                                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${hasMorningAudit ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <ClipboardCheck size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase tracking-wider">Аудит Утро</p>
                                        <p className="text-[10px] opacity-80">{hasMorningAudit ? 'Пройден' : 'Не пройден'}</p>
                                    </div>
                                </div>
                                {hasMorningAudit ? <CheckCircle2 size={18} /> : <ChevronRight size={18} className="text-slate-300" />}
                            </button>

                            {/* 3. Аудит Вечер */}
                            <button 
                                onClick={() => openReport(point.id, 'evening_audit')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    hasEveningAudit
                                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${hasEveningAudit ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <ClipboardCheck size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase tracking-wider">Аудит Вечер</p>
                                        <p className="text-[10px] opacity-80">{hasEveningAudit ? 'Пройден' : 'Не пройден'}</p>
                                    </div>
                                </div>
                                {hasEveningAudit ? <CheckCircle2 size={18} /> : <ChevronRight size={18} className="text-slate-300" />}
                            </button>

                            {/* 4. Закрытие */}
                            <button 
                                onClick={() => openReport(point.id, 'evening')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    hasEvening 
                                    ? 'bg-green-50 border-green-100 text-green-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${hasEvening ? 'bg-green-100' : 'bg-slate-100'}`}>
                                        <Moon size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase tracking-wider">Закрытие</p>
                                        <p className="text-[10px] opacity-80">{hasEvening ? 'Отчет отправлен' : 'Ожидает заполнения'}</p>
                                    </div>
                                </div>
                                {hasEvening ? <CheckCircle2 size={18} /> : <ChevronRight size={18} className="text-slate-300" />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default PointsView;
