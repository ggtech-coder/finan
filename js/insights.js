App.Insights = (() => {
  function load() {
    const el = document.getElementById('insightsPanel');
    if (!el) return;
    const all = App.Transactions ? App.Transactions.getAll() : [];
    const month = App.currentMonth || Utils.currentMonthKey();
    const txMonth = all.filter(t => Utils.monthKey(t.date || t.dueDate) === month);
    const income = txMonth.filter(t => t.type === 'income').reduce((a,b)=>a+Number(b.value||0), 0);
    const expense = txMonth.filter(t => t.type === 'expense').reduce((a,b)=>a+Number(b.value||0), 0);
    const paid = txMonth.filter(t => t.type === 'expense' && t.status === 'paid').reduce((a,b)=>a+Number(b.value||0), 0);
    const pending = txMonth.filter(t => t.type === 'expense' && t.status === 'pending').reduce((a,b)=>a+Number(b.value||0), 0);
    const overdue = txMonth.filter(t => t.type === 'expense' && t.status === 'overdue');

    // Category breakdown
    const bycat = {};
    txMonth.filter(t=>t.type==='expense').forEach(t => {
      const k = Utils.catLabel(t.category);
      bycat[k] = (bycat[k]||0) + Number(t.value||0);
    });
    const topCat = Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const balance = income - paid;
    const forecast = income - expense;
    const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const expensePct = income > 0 ? Math.round((expense / income) * 100) : 0;

    let recs = [];

    // Recommendations
    if (overdue.length > 0) recs.push(`⚠️ Você tem <strong>${overdue.length} conta(s) em atraso</strong>. Priorize pagá-las para evitar juros.`);
    if (savingRate < 0) recs.push(`🚨 Gastos superam receitas em <strong>${Utils.money(expense - income)}</strong> este mês. Revise seus gastos.`);
    else if (savingRate < 10) recs.push(`📉 Taxa de poupança de <strong>${savingRate}%</strong>. O ideal é poupar ao menos 20% da renda.`);
    else if (savingRate >= 20) recs.push(`✅ Excelente! Taxa de poupança de <strong>${savingRate}%</strong>. Continue assim!`);
    if (topCat.length > 0) {
      const [cat, val] = topCat[0];
      const pct = income > 0 ? Math.round((val/income)*100) : 0;
      recs.push(`📊 Maior categoria de gasto: <strong>${cat}</strong> (${Utils.money(val)} — ${pct}% da renda).`);
    }
    if (pending > 0) recs.push(`⏳ Você tem <strong>${Utils.money(pending)}</strong> em contas a pagar este mês.`);
    if (forecast > 0) recs.push(`🔮 Saldo previsto ao final do mês: <strong>${Utils.money(forecast)}</strong>.`);
    if (recs.length === 0) recs.push('💡 Nenhuma movimentação registrada neste mês.');

    el.innerHTML = `
      <div class="insights-kpi-row">
        <div class="insight-kpi"><span>Taxa de Poupança</span><strong class="${savingRate>=20?'text-green':savingRate<0?'text-red':'text-yellow'}">${savingRate}%</strong></div>
        <div class="insight-kpi"><span>% Gasto/Renda</span><strong class="${expensePct>90?'text-red':expensePct>70?'text-yellow':'text-green'}">${expensePct}%</strong></div>
        <div class="insight-kpi"><span>Saldo Livre</span><strong>${Utils.money(balance)}</strong></div>
      </div>
      ${topCat.length ? `<div class="insights-cat-list">
        ${topCat.map(([cat, val]) => {
          const pct = income > 0 ? Math.round((val/income)*100) : 0;
          return `<div class="insight-cat-row">
            <span>${cat}</span>
            <div class="insight-cat-bar-wrap"><div class="insight-cat-bar" style="width:${Math.min(100,pct)}%"></div></div>
            <span>${pct}%</span>
          </div>`;
        }).join('')}
      </div>` : ''}
      <div class="insights-recs">${recs.map(r=>`<div class="insight-rec">${r}</div>`).join('')}</div>
    `;
  }

  return { load };
})();
