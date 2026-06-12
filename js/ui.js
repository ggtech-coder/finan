App.UI = {
  closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBody').innerHTML = '';
  },

  openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').style.display = 'flex';
  },

  toast(msg, type = 'success') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  setTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
    const el = document.getElementById('tab-' + tab);
    if (el) el.classList.add('active');
    document.querySelectorAll('[data-tab="' + tab + '"]').forEach(b => b.classList.add('active'));
    const titles = {
      dashboard: 'Dashboard', casal: 'Casal', guilherme: 'Guilherme',
      andressa: 'Andressa', metas: 'Metas', patrimonio: 'Patrimônio', relatorios: 'Relatórios'
    };
    const el2 = document.getElementById('topbarTitle');
    if (el2) el2.textContent = titles[tab] || tab;
    if (tab === 'relatorios') App.Reports && App.Reports.load();
    if (tab === 'dashboard') App.Dashboard && App.Dashboard.refresh();
  }
};

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) App.UI.closeModal();
  });
});
