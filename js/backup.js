App.Backup = (() => {
  function init() {
    const btnEx = document.getElementById('btnExportBackup');
    if (btnEx) btnEx.onclick = exportBackup;
    const btnIm = document.getElementById('btnImportBackup');
    const fileIn = document.getElementById('importFileInput');
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

  async function exportBackup() {
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date().toISOString().slice(0,10);
    a.download = `financas-backup-${d}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    App.UI.toast('Backup exportado!');
  }

  return { init };
})();
