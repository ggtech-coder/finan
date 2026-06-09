window.Utils = {
  money: v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0),

  fmtDate: iso => {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('pt-BR');
  },

  isoToday: () => new Date().toISOString().slice(0, 10),

  parseDate: str => {
    if (!str) return null;
    if (str.length === 10) return new Date(str + 'T12:00:00');
    return new Date(str);
  },

  addMonths: (isoDate, n) => {
    const d = new Date(isoDate + 'T12:00:00');
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  },

  monthKey: (isoDate) => isoDate ? isoDate.slice(0, 7) : '',

  currentMonthKey: () => new Date().toISOString().slice(0, 7),

  monthLabel: (key) => {
    const [y, m] = key.split('-');
    const d = new Date(+y, +m - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  },

  checkOverdue: (tx) => {
    if (tx.type !== 'expense') return tx.status || 'paid';
    if (tx.status === 'paid') return 'paid';
    if (!tx.dueDate) return tx.status || 'pending';
    const due = new Date(tx.dueDate + 'T23:59:59');
    const today = new Date();
    if (today > due) return 'overdue';
    return tx.status || 'pending';
  },

  catLabel: cat => ({
    alimentacao: 'Alimentação', moradia: 'Moradia', transporte: 'Transporte',
    saude: 'Saúde', educacao: 'Educação', lazer: 'Lazer', vestuario: 'Vestuário',
    assinatura: 'Assinatura', investimento: 'Investimento', outros: 'Outros'
  }[cat] || cat || 'Outros'),

  uid: () => 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2)
};
