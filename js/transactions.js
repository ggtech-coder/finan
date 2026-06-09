App.Transactions = (() => {
  const INCOME_TYPES = [
    { value: 'salario', label: 'Salário' },
    { value: 'pix', label: 'PIX Recebido' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'comissao', label: 'Comissão' },
    { value: 'avulsa', label: 'Receita Avulsa' },
    { value: 'outros', label: 'Outras Receitas' }
  ];
  const CATEGORIES = [
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'moradia', label: 'Moradia' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'lazer', label: 'Lazer' },
    { value: 'vestuario', label: 'Vestuário' },
    { value: 'assinatura', label: 'Assinatura' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'outros', label: 'Outros' }
  ];

  let _all = [];

  function init() {
    DB.on('transactions', docs => {
      _all = docs.map(tx => ({ ...tx, status: Utils.checkOverdue(tx) }));
      renderAll();
      App.Dashboard && App.Dashboard.refresh();
      App.Alerts && App.Alerts.refresh();
      App.Calendar && App.Calendar.render();
      App.Insights && App.Insights.load();
    });
  }

  function getAll() { return _all; }

  function renderAll() {
    ['casal', 'guilherme', 'andressa'].forEach(p => renderPerson(p));
  }

  function renderPerson(person) {
    const el = document.getElementById('transactions-' + person);
    if (!el) return;
    const month = App.currentMonth || Utils.currentMonthKey();
    const txs = _all.filter(t => t.person === person && Utils.monthKey(t.date || t.dueDate) === month);
    const income = txs.filter(t => t.type === 'income');
    const expense = txs.filter(t => t.type === 'expense');

    el.innerHTML = `
      <div class="tx-summary-row">
        <div class="tx-sum-card tx-sum-income">
          <div class="tx-sum-label">Entradas</div>
          <div class="tx-sum-val">${Utils.money(income.reduce((a,b)=>a+Number(b.value||0),0))}</div>
        </div>
        <div class="tx-sum-card tx-sum-expense">
          <div class="tx-sum-label">Saídas</div>
          <div class="tx-sum-val">${Utils.money(expense.reduce((a,b)=>a+Number(b.value||0),0))}</div>
        </div>
      </div>
      ${income.length ? `<div class="tx-section-title">💰 Entradas</div>
        <div class="tx-list">${income.map(txCard).join('')}</div>` : ''}
      ${expense.length ? `<div class="tx-section-title">💸 Despesas</div>
        <div class="tx-list">${expense.map(txCard).join('')}</div>` : ''}
      ${!income.length && !expense.length ? '<p class="empty-state">Nenhuma movimentação neste mês.</p>' : ''}
    `;
  }

  function txCard(tx) {
    const statusClass = { paid: 'status-paid', pending: 'status-pending', overdue: 'status-overdue' }[tx.status] || '';
    const statusLabel = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado' }[tx.status] || '';
    const catLabel = tx.type === 'income' ? (INCOME_TYPES.find(x=>x.value===tx.category)?.label || tx.category || '') : Utils.catLabel(tx.category);
    return `
      <div class="tx-card ${tx.status === 'overdue' ? 'tx-overdue' : ''}" data-id="${tx.id}">
        <div class="tx-card-left">
          <div class="tx-desc">${tx.description || tx.desc || 'Sem descrição'}</div>
          <div class="tx-meta">
            ${catLabel ? `<span class="tx-tag">${catLabel}</span>` : ''}
            ${tx.dueDate ? `<span class="tx-tag">Vcto: ${Utils.fmtDate(tx.dueDate)}</span>` : ''}
            ${tx.installment ? `<span class="tx-tag">Parcela ${tx.installment}</span>` : ''}
            ${tx.recurrent ? `<span class="tx-tag">🔁 Recorrente</span>` : ''}
            ${tx.obs ? `<span class="tx-tag obs">📝 ${tx.obs}</span>` : ''}
          </div>
        </div>
        <div class="tx-card-right">
          <div class="tx-value ${tx.type === 'income' ? 'tx-val-income' : 'tx-val-expense'}">
            ${tx.type === 'income' ? '+' : '-'}${Utils.money(tx.value)}
          </div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          <div class="tx-actions">
            ${tx.type === 'expense' && tx.status !== 'paid' ? `<button class="btn-sm btn-pay" onclick="App.Transactions.pay('${tx.id}')">✓ Pagar</button>` : ''}
            <button class="btn-sm btn-edit" onclick="App.Transactions.openEdit('${tx.id}')">✏️</button>
            <button class="btn-sm btn-del" onclick="App.Transactions.remove('${tx.id}')">🗑️</button>
          </div>
        </div>
      </div>`;
  }

  function openModal(type, person) {
    const isIncome = type === 'income';
    const title = isIncome ? '+ Nova Entrada' : '+ Nova Despesa';
    const catOptions = isIncome
      ? INCOME_TYPES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')
      : CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

    const html = `
      <div class="form-group">
        <label>Descrição *</label>
        <input type="text" id="fDesc" placeholder="Ex: Supermercado" class="form-control" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Valor *</label>
          <input type="number" id="fValue" placeholder="0,00" step="0.01" min="0" class="form-control" />
        </div>
        <div class="form-group">
          <label>${isIncome ? 'Tipo de Receita' : 'Categoria'}</label>
          <select id="fCategory" class="form-control">${catOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Data</label>
          <input type="date" id="fDate" value="${Utils.isoToday()}" class="form-control" />
        </div>
        ${!isIncome ? `<div class="form-group">
          <label>Data de Vencimento</label>
          <input type="date" id="fDueDate" class="form-control" />
        </div>` : ''}
      </div>
      ${!isIncome ? `
      <div class="form-row">
        <div class="form-group">
          <label>Parcelamento</label>
          <select id="fInstall" class="form-control">
            <option value="1">À vista</option>
            ${[2,3,4,5,6,7,8,9,10,11,12].map(n=>`<option value="${n}">${n}x</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Recorrência</label>
          <select id="fRecurrent" class="form-control">
            <option value="">Não recorrente</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Observações</label>
        <input type="text" id="fObs" class="form-control" placeholder="Opcional" />
      </div>` : ''}
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Transactions.save('${type}','${person}')">Salvar</button>
      </div>`;
    App.UI.openModal(title, html);
  }

  async function save(type, person) {
    const desc = document.getElementById('fDesc')?.value?.trim();
    const value = parseFloat(document.getElementById('fValue')?.value || 0);
    const category = document.getElementById('fCategory')?.value;
    const date = document.getElementById('fDate')?.value || Utils.isoToday();
    const dueDate = document.getElementById('fDueDate')?.value || null;
    const obs = document.getElementById('fObs')?.value?.trim() || '';
    const installments = parseInt(document.getElementById('fInstall')?.value || 1);
    const recurrent = document.getElementById('fRecurrent')?.value || '';

    if (!desc || !value) { App.UI.toast('Preencha descrição e valor.', 'error'); return; }

    App.UI.closeModal();

    if (type === 'expense' && installments > 1) {
      for (let i = 1; i <= installments; i++) {
        const due = dueDate ? Utils.addMonths(dueDate, i - 1) : Utils.addMonths(date, i - 1);
        await DB.add('transactions', {
          type, person, description: desc, value, category,
          date: Utils.addMonths(date, i - 1), dueDate: due,
          installment: `${i}/${installments}`, status: 'pending', obs
        });
      }
      App.UI.toast(`${installments} parcelas criadas!`);
    } else {
      await DB.add('transactions', {
        type, person, description: desc, value, category,
        date, dueDate: type === 'expense' ? (dueDate || date) : null,
        status: type === 'expense' ? 'pending' : 'paid',
        recurrent: recurrent || null, obs
      });
      App.UI.toast('Salvo com sucesso!');
    }
  }

  async function pay(id) {
    const tx = _all.find(t => t.id === id);
    if (!tx) return;
    await DB.update('transactions', id, { status: 'paid' });

    // If recurrent monthly, generate next month
    if (tx.recurrent === 'monthly' && tx.dueDate) {
      const nextDue = Utils.addMonths(tx.dueDate, 1);
      const nextDate = Utils.addMonths(tx.date || tx.dueDate, 1);
      await DB.add('transactions', {
        type: tx.type, person: tx.person, description: tx.description,
        value: tx.value, category: tx.category, date: nextDate,
        dueDate: nextDue, status: 'pending', recurrent: 'monthly', obs: tx.obs || ''
      });
      App.UI.toast('Pago! Próxima parcela gerada.');
    } else {
      App.UI.toast('Marcado como pago!');
    }
  }

  function openEdit(id) {
    const tx = _all.find(t => t.id === id);
    if (!tx) return;
    const isIncome = tx.type === 'income';
    const catOptions = isIncome
      ? INCOME_TYPES.map(c => `<option value="${c.value}" ${tx.category===c.value?'selected':''}>${c.label}</option>`).join('')
      : CATEGORIES.map(c => `<option value="${c.value}" ${tx.category===c.value?'selected':''}>${c.label}</option>`).join('');

    const html = `
      <div class="form-group"><label>Descrição</label>
        <input type="text" id="eDesc" value="${tx.description||tx.desc||''}" class="form-control" /></div>
      <div class="form-row">
        <div class="form-group"><label>Valor</label>
          <input type="number" id="eValue" value="${tx.value||0}" step="0.01" class="form-control" /></div>
        <div class="form-group"><label>Categoria</label>
          <select id="eCategory" class="form-control">${catOptions}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Data</label>
          <input type="date" id="eDate" value="${(tx.date||'').slice(0,10)}" class="form-control" /></div>
        ${!isIncome ? `<div class="form-group"><label>Vencimento</label>
          <input type="date" id="eDueDate" value="${(tx.dueDate||'').slice(0,10)}" class="form-control" /></div>` : ''}
      </div>
      <div class="form-group"><label>Observações</label>
        <input type="text" id="eObs" value="${tx.obs||''}" class="form-control" /></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Transactions._saveEdit('${id}','${tx.type}')">Salvar</button>
      </div>`;
    App.UI.openModal('Editar Lançamento', html);
  }

  async function _saveEdit(id, type) {
    const isIncome = type === 'income';
    const data = {
      description: document.getElementById('eDesc')?.value?.trim(),
      value: parseFloat(document.getElementById('eValue')?.value || 0),
      category: document.getElementById('eCategory')?.value,
      date: document.getElementById('eDate')?.value,
      obs: document.getElementById('eObs')?.value?.trim() || ''
    };
    if (!isIncome) data.dueDate = document.getElementById('eDueDate')?.value || null;
    await DB.update('transactions', id, data);
    App.UI.closeModal();
    App.UI.toast('Atualizado!');
  }

  async function remove(id) {
    if (!confirm('Remover este lançamento?')) return;
    await DB.remove('transactions', id);
    App.UI.toast('Removido.', 'info');
  }

  return { init, getAll, renderAll, renderPerson, openModal, save, pay, openEdit, _saveEdit, remove };
})();
