import React, { useState } from 'react';
import {
  generateSchedule,
  calculateBreaks,
  MonthSchedule,
  RotationType,
} from '../lib/schedule';
import { exportToExcel } from '../lib/export';
import { format, isToday, startOfMonth, getDay } from 'date-fns';

const DAYS_SHORT = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
const ROMANIAN_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + hours * 60;
  const th = Math.floor(total / 60) % 24;
  const tm = total % 60;
  return `${th.toString().padStart(2, '0')}:${tm.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [name, setName] = useState('');
  const [rotationType, setRotationType] = useState<RotationType>('2/2');
  const [startTime, setStartTime] = useState('08:00');
  const [hoursPerDay, setHoursPerDay] = useState<6 | 8>(8);
  const [lastWeekPattern, setLastWeekPattern] = useState<boolean[]>(Array(7).fill(false));
  const [schedule, setSchedule] = useState<MonthSchedule[] | null>(null);
  const [exportMonths, setExportMonths] = useState<number>(6);

  const toggleDay = (index: number) => {
    const np = [...lastWeekPattern];
    np[index] = !np[index];
    setLastWeekPattern(np);
  };

  const handleGenerate = () => {
    const data = generateSchedule({
      rotationType,
      lastWeekPattern,
      startTime,
      hoursPerDay,
      monthsCount: 6,
    });
    setSchedule(data);
  };

  const toggleDayType = (monthIdx: number, dayIdx: number) => {
    if (!schedule) return;
    const paidHours = rotationType === '2/2' ? 12 : hoursPerDay;
    const endT = addHoursToTime(startTime, paidHours);
    setSchedule(prev =>
      prev!.map((month, mIdx) => {
        if (mIdx !== monthIdx) return month;
        const newDays = month.days.map((day, dIdx) => {
          if (dIdx !== dayIdx) return day;
          const newType: 'work' | 'off' =
            day.type === 'work' ? 'off' : 'work';
          return {
            ...day,
            type: newType,
            workHours: newType === 'work' ? `${startTime}–${endT}` : undefined,
            breaks: newType === 'work' && rotationType === '2/2' ? calculateBreaks(startTime) : undefined,
            hoursWorked: newType === 'work' ? paidHours : 0,
          };
        });
        const totalHours = newDays.reduce((sum, d) => sum + (d.hoursWorked ?? 0), 0);
        return { ...month, days: newDays, totalHours };
      })
    );
  };

  const handleExport = () => {
    if (schedule) exportToExcel(name, schedule, exportMonths);
  };

  const computedEndTime = addHoursToTime(startTime, rotationType === '2/2' ? 12 : hoursPerDay);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a0f1e] text-white overflow-x-hidden">

      {/* HEADER */}
      <header className="w-full border-b border-white/10 bg-[#0d1427]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/20 flex items-center justify-center rounded-md border border-cyan-500/50 text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">TureXGo</h1>
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono">
                Grafic {rotationType} · Creat de Pavel Dordea
              </p>
            </div>
          </div>

          {/* Rotation selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/40 uppercase">Tip Grafic:</span>
            {(['2/2', '5/2'] as RotationType[]).map(rt => (
              <button
                key={rt}
                onClick={() => { setRotationType(rt); setSchedule(null); }}
                className={`px-4 h-9 rounded-md text-sm font-bold transition-all border ${
                  rotationType === rt
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {rt}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

            {/* Name */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase block">Nume Angajat</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Popescu Ion"
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-white/20 transition-colors"
              />
            </div>

            {/* Time */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase block">
                {rotationType === '2/2' ? 'Interval Ture (12h)' : 'Oră Start'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-10 px-2 bg-white/5 border border-white/10 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors [color-scheme:dark]"
                />
                <span className="text-white/40 font-mono">–</span>
                <div className="w-full h-10 px-2 bg-white/5 border border-white/10 rounded-md text-sm font-mono text-white/40 flex items-center">
                  {computedEndTime}
                </div>
              </div>
            </div>

            {/* 5/2: hours per day */}
            {rotationType === '5/2' && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase block">Ore / Zi</label>
                <div className="flex items-center gap-2 h-10">
                  {([6, 8] as (6 | 8)[]).map(h => (
                    <button
                      key={h}
                      onClick={() => setHoursPerDay(h)}
                      className={`flex-1 h-10 rounded-md text-sm font-bold border transition-all ${
                        hoursPerDay === h
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2/2: last week pattern */}
            {rotationType === '2/2' && (
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase block">Zile Lucrate (Săptămâna Trecută)</label>
                <div className="flex items-center gap-1 w-full">
                  {DAYS_SHORT.map((day, idx) => {
                    const isSelected = lastWeekPattern[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 h-10 rounded-md text-sm font-medium transition-all border ${
                          isSelected
                            ? 'bg-green-900/50 border-green-600/50 text-green-300'
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5/2: info */}
            {rotationType === '5/2' && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase opacity-0 block">_</label>
                <div className="h-10 flex items-center px-3 bg-white/5 border border-white/10 rounded-md text-xs text-white/40 font-mono">
                  Lun–Vin · Sâm–Dum liber
                </div>
              </div>
            )}

            {/* Generate */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-white/40 uppercase opacity-0 block">_</label>
              <button
                onClick={handleGenerate}
                className="w-full h-10 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-md text-sm transition-colors flex items-center justify-center gap-2"
              >
                Generează
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:px-8">
        {!schedule ? (
          <div className="h-[40vh] flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-lg">
            <svg className="h-12 w-12 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="font-mono text-sm">Completați datele pentru a genera graficul</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Zile de Lucru</span>
                <div className="w-3 h-3 rounded-full bg-red-500 ml-4"></div>
                <span className="text-sm font-medium">Zile Libere</span>
                <span className="text-xs text-white/30 ml-4 font-mono">· click pe zi pentru a schimba</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-white/10 rounded-md bg-white/5 px-3 h-9">
                  <span className="text-xs text-white/40 font-semibold uppercase">Luni:</span>
                  <select
                    value={exportMonths}
                    onChange={(e) => setExportMonths(Number(e.target.value))}
                    className="bg-transparent text-sm font-mono focus:outline-none appearance-none cursor-pointer text-white"
                    style={{ backgroundImage: 'none' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <option key={num} value={num} className="bg-gray-900 text-white">{num}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleExport}
                  className="h-9 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium rounded-md text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Descarcă Excel
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {schedule.map((monthData, mIdx) => {
                const monthName = ROMANIAN_MONTHS[monthData.monthDate.getMonth()];
                const year = monthData.monthDate.getFullYear();
                const firstDayOfWeek = (getDay(startOfMonth(monthData.monthDate)) + 6) % 7;

                return (
                  <div key={mIdx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                      <h2 className="font-bold text-lg tracking-tight">
                        {monthName} <span className="text-white/40 font-normal">{year}</span>
                      </h2>
                    </div>

                    <div className="p-4 flex-1">
                      <div className="grid grid-cols-7 mb-2">
                        {DAYS_SHORT.map(d => (
                          <div key={d} className="text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                          <div key={`e-${i}`} className="h-16 rounded-md" />
                        ))}

                        {monthData.days.map((day, dIdx) => {
                          const isTodayDate = isToday(day.date);
                          const isWork = day.type === 'work';

                          return (
                            <div
                              key={dIdx}
                              onClick={() => toggleDayType(mIdx, dIdx)}
                              title={isWork ? 'Click → Liber' : 'Click → Lucru'}
                              className={`
                                relative p-1 rounded-md border min-h-16 flex flex-col transition-all duration-200 cursor-pointer select-none
                                ${isWork
                                  ? 'bg-green-950/60 border-green-800/40 hover:bg-green-900/60 hover:border-green-700/50'
                                  : 'bg-red-950/50 border-red-900/40 hover:bg-red-900/50 hover:border-red-800/50'
                                }
                                ${isTodayDate ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#0a0f1e]' : ''}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`text-xs font-bold ${isWork ? 'text-green-300' : 'text-red-300'}`}>
                                  {format(day.date, 'd')}
                                </span>
                                {isWork && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                              </div>

                              <div className="mt-auto">
                                {isWork ? (
                                  <div className="text-[9px] font-mono text-center text-white/70 bg-black/30 rounded px-0.5 whitespace-nowrap">
                                    {day.workHours}
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-center text-red-400 uppercase tracking-wider py-1">
                                    Liber
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Monthly total */}
                    <div className="px-4 py-3 border-t border-white/10 bg-cyan-950/30 flex items-center justify-between">
                      <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total ore lucrate</span>
                      <span className="text-lg font-bold text-cyan-400 font-mono">{monthData.totalHours}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/10 bg-white/5 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <span className="text-xs text-white/30 font-mono">TureXGo · Grafic {rotationType}</span>
          <span className="text-xs text-white/30 font-mono">Creat de <span className="text-cyan-400 font-semibold">Pavel Dordea</span></span>
        </div>
      </footer>
    </div>
  );
}
