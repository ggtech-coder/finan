App.Calendar = (() => {
  function render() {
    const el = document.getElementById('financialCalendar');
    if (!el) return;
    const all = App.Transactions ? App.Transactions.getAll() : [];
    const month = App.currentMonth || Utils.currentMonthKey();
    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1).getDay();
    const daysInMonth = new Date(year, mon, 0).getDate();
    const today = Utils.isoToday();

    // Map events by day
    const events = {};
    all.filter(t => t.type === 'expense' && t.dueDate && Utils.monthKey(t.dueDate) === month).forEach(t => {
      const day = t.dueDate.slice(8, 10).replace(/^0/, '');
      if (!events[day]) events[day] = [];
      events[day].push(t);
    });

    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = '<div class="cal-grid">';
    html += weekDays.map(d=>`<div class="cal-header-day">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell cal-empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === today;
      const dayEvents = events[d] || [];
      const hasOverdue = dayEvents.some(t => t.status === 'overdue');
      const hasPending = dayEvents.some(t => t.status === 'pending');
      let cls = 'cal-cell';
      if (isToday) cls += ' cal-today';
      if (hasOverdue) cls += ' cal-has-overdue';
      else if (hasPending) cls += ' cal-has-pending';

      html += `<div class="${cls}">
        <span class="cal-day-num">${d}</span>
        ${dayEvents.slice(0,2).map(t => `<div class="cal-event cal-event-${t.status}" title="${t.description||''}: ${Utils.money(t.value)}">${(t.description||'').slice(0,8)}</div>`).join('')}
        ${dayEvents.length > 2 ? `<div class="cal-event-more">+${dayEvents.length-2}</div>` : ''}
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function load() { render(); }
  return { load, render };
})();
