App.Backup = (() => {
  function init() {
    const btnEx  = document.getElementById('btnExportBackup');
    const btnIm  = document.getElementById('btnImportBackup');
    const fileIn = document.getElementById('importFileInput');

    // ✅ Exportar como PDF (relatório completo)
    if (btnEx) btnEx.onclick = exportPDF;

    if (btnIm) btnIm.onclick = () => fileIn && fileIn.click();
    if (fileIn) fileIn.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const data = JSON.parse(ev.target.result);
          await DB.importAll(data);
          App.UI.toast('Backup importado com sucesso!');
          fileIn.value = '';
        } catch(err) {
          App.UI.toast('Erro ao importar backup.', 'error');
        }
      };
      reader.readAsText(file);
    };
  }

  async function exportPDF() {
    App.UI.toast('Gerando relatório PDF...', 'info');

    const [transactions, goals, patrimony] = await Promise.all([
      DB.getAll('transactions'),
      DB.getAll('goals'),
      DB.getAll('patrimony')
    ]);

    const month = App.currentMonth || Utils.currentMonthKey();
    const monthName = Utils.monthLabel(month);
    const txMonth = transactions.map(tx => ({ ...tx, status: Utils.checkOverdue(tx) }))
                                .filter(t => Utils.monthKey(t.date || t.dueDate) === month);

    const income  = txMonth.filter(t => t.type === 'income');
    const expense = txMonth.filter(t => t.type === 'expense');
    const paid    = expense.filter(t => t.status === 'paid');
    const pending = expense.filter(t => t.status === 'pending');
    const overdue = expense.filter(t => t.status === 'overdue');

    const totalIncome  = income.reduce((a,b)=>a+Number(b.value||0), 0);
    const totalPaid    = paid.reduce((a,b)=>a+Number(b.value||0), 0);
    const totalPending = pending.reduce((a,b)=>a+Number(b.value||0), 0);
    const totalOverdue = overdue.reduce((a,b)=>a+Number(b.value||0), 0);
    const balance      = totalIncome - totalPaid;
    const forecast     = totalIncome - totalPaid - totalPending - totalOverdue;
    const totalPatrimony = patrimony.reduce((a,b)=>a+Number(b.value||0), 0);

    const byPerson = ['casal','guilherme','andressa'].map(p => ({
      name: { casal:'Casal', guilherme:'Guilherme', andressa:'Andressa' }[p],
      income:  income.filter(t=>t.person===p).reduce((a,b)=>a+Number(b.value||0),0),
      expense: expense.filter(t=>t.person===p).reduce((a,b)=>a+Number(b.value||0),0)
    }));

    const byCat = {};
    expense.forEach(t => {
      const k = Utils.catLabel(t.category);
      byCat[k] = (byCat[k]||0) + Number(t.value||0);
    });

    const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

    const txRows = (list, type) => list.map(t => `
      <tr class="${t.status==='overdue'?'row-overdue':''}">
        <td>${t.description||'-'}</td>
        <td>${Utils.catLabel(t.category)||'-'}</td>
        <td>${{casal:'Casal',guilherme:'Guilherme',andressa:'Andressa'}[t.person]||t.person}</td>
        <td>${Utils.fmtDate(t.dueDate||t.date)}</td>
        <td class="${type==='income'?'val-income':'val-expense'}">${type==='income'?'+':'-'}${Utils.money(t.value)}</td>
        <td><span class="badge-${t.status||'paid'}">${{paid:'Pago',pending:'Pendente',overdue:'Atrasado'}[t.status]||'-'}</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório Financeiro — ${monthName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a2e; font-size:13px; padding:32px; }
  h1 { font-size:26px; font-weight:800; color:#7C3AED; margin-bottom:4px; }
  .subtitle { color:#6b7280; font-size:14px; margin-bottom:32px; }
  .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
  .kpi { background:#f8f5ff; border-radius:12px; padding:16px; border-left:4px solid #7C3AED; }
  .kpi.green { border-color:#10b981; background:#f0fdf4; }
  .kpi.red   { border-color:#ef4444; background:#fef2f2; }
  .kpi.yellow{ border-color:#f59e0b; background:#fffbeb; }
  .kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7280; margin-bottom:6px; }
  .kpi-val   { font-size:20px; font-weight:800; }
  .kpi.green .kpi-val { color:#10b981; }
  .kpi.red   .kpi-val { color:#ef4444; }
  .kpi.yellow.kpi-val { color:#f59e0b; }
  h2 { font-size:16px; font-weight:700; color:#1a1a2e; margin:28px 0 12px; padding-bottom:8px; border-bottom:2px solid #e5e7eb; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { background:#f3f4f6; font-size:11px; font-weight:700; text-transform:uppercase; padding:10px 12px; text-align:left; color:#6b7280; }
  td { padding:9px 12px; border-bottom:1px solid #f3f4f6; font-size:13px; }
  tr.row-overdue td { background:#fef2f2; }
  tr:hover td { background:#f9fafb; }
  .val-income { color:#10b981; font-weight:700; }
  .val-expense{ color:#ef4444; font-weight:700; }
  .badge-paid    { background:#d1fae5; color:#059669; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
  .badge-pending { background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
  .badge-overdue { background:#fee2e2; color:#dc2626; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
  .person-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
  .person-card { border:1px solid #e5e7eb; border-radius:10px; padding:14px; }
  .person-name { font-weight:700; margin-bottom:8px; color:#7C3AED; }
  .person-line { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; }
  .cat-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f3f4f6; }
  .goal-row { padding:10px 0; border-bottom:1px solid #f3f4f6; }
  .goal-bar-wrap { background:#e5e7eb; border-radius:99px; height:6px; margin:6px 0; }
  .goal-bar { background:#7C3AED; border-radius:99px; height:6px; }
  .pat-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f3f4f6; }
  .footer { margin-top:40px; text-align:center; color:#9ca3af; font-size:12px; border-top:1px solid #e5e7eb; padding-top:16px; }
  @media print {
    body { padding:16px; }
    .no-print { display:none; }
  }
</style>
</head>
<body>
<h1>💜 FinançasCasal — Relatório Financeiro</h1>
<div class="subtitle">Período: ${monthName} &nbsp;|&nbsp; Gerado em: ${now}</div>

<div class="kpi-row">
  <div class="kpi green"><div class="kpi-label">Total de Entradas</div><div class="kpi-val">${Utils.money(totalIncome)}</div></div>
  <div class="kpi red"><div class="kpi-label">Total Pago</div><div class="kpi-val">${Utils.money(totalPaid)}</div></div>
  <div class="kpi"><div class="kpi-label">Saldo Atual</div><div class="kpi-val">${Utils.money(balance)}</div></div>
  <div class="kpi yellow"><div class="kpi-label">Saldo Previsto</div><div class="kpi-val">${Utils.money(forecast)}</div></div>
</div>
<div class="kpi-row">
  <div class="kpi yellow"><div class="kpi-label">Pendente</div><div class="kpi-val">${pending.length} conta(s) — ${Utils.money(totalPending)}</div></div>
  <div class="kpi red"><div class="kpi-label">Atrasado</div><div class="kpi-val">${overdue.length} conta(s) — ${Utils.money(totalOverdue)}</div></div>
  <div class="kpi green"><div class="kpi-label">Patrimônio Total</div><div class="kpi-val">${Utils.money(totalPatrimony)}</div></div>
  <div class="kpi"><div class="kpi-label">Metas Ativas</div><div class="kpi-val">${goals.filter(g=>Number(g.current||0)<Number(g.target||0)).length}</div></div>
</div>

<h2>👥 Resumo por Pessoa</h2>
<div class="person-row">
  ${byPerson.map(p=>`<div class="person-card">
    <div class="person-name">${p.name}</div>
    <div class="person-line"><span>Entradas</span><span style="color:#10b981;font-weight:700">${Utils.money(p.income)}</span></div>
    <div class="person-line"><span>Despesas</span><span style="color:#ef4444;font-weight:700">${Utils.money(p.expense)}</span></div>
    <div class="person-line"><span>Saldo</span><span style="font-weight:700">${Utils.money(p.income-p.expense)}</span></div>
  </div>`).join('')}
</div>

${Object.keys(byCat).length ? `<h2>📊 Gastos por Categoria</h2>
<div>${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
  <div class="cat-row"><span>${cat}</span><span style="font-weight:700;color:#ef4444">${Utils.money(val)} (${totalPaid>0?Math.round((val/totalPaid)*100):0}%)</span></div>
`).join('')}</div>` : ''}

${income.length ? `<h2>💰 Entradas do Mês</h2>
<table><thead><tr><th>Descrição</th><th>Categoria</th><th>Pessoa</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead>
<tbody>${txRows(income,'income')}</tbody></table>` : ''}

${expense.length ? `<h2>💸 Despesas do Mês</h2>
<table><thead><tr><th>Descrição</th><th>Categoria</th><th>Pessoa</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead>
<tbody>${txRows(expense,'expense')}</tbody></table>` : ''}

${goals.length ? `<h2>🎯 Metas Financeiras</h2>
<div>${goals.map(g=>{
  const pct=Math.min(100,Math.round((Number(g.current||0)/Number(g.target||1))*100));
  return `<div class="goal-row">
    <div style="display:flex;justify-content:space-between"><strong>${g.name}</strong><span>${pct}%</span></div>
    <div class="goal-bar-wrap"><div class="goal-bar" style="width:${pct}%"></div></div>
    <div style="font-size:12px;color:#6b7280">${Utils.money(g.current||0)} de ${Utils.money(g.target)}</div>
  </div>`;}).join('')}</div>` : ''}

${patrimony.length ? `<h2>🏦 Patrimônio</h2>
<div>${patrimony.map(p=>`<div class="pat-row"><span>${p.name}</span><span style="font-weight:700;color:#10b981">${Utils.money(p.value)}</span></div>`).join('')}</div>` : ''}

<div class="footer">FinançasCasal &nbsp;•&nbsp; Relatório gerado automaticamente em ${now}</div>

<script>window.onload = () => { window.print(); }<\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `relatorio-financas-${month}.html`;
    a.click();
    URL.revokeObjectURL(url);
    App.UI.toast('Relatório gerado! Abra e use Ctrl+P → Salvar como PDF 🖨️');
  }

  return { init };
})();
