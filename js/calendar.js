App.Calendar = (() => {
  const PERSON_LABEL = { casal:'Casal', guilherme:'Gui', andressa:'Dessa' };

  function render() {
    const el = document.getElementById('financialCalendar');
    if (!el) return;
    const all = App.Transactions ? App.Transactions.getAll() : [];
    const month = App.currentMonth || Utils.currentMonthKey();
    const [year, mon] = month.split('-').map(Number);
    const firstDay   = new Date(year, mon - 1, 1).getDay();
    const daysInMonth= new Date(year, mon, 0).getDate();
    const today      = Utils.isoToday();

    // Mapeia eventos por dia (despesas pelo dueDate, entradas pela date)
    const events = {};

    // Despesas
    all.filter(t => t.type === 'expense' && t.dueDate && Utils.monthKey(t.dueDate) === month).forEach(t => {
      const day = parseInt(t.dueDate.slice(8,10), 10);
      if (!events[day]) events[day] = [];
      events[day].push({ ...t, _calType: 'expense' });
    });

    // ✅ ENTRADAS: exibe com nome no calendário
    all.filter(t => t.type === 'income' && t.date && Utils.monthKey(t.date) === month).forEach(t => {
      const day = parseInt(t.date.slice(8,10), 10);
      if (!events[day]) events[day] = [];
      // Label: "Entrada Casal", "Entrada Gui", "Entrada Dessa"
      const pLabel = PERSON_LABEL[t.person] || t.person;
      events[day].push({ ...t, _calType: 'income', _label: `Entrada ${pLabel}` });
    });

    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = '<div class="cal-grid">';
    html += weekDays.map(d => `<div class="cal-header-day">${d}</div>`).join('');

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell cal-empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr   = `${year}-${String(mon).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday   = dateStr === today;
      const dayEvents = events[d] || [];
      const hasOverdue= dayEvents.some(t => t.status === 'overdue');
      const hasPending= dayEvents.some(t => t.status === 'pending');
      let cls = 'cal-cell';
      if (isToday)    cls += ' cal-today';
      if (hasOverdue) cls += ' cal-has-overdue';
      else if (hasPending) cls += ' cal-has-pending';

      const evHtml = dayEvents.slice(0,3).map(t => {
        if (t._calType === 'income') {
          return `<div class="cal-event cal-event-income" title="${t._label}: ${Utils.money(t.value)}">${t._label.slice(0,10)}</div>`;
        }
        const lbl = (t.description || '').slice(0, 9);
        return `<div class="cal-event cal-event-${t.status}" title="${t.description||''}: ${Utils.money(t.value)}">${lbl}</div>`;
      }).join('');

      html += `<div class="${cls}">
        <span class="cal-day-num">${d}</span>
        ${evHtml}
        ${dayEvents.length > 3 ? `<div class="cal-event-more">+${dayEvents.length-3}</div>` : ''}
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function load() { render(); }
  return { load, render };
})();
