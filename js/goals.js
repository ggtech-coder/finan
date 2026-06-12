App.Goals = (() => {
  let _goals = [];

  function init() {
    DB.on('goals', docs => {
      _goals = docs;
      render();
      App.Dashboard && App.Dashboard.refresh();
    });
  }

  function render() {
    const el = document.getElementById('goalsList');
    if (!el) return;
    if (!_goals.length) { el.innerHTML = '<p class="empty-state">Nenhuma meta cadastrada.</p>'; return; }
    el.innerHTML = _goals.map(goalCard).join('');
  }

  function goalCard(g) {
    const pct = Math.min(100, Math.round((Number(g.current||0) / Number(g.target||1)) * 100));
    const done = pct >= 100;
    return `<div class="goal-card ${done?'goal-done':''}">
      <div class="goal-header">
        <div class="goal-name">${g.name}</div>
        <div class="goal-pct">${pct}%</div>
      </div>
      <div class="goal-progress">
        <div class="goal-bar" style="width:${pct}%"></div>
      </div>
      <div class="goal-values">
        <span>${Utils.money(g.current||0)} de ${Utils.money(g.target)}</span>
        <span class="goal-remaining">${done ? '✅ Concluída' : 'Faltam ' + Utils.money(Number(g.target) - Number(g.current||0))}</span>
      </div>
      <div class="goal-actions">
        <button class="btn-sm btn-pay" onclick="App.Goals.addValue('${g.id}')">+ Valor</button>
        <button class="btn-sm btn-edit" onclick="App.Goals.openEdit('${g.id}')">✏️</button>
        <button class="btn-sm btn-del" onclick="App.Goals.remove('${g.id}')">🗑️</button>
      </div>
    </div>`;
  }

  function openModal() {
    const html = `
      <div class="form-group"><label>Nome da Meta *</label>
        <input type="text" id="gName" class="form-control" placeholder="Ex: Viagem para a Europa" /></div>
      <div class="form-row">
        <div class="form-group"><label>Valor Objetivo *</label>
          <input type="number" id="gTarget" class="form-control" step="0.01" min="0" /></div>
        <div class="form-group"><label>Valor Atual</label>
          <input type="number" id="gCurrent" class="form-control" step="0.01" min="0" value="0" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Goals.save()">Salvar</button>
      </div>`;
    App.UI.openModal('🎯 Nova Meta', html);
  }

  async function save() {
    const name = document.getElementById('gName')?.value?.trim();
    const target = parseFloat(document.getElementById('gTarget')?.value || 0);
    const current = parseFloat(document.getElementById('gCurrent')?.value || 0);
    if (!name || !target) { App.UI.toast('Preencha nome e valor.', 'error'); return; }
    await DB.add('goals', { name, target, current });
    App.UI.closeModal();
    App.UI.toast('Meta criada!');
  }

  function addValue(id) {
    const g = _goals.find(x=>x.id===id);
    if (!g) return;
    const html = `
      <p>Meta: <strong>${g.name}</strong></p>
      <p>Atual: ${Utils.money(g.current||0)} / ${Utils.money(g.target)}</p>
      <div class="form-group"><label>Adicionar valor</label>
        <input type="number" id="gAdd" class="form-control" step="0.01" min="0" /></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Goals._doAdd('${id}')">Confirmar</button>
      </div>`;
    App.UI.openModal('+ Adicionar Valor', html);
  }

  async function _doAdd(id) {
    const g = _goals.find(x=>x.id===id);
    if (!g) return;
    const add = parseFloat(document.getElementById('gAdd')?.value || 0);
    if (!add) { App.UI.toast('Valor inválido.', 'error'); return; }
    const newCurrent = Number(g.current||0) + add;
    await DB.update('goals', id, { current: newCurrent });
    App.UI.closeModal();
    App.UI.toast('Valor atualizado!');
  }

  function openEdit(id) {
    const g = _goals.find(x=>x.id===id);
    if (!g) return;
    const html = `
      <div class="form-group"><label>Nome</label>
        <input type="text" id="geName" class="form-control" value="${g.name}" /></div>
      <div class="form-row">
        <div class="form-group"><label>Valor Objetivo</label>
          <input type="number" id="geTarget" class="form-control" value="${g.target}" step="0.01" /></div>
        <div class="form-group"><label>Valor Atual</label>
          <input type="number" id="geCurrent" class="form-control" value="${g.current||0}" step="0.01" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.Goals._saveEdit('${id}')">Salvar</button>
      </div>`;
    App.UI.openModal('Editar Meta', html);
  }

  async function _saveEdit(id) {
    const data = {
      name: document.getElementById('geName')?.value?.trim(),
      target: parseFloat(document.getElementById('geTarget')?.value || 0),
      current: parseFloat(document.getElementById('geCurrent')?.value || 0)
    };
    await DB.update('goals', id, data);
    App.UI.closeModal();
    App.UI.toast('Meta atualizada!');
  }

  async function remove(id) {
    if (!confirm('Remover esta meta?')) return;
    await DB.remove('goals', id);
    App.UI.toast('Meta removida.', 'info');
  }

  return { init, render, openModal, save, addValue, _doAdd, openEdit, _saveEdit, remove };
})();
