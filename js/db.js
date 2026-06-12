// DB — Firebase Firestore with localStorage fallback
window.DB = (() => {
  let db = null;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      db = firebase.firestore();
    }
  } catch(e) { db = null; }

  const COLS = {
    transactions: 'transactions',
    goals: 'goals',
    patrimony: 'patrimony'
  };

  // LS helpers
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch(e){ return d; } };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // listeners registry
  const listeners = {};

  function on(col, cb) {
    if (!listeners[col]) listeners[col] = [];
    listeners[col].push(cb);
    if (db) {
      db.collection(col).onSnapshot(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        lsSet(col, docs);
        (listeners[col] || []).forEach(fn => fn(docs));
      });
    } else {
      cb(lsGet(col, []));
    }
  }

  async function getAll(col) {
    if (db) {
      try {
        const snap = await db.collection(col).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e) {}
    }
    return lsGet(col, []);
  }

  async function add(col, data) {
    const doc = { ...data, createdAt: new Date().toISOString() };
    if (db) {
      try {
        const ref = await db.collection(col).add(doc);
        doc.id = ref.id;
        return doc;
      } catch(e) {}
    }
    const all = lsGet(col, []);
    doc.id = 'ls_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    all.push(doc);
    lsSet(col, all);
    _notify(col, all);
    return doc;
  }

  async function update(col, id, data) {
    if (db) {
      try {
        await db.collection(col).doc(id).update(data);
        return;
      } catch(e) {}
    }
    const all = lsGet(col, []);
    const idx = all.findIndex(x => x.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...data }; lsSet(col, all); _notify(col, all); }
  }

  async function remove(col, id) {
    if (db) {
      try { await db.collection(col).doc(id).delete(); return; } catch(e) {}
    }
    const all = lsGet(col, []).filter(x => x.id !== id);
    lsSet(col, all);
    _notify(col, all);
  }

  function _notify(col, docs) {
    (listeners[col] || []).forEach(fn => fn(docs));
  }

  async function exportAll() {
    const [t, g, p] = await Promise.all([getAll('transactions'), getAll('goals'), getAll('patrimony')]);
    return { transactions: t, goals: g, patrimony: p, exportedAt: new Date().toISOString() };
  }

  async function importAll(data) {
    for (const col of ['transactions','goals','patrimony']) {
      if (!Array.isArray(data[col])) continue;
      if (db) {
        const batch = db.batch();
        data[col].forEach(item => {
          const { id, ...rest } = item;
          const ref = id ? db.collection(col).doc(id) : db.collection(col).doc();
          batch.set(ref, rest);
        });
        try { await batch.commit(); } catch(e) {}
      } else {
        lsSet(col, data[col]);
        _notify(col, data[col]);
      }
    }
  }

  return { on, getAll, add, update, remove, exportAll, importAll, COLS };
})();
