import { useState } from 'react';
import { ChevronLeft, ChevronRight, Zap, Trash2 } from 'lucide-react';

const getDaysInMonth = (month, year) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const formatDate = (date) => date.toISOString().split('T')[0];

export default function Calendar({ selectedDates, onUpdate, evenings, weekends, onToggleEvenings, onToggleWeekends }) {
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const toggleDate = (dateStr) => {
    const newDates = selectedDates.includes(dateStr)
      ? selectedDates.filter(d => d !== dateStr)
      : [...selectedDates, dateStr];
    onUpdate(newDates);
  };

  const selectFullMonth = () => {
    const monthDays = getDaysInMonth(calMonth, calYear).map(d => formatDate(d));
    onUpdate(Array.from(new Set([...selectedDates, ...monthDays])));
  };

  const selectWeekFrom = (startDate) => {
    const weekDays = [];
    let current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      weekDays.push(formatDate(new Date(current)));
      current.setDate(current.getDate() + 1);
    }
    onUpdate(Array.from(new Set([...selectedDates, ...weekDays])));
  };

  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(calYear, calMonth));
  const days = getDaysInMonth(calMonth, calYear);

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900">Mes disponibilités</h3>
        <button onClick={() => onUpdate([])} className="text-xs text-red-500 flex items-center"><Trash2 size={12} className="mr-1"/> Vider</button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCalMonth(calMonth - 1)} className="p-1"><ChevronLeft size={18}/></button>
        <span className="font-black text-xs uppercase text-blue-600">{monthName}</span>
        <button onClick={() => setCalMonth(calMonth + 1)} className="p-1"><ChevronRight size={18}/></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[10px] text-center font-bold text-gray-300">{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dStr = formatDate(day);
          const isSel = selectedDates.includes(dStr);
          return (
            <button key={i} onClick={() => toggleDate(dStr)} onDoubleClick={() => selectWeekFrom(day)}
              className={`aspect-square rounded-xl text-xs flex items-center justify-center transition-all ${isSel ? 'bg-blue-600 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-blue-50'}`}>
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={selectFullMonth} className="bg-blue-50 text-blue-700 text-[10px] font-bold py-2 rounded-xl border border-blue-100 flex items-center justify-center">
          <Zap size={12} className="mr-1"/> Tout le mois
        </button>
        <div className="text-[9px] text-gray-400 italic flex items-center px-1">Double-clic pour 1 semaine</div>
      </div>

      <div className="mt-4 pt-4 border-t space-y-2">
        <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
          <span className="text-xs font-bold">Soirs</span>
          <input type="checkbox" checked={evenings} onChange={e => onToggleEvenings(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
          <span className="text-xs font-bold">Week-ends</span>
          <input type="checkbox" checked={weekends} onChange={e => onToggleWeekends(e.target.checked)} />
        </label>
      </div>
    </div>
  );
}