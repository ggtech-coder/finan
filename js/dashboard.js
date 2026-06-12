App.Dashboard = (() => {
  let _chart = null;

  function refresh() {
    const month = App.currentMonth || Utils.currentMonthKey();
    const all = App.Transactions ? App.Transactions.getAll() : [];
    const txMonth = all.filter(t => Utils.monthKey(t.date || t.dueDate) === month);

    const income = txMonth.filter(t => t.type === 'income');
    const expense = txMonth.filter(t => t.type === 'expense');
    const paid    = expense.filter(t => t.status === 'paid');
    const pending = expense.filter(t => t.status === 'pending');
    const overdue = expense.filter(t => t.status === 'overdue');

    const totalIncome  = income.reduce((a,b)=>a+Number(b.value||0), 0);
    // ✅ CORREÇÃO: Total de saídas = apenas o que foi PAGO
    const totalPaid    = paid.reduce((a,b)=>a+Number(b.value||0), 0);
    const totalPending = pending.reduce((a,b)=>a+Number(b.value||0), 0);
    const totalOverdue = overdue.reduce((a,b)=>a+Number(b.value||0), 0);
    // Saldo atual = entradas - pagas
    const balance  = totalIncome - totalPaid;
    // Saldo previsto = entradas - todas as despesas (pagas + pendentes + atrasadas)
    const forecast = totalIncome - totalPaid - totalPending - totalOverdue;

    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('kpiIncome',  Utils.money(totalIncome));
    set('kpiExpense', Utils.money(totalPaid));       // só o que saiu de fato
    set('kpiBalance', Utils.money(balance));
    set('kpiForecast',Utils.money(forecast));
    set('kpiPending', pending.length);
    set('kpiOverdue', overdue.length);

    // Reserva de emergência
    DB.getAll('patrimony').then(p => {
      const emergency = p.filter(x => x.type === 'emergencia' || x.type === 'poupanca' || x.type === 'conta_corrente')
                         .reduce((a,b)=>a+Number(b.value||0), 0);
      set('kpiEmergency', Utils.money(emergency));
    });

    // Metas ativas
    DB.getAll('goals').then(g => {
      const active = g.filter(x => Number(x.current||0) < Number(x.target||0));
      set('kpiGoalsActive', active.length);
    });

    renderUpcoming(all);
    renderDashboardChart(totalIncome, totalPaid, totalPending, totalOverdue);

    const kpiOverdueCard = document.querySelector('.kpi-overdue');
    if (kpiOverdueCard) kpiOverdueCard.style.borderLeftColor = overdue.length > 0 ? '#ef4444' : '';
  }

  function renderUpcoming(all) {
    const el = document.getElementById('upcomingList');
    if (!el) return;
    const today = new Date();
    const upcoming = all
      .filter(t => t.type === 'expense' && t.status !== 'paid' && t.dueDate)
      .filter(t => { const d = Utils.parseDate(t.dueDate); return d >= today || t.status === 'overdue'; })
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 8);

    if (!upcoming.length) { el.innerHTML = '<p class="empty-state">Sem vencimentos próximos</p>'; return; }
    el.innerHTML = upcoming.map(tx => {
      const d = Utils.parseDate(tx.dueDate);
      const isToday   = d.toDateString() === today.toDateString();
      const isOverdue = tx.status === 'overdue';
      return `<div class="upcoming-item ${isOverdue?'upcoming-overdue':isToday?'upcoming-today':''}">
        <div class="upcoming-left">
          <div class="upcoming-desc">${tx.description||tx.desc||''}</div>
          <div class="upcoming-person">${tx.person}</div>
        </div>
        <div class="upcoming-right">
          <div class="upcoming-value">${Utils.money(tx.value)}</div>
          <div class="upcoming-date">${isOverdue?'⚠️ ':isToday?'📌 ':''}${Utils.fmtDate(tx.dueDate)}</div>
        </div>
      </div>`;
    }).join('');
  }

  function renderDashboardChart(income, paid, pending, overdue) {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (_chart) _chart.destroy();
    _chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Entradas', 'Pago', 'Pendente', 'Atrasado'],
        datasets: [{ data: [income, paid, pending, overdue],
          backgroundColor: ['#10b981','#6366f1','#f59e0b','#ef4444'], borderRadius: 8 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => 'R$'+v.toLocaleString('pt-BR') }, grid: { color:'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function load() { refresh(); }
  return { load, refresh };
})();
