/* =========================================================
 * app.js — helper bersama: API, layout, toast, modal, util
 * ========================================================= */
const BASE_URL = 'https://api.melangkah.my.id';

/* ---------------- API ---------------- */
async function api(path, { method = 'GET', body } = {}) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const res = await fetch(BASE_URL + path, opt);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  const failed = !res.ok || data?.success === false || data?.status === false ||
                 String(data?.status).toLowerCase() === 'error';
  if (failed) {
    const err = new Error(data?.message || data?.pesan || `Request gagal (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Ambil array data dari berbagai bentuk respons (array langsung / {data:[...]} / {records:[...]}) */
function toList(res) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  for (const k of ['data', 'records', 'result', 'results', 'rows', 'items']) {
    if (Array.isArray(res[k])) return res[k];
    if (res[k] && typeof res[k] === 'object') {
      const inner = toList(res[k]);
      if (inner.length) return inner;
    }
  }
  return [];
}

/** Ambil satu objek dari respons detail */
function toItem(res) {
  if (Array.isArray(res)) return res[0] || null;
  if (res && typeof res === 'object') {
    for (const k of ['data', 'record', 'result']) {
      if (Array.isArray(res[k])) return res[k][0] || null;
      if (res[k] && typeof res[k] === 'object') return res[k];
    }
  }
  return res;
}

/** GET list; 404 "data tidak ditemukan" dianggap list kosong */
async function apiList(path) {
  try { return toList(await api(path)); }
  catch (e) { if (e.status === 404) return []; throw e; }
}

function pickId(row, keys) {
  for (const k of keys) if (row?.[k] !== undefined && row[k] !== null) return row[k];
  return '';
}

/* ---------------- Layout ---------------- */
const MENU = [
  { key: 'dashboard',  href: 'index.html',      icon: 'bi-speedometer2',     label: 'Dashboard' },
  { header: 'Master Data' },
  { key: 'asset',      href: 'asset.html',      icon: 'bi-box-seam',         label: 'Master Asset' },
  { key: 'mahasiswa',  href: 'mahasiswa.html',  icon: 'bi-people',           label: 'Master Mahasiswa' },
  { header: 'Transaksi' },
  { key: 'peminjaman', href: 'peminjaman.html', icon: 'bi-arrow-left-right', label: 'Peminjaman' },
];

function renderLayout(active) {
  const menu = MENU.map(m => m.header
    ? `<div class="sidebar-heading">${m.header}</div>`
    : `<a class="nav-link ${m.key === active ? 'active' : ''}" href="${m.href}">
         <i class="bi ${m.icon}"></i><span>${m.label}</span></a>`).join('');

  document.getElementById('sidebar-slot').outerHTML = `
  <aside class="offcanvas-lg offcanvas-start sidebar text-white" tabindex="-1" id="sidebar">
    <div class="offcanvas-header">
      <span class="fw-bold">SIPINJAM</span>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" data-bs-target="#sidebar"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column p-0">
      <a href="index.html" class="brand d-none d-lg-flex">
        <span class="brand-icon"><i class="bi bi-boxes"></i></span>
        <span>SIPINJAM<small>Sistem Peminjaman Asset</small></span>
      </a>
      <nav class="nav flex-column px-3 py-2">${menu}</nav>
      <div class="mt-auto p-3 small text-white-50">API: ${BASE_URL.replace('https://', '')}</div>
    </div>
  </aside>`;

  const current = MENU.find(m => m.key === active);
  document.getElementById('topbar-slot').outerHTML = `
  <nav class="topbar navbar bg-white border-bottom px-3 sticky-top">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-light d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#sidebar"><i class="bi bi-list"></i></button>
      <span class="text-muted small d-none d-sm-inline">SIPINJAM /</span>
      <span class="fw-semibold">${current ? current.label : ''}</span>
    </div>
    <div class="d-flex align-items-center gap-2">
      <span class="small text-muted d-none d-md-inline">Admin</span>
      <span class="avatar"><i class="bi bi-person-fill"></i></span>
    </div>
  </nav>`;

  if (!document.getElementById('toast-area')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div id="toast-area" class="toast-container position-fixed top-0 end-0 p-3"></div>');
  }
}

/* ---------------- UI helpers ---------------- */
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(message, type = 'success') {
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-x-circle-fill' : 'bi-info-circle-fill';
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icon} me-2"></i>${esc(message)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById('toast-area').appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  t.show();
}

function statusBadge(v) {
  if (v === undefined || v === null || v === '') return '<span class="text-muted">-</span>';
  const s = String(v).toLowerCase();
  let c = 'secondary';
  if (['tersedia', 'baik', 'dikembalikan', 'selesai', 'disetujui', 'aktif'].includes(s)) c = 'success';
  else if (['pending', 'menunggu', 'rusak ringan', 'perbaikan'].includes(s)) c = 'warning';
  else if (['dipinjam', 'diproses'].includes(s)) c = 'primary';
  else if (['rusak', 'rusak berat', 'ditolak', 'tidak tersedia', 'hilang', 'terlambat'].includes(s)) c = 'danger';
  return `<span class="badge rounded-pill text-bg-${c}">${esc(v)}</span>`;
}

function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
  if (isNaN(dt)) return esc(d);
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function setTableState(tbody, cols, type, msg = '') {
  const html = {
    loading: `<div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat data...`,
    empty:   `<i class="bi bi-inbox fs-3 d-block mb-1"></i>${msg || 'Belum ada data'}`,
    error:   `<i class="bi bi-exclamation-triangle fs-3 d-block mb-1 text-danger"></i>
              <span class="text-danger">${esc(msg)}</span>
              <div class="small mt-1">Cek koneksi atau CORS API (lihat README).</div>`,
  }[type];
  tbody.innerHTML = `<tr><td colspan="${cols}" class="text-center text-muted py-5">${html}</td></tr>`;
}

function filterRows(rows, q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
}

/** Isi form dari objek; select otomatis ditambah opsi jika nilainya belum ada */
function fillForm(form, data = {}) {
  form.reset();
  form.classList.remove('was-validated');
  [...form.elements].forEach(el => {
    if (!el.name || data[el.name] === undefined || data[el.name] === null) return;
    const val = String(data[el.name]);
    if (el.tagName === 'SELECT' && val && ![...el.options].some(o => o.value === val)) {
      el.add(new Option(val, val));
    }
    el.value = el.type === 'date' ? val.slice(0, 10) : val;
  });
}

/** Ambil isi form sebagai objek JSON; input number dikonversi ke Number */
function readForm(form) {
  const obj = {};
  [...form.elements].forEach(el => {
    if (!el.name || el.disabled) return;
    let v = el.value.trim();
    if (v === '') return;
    if (el.type === 'number' || el.dataset.type === 'number') v = Number(v);
    obj[el.name] = v;
  });
  return obj;
}

function setBusy(btn, busy, text) {
  if (busy) {
    btn.dataset.html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${text || 'Menyimpan...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.html || btn.innerHTML;
  }
}

/** Modal konfirmasi; resolve true/false */
function confirmDialog(message, okText = 'Ya, Hapus') {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'modal fade';
    el.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content border-0">
      <div class="modal-body text-center p-4">
        <i class="bi bi-exclamation-triangle-fill text-danger display-5"></i>
        <p class="mt-3 mb-0">${esc(message)}</p>
      </div>
      <div class="modal-footer border-0 justify-content-center pt-0">
        <button class="btn btn-light" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-danger" data-ok>${okText}</button>
      </div></div></div>`;
    document.body.appendChild(el);
    const m = new bootstrap.Modal(el);
    let ok = false;
    el.querySelector('[data-ok]').onclick = () => { ok = true; m.hide(); };
    el.addEventListener('hidden.bs.modal', () => { el.remove(); resolve(ok); });
    m.show();
  });
}

/** Modal detail key-value */
function showDetail(title, obj, labels = {}, formatters = {}) {
  const keys = [...Object.keys(labels), ...Object.keys(obj || {}).filter(k => !(k in labels))];
  const rows = keys.filter(k => obj && obj[k] !== undefined).map(k => {
    const val = formatters[k] ? formatters[k](obj[k]) : esc(obj[k] === '' || obj[k] === null ? '-' : obj[k]);
    return `<tr><th class="text-muted fw-normal w-40">${esc(labels[k] || k)}</th><td>${val}</td></tr>`;
  }).join('');
  const el = document.createElement('div');
  el.className = 'modal fade';
  el.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content border-0">
    <div class="modal-header"><h5 class="modal-title"><i class="bi bi-info-circle me-2"></i>${esc(title)}</h5>
      <button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body p-0"><table class="table mb-0 detail-table">${rows || '<tr><td class="text-center text-muted p-4">Data tidak ditemukan</td></tr>'}</table></div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button></div>
  </div></div>`;
  document.body.appendChild(el);
  const m = new bootstrap.Modal(el);
  el.addEventListener('hidden.bs.modal', () => el.remove());
  m.show();
}
