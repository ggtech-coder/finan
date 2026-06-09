App.Patrimony = (() => {
  const TYPES = [
    { value: 'emergencia',    label: '🛡️ Reserva de Emergência' },
    { value: 'conta_corrente',label: '🏦 Conta Corrente' },
    { value: 'poupanca',      label: '💰 Poupança' },
    { value: 'investimento',  label: '📈 Investimento' },
    { value: 'fgts',          label: '🏛️ FGTS' },
    { value: 'veiculo',       label: '🚗 Veículo' },
    { value: 'imovel',        label: '🏠 Imóvel' },
    { value: 'outros',        label: '📦 Outros Bens' }
  ];
  let _items = [];

  function init() {
    DB.on('patrimony', docs => {
      _items = docs;
      renderSummary();
      renderList();
      App.Dashboard && App.Dashboard.refresh();
    });
  }

  function renderSummary() {
    const el = document.getElementById('patrimonySummary');
    if (!el) return;
    const total = _items.reduce((a,b)=>a+Number(b.value||0), 0);
    const byType = {};
    TYPES.forEach(t => byType[t.value] = 0);
    _items.forEach(i => { if (byType[i.type] !== undefined) byType[i.type] += Number(i.value||0); });
    el.innerHTML = `<div class="pat-summary">
      <div class="pat-total"><span>Patrimônio Total</span><strong>${Utils.money(total)}</strong></div>
      <div class="pat-breakdown">
        ${TYPES.filter(t=>byType[t.value]>0).map(t =>
          `<div class="pat-item"><span>${t.label}</span><span>${Utils.money(byType[t.value])}</span></div>`
        ).join('')}
      </div>
    </div>`;
  }

  function renderList() {
    const el = document.getElementById('patrimonyList');
    if (!el) return;
    if (!_items.length) { el.innerHTML = '<p class="empty-state">Nenhum bem cadastrado.</p>'; return; }
    el.innerHTML = _items.map(item => {
      const typeLabel = TYPES.find(t=>t.value===item.type)?.label || item.type;
      return `<div class="pat-card">
        <div class="pat-card-type">${typeLabel}</div>
        <div class="pat-card-name">${item.name}</div>
        <div class="pat-card-value">${Utils.money(item.value)}</div>
        ${item.obs ? `<div class="pat-card-obs">${item.obs}</div>` : ''}
        <div class="pat-card-actions">
          <button class="btn-sm btn-pay" onclick="App.Patrimony.openAddValue('${item.id}')">+ Valor</button>
          <button class="btn-sm btn-edit" onclick="App.Patrimony.openEdit('${item.id}')">✏️</button>
          <button class="btn-sm btn-del" onclick="App.Patrimony.remove('${item.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }

  function openModal() {
    const typeOptions = TYPES.map(t=>`<option value="${t.value}">${t.label}</option>`).join('');
    const html = `
      <div class="form-row">
        <div class="form-group"><label>Tipo *</label>
          <select id="pType" class="form-control">${typeOptions}</select></div>
        <div class="form-group"><label>Nome *</label>
          <input type="text" id="pName" class="form-control" placeholder="Ex: Nubank" /></div>
      </div>
      <div class="form-group"><label>Valor Atual *</label>
        <input type="number" id="pValue" class="form-control" step="0.01" min="0" /></div>
      <div class="form-group"><label>Observações</label>
        <input type="text" id="pObs" class="form-control" /></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Patrimony.save()">Salvar</button>
      </div>`;
    App.UI.openModal('🏦 Adicionar Bem / Reserva', html);
  }

  async function save() {
    const type  = document.getElementById('pType')?.value;
    const name  = document.getElementById('pName')?.value?.trim();
    const value = parseFloat(document.getElementById('pValue')?.value || 0);
    const obs   = document.getElementById('pObs')?.value?.trim() || '';
    if (!name || !value) { App.UI.toast('Preencha nome e valor.', 'error'); return; }
    await DB.add('patrimony', { type, name, value, obs, date: Utils.isoToday() });
    App.UI.closeModal();
    App.UI.toast('Bem adicionado!');
  }

  // ✅ NOVO: adicionar valor a um bem/reserva existente
  function openAddValue(id) {
    const item = _items.find(x=>x.id===id);
    if (!item) return;
    const typeLabel = TYPES.find(t=>t.value===item.type)?.label || item.type;
    const html = `
      <p style="color:#94a3b8;margin-bottom:16px">${typeLabel} — <strong>${item.name}</strong></p>
      <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Saldo atual: <strong style="color:#10b981">${Utils.money(item.value)}</strong></p>
      <div class="form-group"><label>Operação</label>
        <select id="pavOp" class="form-control">
          <option value="add">➕ Depositar / Adicionar</option>
          <option value="sub">➖ Retirar / Subtrair</option>
          <option value="set">✏️ Definir novo valor</option>
        </select>
      </div>
      <div class="form-group"><label>Valor *</label>
        <input type="number" id="pavVal" class="form-control" step="0.01" min="0" placeholder="0,00" /></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Patrimony._doAddValue('${id}')">Confirmar</button>
      </div>`;
    App.UI.openModal('💰 Atualizar Valor', html);
  }

  async function _doAddValue(id) {
    const item = _items.find(x=>x.id===id);
    if (!item) return;
    const op  = document.getElementById('pavOp')?.value;
    const val = parseFloat(document.getElementById('pavVal')?.value || 0);
    if (!val && op !== 'set') { App.UI.toast('Informe o valor.', 'error'); return; }
    let newVal;
    if (op === 'add') newVal = Number(item.value||0) + val;
    else if (op === 'sub') newVal = Math.max(0, Number(item.value||0) - val);
    else newVal = val;
    await DB.update('patrimony', id, { value: newVal });
    App.UI.closeModal();
    App.UI.toast('Valor atualizado!');
  }

  function openEdit(id) {
    const item = _items.find(x=>x.id===id);
    if (!item) return;
    const typeOptions = TYPES.map(t=>`<option value="${t.value}" ${t.value===item.type?'selected':''}>${t.label}</option>`).join('');
    const html = `
      <div class="form-row">
        <div class="form-group"><label>Tipo</label>
          <select id="peType" class="form-control">${typeOptions}</select></div>
        <div class="form-group"><label>Nome</label>
          <input type="text" id="peName" class="form-control" value="${item.name}" /></div>
      </div>
      <div class="form-group"><label>Valor</label>
        <input type="number" id="peValue" class="form-control" value="${item.value}" step="0.01" /></div>
      <div class="form-group"><label>Observações</label>
        <input type="text" id="peObs" class="form-control" value="${item.obs||''}" /></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Patrimony._saveEdit('${id}')">Salvar</button>
      </div>`;
    App.UI.openModal('Editar Bem', html);
  }

  async function _saveEdit(id) {
    const data = {
      type:  document.getElementById('peType')?.value,
      name:  document.getElementById('peName')?.value?.trim(),
      value: parseFloat(document.getElementById('peValue')?.value || 0),
      obs:   document.getElementById('peObs')?.value?.trim() || ''
    };
    await DB.update('patrimony', id, data);
    App.UI.closeModal();
    App.UI.toast('Atualizado!');
  }

  async function remove(id) {
    if (!confirm('Remover este bem?')) return;
    await DB.remove('patrimony', id);
    App.UI.toast('Removido.', 'info');
  }

  return { init, renderSummary, renderList, openModal, save, openAddValue, _doAddValue, openEdit, _saveEdit, remove };
})();
