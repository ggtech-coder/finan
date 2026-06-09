// ===== App Main =====
document.addEventListener('DOMContentLoaded', () => {
  // Month navigation
  App.currentMonth = Utils.currentMonthKey();

  const monthLabel = document.getElementById('monthLabel');
  function updateMonthLabel() {
    if (monthLabel) monthLabel.textContent = Utils.monthLabel(App.currentMonth);
  }
  updateMonthLabel();

  document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
    const [y, m] = App.currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    App.currentMonth = d.toISOString().slice(0, 7);
    updateMonthLabel();
    App.Transactions.renderAll();
    App.Dashboard.refresh();
    App.Insights.load();
    App.Calendar.render();
  });

  document.getElementById('btnNextMonth')?.addEventListener('click', () => {
    const [y, m] = App.currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    App.currentMonth = d.toISOString().slice(0, 7);
    updateMonthLabel();
    App.Transactions.renderAll();
    App.Dashboard.refresh();
    App.Insights.load();
    App.Calendar.render();
  });

  // Tab navigation
  document.querySelectorAll('[data-tab]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      App.UI.setTab(b.dataset.tab);
    });
  });

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Alerts bell
  document.getElementById('alertBell')?.addEventListener('click', () => {
    const panel = document.getElementById('alertPanel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // Init modules
  App.Alerts = {
    refresh() {
      const all = App.Transactions ? App.Transactions.getAll() : [];
      const today = new Date();
      const in7 = new Date(); in7.setDate(today.getDate() + 7);

      const overdue = all.filter(t => t.status === 'overdue');
      const todayDue = all.filter(t => t.type==='expense' && t.status==='pending' && t.dueDate && Utils.parseDate(t.dueDate)?.toDateString()===today.toDateString());
      const weekDue = all.filter(t => t.type==='expense' && t.status==='pending' && t.dueDate && Utils.parseDate(t.dueDate) > today && Utils.parseDate(t.dueDate) <= in7);

      const total = overdue.length + todayDue.length + weekDue.length;
      const badge = document.getElementById('alertBadge');
      if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }

      const list = document.getElementById('alertList');
      if (!list) return;
      let html = '';
      if (overdue.length) html += `<div class="alert-section alert-overdue"><strong>⚠️ Atrasadas (${overdue.length})</strong>${overdue.map(t=>`<div class="alert-item">${t.description||''} — ${Utils.money(t.value)} — ${t.person}</div>`).join('')}</div>`;
      if (todayDue.length) html += `<div class="alert-section alert-today"><strong>📌 Vencem Hoje (${todayDue.length})</strong>${todayDue.map(t=>`<div class="alert-item">${t.description||''} — ${Utils.money(t.value)}</div>`).join('')}</div>`;
      if (weekDue.length) html += `<div class="alert-section alert-week"><strong>📅 Esta Semana (${weekDue.length})</strong>${weekDue.map(t=>`<div class="alert-item">${t.description||''} — ${Utils.fmtDate?Utils.fmtDate(t.dueDate):t.dueDate} — ${Utils.money(t.value)}</div>`).join('')}</div>`;
      if (!html) html = '<p style="padding:12px;color:#94a3b8">Nenhum alerta no momento.</p>';
      list.innerHTML = html;
    }
  };

  App.Transactions.init();
  App.Goals.init();
  App.Patrimony.init();
  App.Backup.init();
  App.Dashboard.load();
  App.Insights.load();
  App.Calendar.load();
});
