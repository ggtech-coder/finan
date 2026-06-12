App.Reports = (() => {
  let charts = {};

  function load() {
    const all = App.Transactions ? App.Transactions.getAll() : [];
    renderIncomeExpense(all);
    renderByCategory(all);
    renderByPerson(all);
    renderPatrimony();
    renderMonthlyBalance(all);
  }

  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  function renderIncomeExpense(all) {
    destroyChart('ie');
    const canvas = document.getElementById('chartIncomeExpense');
    if (!canvas) return;
    const months = getLast12Months();
    const incomes = months.map(m => all.filter(t=>t.type==='income'&&Utils.monthKey(t.date||t.dueDate)===m).reduce((a,b)=>a+Number(b.value||0),0));
    const expenses = months.map(m => all.filter(t=>t.type==='expense'&&Utils.monthKey(t.date||t.dueDate)===m).reduce((a,b)=>a+Number(b.value||0),0));
    charts['ie'] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months.map(m => Utils.monthLabel(m).replace(' de ', '/').slice(0,8)),
        datasets: [
          { label: 'Entradas', data: incomes, backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Saídas', data: expenses, backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: chartOpts()
    });
  }

  function renderByCategory(all) {
    destroyChart('cat');
    const canvas = document.getElementById('chartByCategory');
    if (!canvas) return;
    const month = App.currentMonth || Utils.currentMonthKey();
    const expenses = all.filter(t=>t.type==='expense'&&Utils.monthKey(t.date||t.dueDate)===month);
    const bycat = {};
    expenses.forEach(t => {
      const k = Utils.catLabel(t.category);
      bycat[k] = (bycat[k]||0) + Number(t.value||0);
    });
    const labels = Object.keys(bycat);
    const data = labels.map(k=>bycat[k]);
    charts['cat'] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 10 } } } }
    });
  }

  function renderByPerson(all) {
    destroyChart('person');
    const canvas = document.getElementById('chartByPerson');
    if (!canvas) return;
    const month = App.currentMonth || Utils.currentMonthKey();
    const persons = ['casal','guilherme','andressa'];
    const data = persons.map(p => all.filter(t=>t.type==='expense'&&t.person===p&&Utils.monthKey(t.date||t.dueDate)===month).reduce((a,b)=>a+Number(b.value||0),0));
    charts['person'] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Casal','Guilherme','Andressa'],
        datasets: [{ label: 'Gastos', data, backgroundColor: ['#7C3AED','#3b82f6','#ec4899'], borderRadius: 6 }]
      },
      options: chartOpts()
    });
  }

  function renderPatrimony() {
    destroyChart('pat');
    const canvas = document.getElementById('chartPatrimony');
    if (!canvas) return;
    DB.getAll('patrimony').then(items => {
      const byType = {};
      items.forEach(i => { byType[i.type] = (byType[i.type]||0) + Number(i.value||0); });
      const labels = Object.keys(byType).map(k => {
        return { conta_corrente:'Conta', poupanca:'Poupança', investimento:'Investimento', fgts:'FGTS', veiculo:'Veículo', imovel:'Imóvel', outros:'Outros' }[k] || k;
      });
      charts['pat'] = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data: Object.values(byType), backgroundColor: COLORS.slice(0, labels.length), borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 8 } } } }
      });
    });
  }

  function renderMonthlyBalance(all) {
    destroyChart('bal');
    const canvas = document.getElementById('chartMonthlyBalance');
    if (!canvas) return;
    const months = getLast12Months();
    const balances = months.map(m => {
      const inc = all.filter(t=>t.type==='income'&&Utils.monthKey(t.date||t.dueDate)===m).reduce((a,b)=>a+Number(b.value||0),0);
      const exp = all.filter(t=>t.type==='expense'&&Utils.monthKey(t.date||t.dueDate)===m).reduce((a,b)=>a+Number(b.value||0),0);
      return inc - exp;
    });
    charts['bal'] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: months.map(m => Utils.monthLabel(m).replace(' de ', '/').slice(0,8)),
        datasets: [{ label: 'Saldo', data: balances, borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.15)', fill: true, tension: 0.4, pointRadius: 4 }]
      },
      options: chartOpts()
    });
  }

  function getLast12Months() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0,7));
    }
    return months;
  }

  function chartOpts() {
    return {
      responsive: true,
      plugins: { legend: { labels: { color: '#e2e8f0' } } },
      scales: {
        y: { ticks: { color: '#94a3b8', callback: v => 'R$' + v.toLocaleString('pt-BR') }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      }
    };
  }

  const COLORS = ['#7C3AED','#10b981','#3b82f6','#f59e0b','#ec4899','#06b6d4','#84cc16','#f97316','#8b5cf6','#14b8a6'];

  return { load };
})();
