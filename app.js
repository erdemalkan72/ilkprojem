// Veri Laboratuvarı — arayüz mantığı
const $ = (s) => document.querySelector(s);
const STORE_KEY = 'veri-lab-v1';

const SAMPLES = {
  study: { xName: 'Çalışma saati', yName: 'Sınav notu',
    pts: [[1, 42], [2, 48], [2.5, 55], [3, 53], [4, 61], [4.5, 66], [5, 64], [6, 72], [7, 78], [8, 85], [9, 83], [10, 92]] },
  temp: { xName: 'Sıcaklık (°C)', yName: 'Dondurma satışı',
    pts: [[12, 110], [15, 160], [17, 185], [19, 230], [21, 260], [23, 310], [25, 330], [27, 400], [29, 430], [31, 480], [33, 530]] },
  ads: { xName: 'Reklam bütçesi (bin ₺)', yName: 'Ziyaretçi',
    pts: [[1, 900], [2, 1400], [3, 1700], [4, 2600], [5, 2500], [6, 3300], [7, 3500], [8, 4400], [9, 4300], [10, 5200]] },
};

let state = { points: [], xName: 'X', yName: 'Y', lastPred: null };

// ---- Kalıcılık (tarayıcıda saklanır; başarısız olursa sessizce devam) ----
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.points)) state = { ...state, ...s, lastPred: null };
  } catch {}
}

// ---- Biçimlendirme ----
const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const fmt = (v) => (Number.isFinite(v) ? nf.format(v) : '—');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- Veri işlemleri ----
function addPoints(pts) {
  state.points.push(...pts);
  state.lastPred = null;
  save(); render(pts.length);
}
function removePoint(i) { state.points.splice(i, 1); state.lastPred = null; save(); render(); }

// ---- Render ----
function render(flashCount = 0) {
  renderTable(flashCount);
  renderStats();
  renderChart();
  renderPrediction();
}

function renderTable(flashCount) {
  $('#thX').textContent = state.xName;
  $('#thY').textContent = state.yName;
  $('#predLabel').textContent = state.xName;
  $('#xName').value = state.xName;
  $('#yName').value = state.yName;
  const n = state.points.length;
  $('#emptyMsg').hidden = n > 0;
  $('#dataTable tbody').innerHTML = state.points.map((p, i) =>
    `<tr class="${i >= n - flashCount ? 'flash' : ''}"><td>${i + 1}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td>` +
    `<td><button type="button" data-del="${i}" aria-label="${i + 1}. satırı sil">×</button></td></tr>`).join('');
}

function renderStats() {
  const ys = state.points.map((p) => p.y);
  const reg = Stats.linearRegression(state.points);
  const tiles = [
    ['Nokta sayısı', state.points.length],
    [`Ortalama ${state.yName}`, Stats.mean(ys)],
    ['Medyan', Stats.median(ys)],
    ['Std. sapma', Stats.stdev(ys)],
    ['En küçük', ys.length ? Math.min(...ys) : NaN],
    ['En büyük', ys.length ? Math.max(...ys) : NaN],
    ['Korelasyon (r)', reg ? reg.r : NaN],
    ['Uyum (R²)', reg ? reg.r2 : NaN],
  ];
  $('#tiles').innerHTML = tiles.map(([k, v]) =>
    `<div class="tile"><div class="k">${esc(k)}</div><div class="v">${fmt(v)}</div></div>`).join('');
  $('#insight').innerHTML = insightText(reg);
}

function insightText(reg) {
  const n = state.points.length;
  if (n === 0) return 'Sonuç üretmek için veri ekle.';
  if (n < 2) return 'Eğilim hesaplamak için en az <strong>2 nokta</strong> gerekli.';
  if (!reg) return 'Tüm X değerleri aynı; eğilim hesaplanamıyor. Farklı X değerleri ekle.';
  const a = Math.abs(reg.r);
  const strength = a >= 0.8 ? 'güçlü' : a >= 0.5 ? 'orta' : a >= 0.3 ? 'zayıf' : 'çok zayıf / yok';
  const dir = reg.slope > 0 ? 'arttıkça artıyor' : reg.slope < 0 ? 'arttıkça azalıyor' : 'değişmiyor';
  const sign = reg.intercept >= 0 ? '+' : '−';
  let t = `Formül: <strong>${esc(state.yName)} = ${fmt(reg.slope)} × ${esc(state.xName)} ${sign} ${fmt(Math.abs(reg.intercept))}</strong>. ` +
    `${esc(state.xName)} 1 birim arttığında ${esc(state.yName)} ortalama <strong>${fmt(reg.slope)}</strong> değişiyor ` +
    `(${esc(state.yName)}, ${esc(state.xName)} ${dir}; ilişki <strong>${strength}</strong>).`;
  if (n < 5) t += ' Daha güvenilir sonuç için daha fazla veri ekle.';
  return t;
}

function renderPrediction() {
  const out = $('#predOut');
  const reg = Stats.linearRegression(state.points);
  if (state.lastPred == null) { out.innerHTML = reg ? '' : '<span class="muted">Tahmin için en az 2 farklı X değeri gerekli.</span>'; return; }
  if (!reg) { out.innerHTML = '<span class="muted">Tahmin için en az 2 farklı X değeri gerekli.</span>'; return; }
  const x = state.lastPred;
  const y = reg.slope * x + reg.intercept;
  const xs = state.points.map((p) => p.x);
  const outside = x < Math.min(...xs) || x > Math.max(...xs);
  out.innerHTML = `${esc(state.xName)} = ${fmt(x)} için tahmini ${esc(state.yName)}: <span class="big">${fmt(y)}</span>` +
    (outside ? '<br><span class="muted">Not: Bu değer veri aralığının dışında; tahmin daha belirsiz.</span>' : '');
}

// "Güzel" eksen aralıkları
function niceTicks(min, max, count = 5) {
  if (min === max) { min -= 1; max += 1; }
  const step0 = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { lo, hi, ticks };
}

function renderChart() {
  const el = $('#chart');
  const W = el.clientWidth || 600, H = el.clientHeight || 340;
  const m = { t: 12, r: 16, b: 44, l: 56 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const pts = state.points;
  if (!pts.length) {
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><text class="empty" x="${W / 2}" y="${H / 2}" text-anchor="middle">Grafik veri eklendikçe burada belirecek</text></svg>`;
    return;
  }
  const reg = Stats.linearRegression(pts);
  const xsAll = pts.map((p) => p.x), ysAll = pts.map((p) => p.y);
  let predPt = null;
  if (reg && state.lastPred != null) {
    predPt = { x: state.lastPred, y: reg.slope * state.lastPred + reg.intercept };
    xsAll.push(predPt.x); ysAll.push(predPt.y);
  }
  const X = niceTicks(Math.min(...xsAll), Math.max(...xsAll));
  const Y = niceTicks(Math.min(...ysAll), Math.max(...ysAll));
  const sx = (v) => m.l + ((v - X.lo) / (X.hi - X.lo)) * pw;
  const sy = (v) => m.t + ph - ((v - Y.lo) / (Y.hi - Y.lo)) * ph;

  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><clipPath id="clip"><rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/></clipPath></defs>`;
  s += '<g class="grid">' + Y.ticks.map((t) => `<line x1="${m.l}" x2="${m.l + pw}" y1="${sy(t)}" y2="${sy(t)}"/>`).join('') + '</g>';
  s += '<g class="axis">' +
    Y.ticks.map((t) => `<text x="${m.l - 8}" y="${sy(t) + 4}" text-anchor="end">${fmt(t)}</text>`).join('') +
    X.ticks.map((t) => `<text x="${sx(t)}" y="${m.t + ph + 18}" text-anchor="middle">${fmt(t)}</text>`).join('') + '</g>';
  s += `<text class="axis-title" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(state.xName)}</text>`;
  s += `<text class="axis-title" transform="translate(14 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(state.yName)}</text>`;
  if (reg) {
    s += `<line class="fit" x1="${sx(X.lo)}" y1="${sy(reg.slope * X.lo + reg.intercept)}" x2="${sx(X.hi)}" y2="${sy(reg.slope * X.hi + reg.intercept)}" clip-path="url(#clip)"/>`;
  }
  s += pts.map((p, i) => `<circle class="pt" data-i="${i}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="5"/>`).join('');
  if (predPt) s += `<circle class="pred" data-pred="1" cx="${sx(predPt.x)}" cy="${sy(predPt.y)}" r="6"/>`;
  s += '</svg>';
  el.innerHTML = s;
  el._scale = { sx, sy, predPt };
}

// ---- Hover: en yakın noktayı bul (hedef alanı noktadan büyük) ----
function onChartMove(e) {
  const el = $('#chart'), tip = $('#tooltip');
  const svg = el.querySelector('svg');
  if (!svg || !el._scale || !state.points.length) return;
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const mx = ((e.clientX - r.left) / r.width) * vb.width;
  const my = ((e.clientY - r.top) / r.height) * vb.height;
  const { sx, sy, predPt } = el._scale;
  const cands = state.points.map((p, i) => ({ p, i }));
  if (predPt) cands.push({ p: predPt, i: -1 });
  let best = null, bd = 24 ** 2;
  for (const c of cands) {
    const d = (sx(c.p.x) - mx) ** 2 + (sy(c.p.y) - my) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  svg.querySelectorAll('.pt.hot').forEach((n) => n.classList.remove('hot'));
  if (!best) { tip.hidden = true; return; }
  if (best.i >= 0) svg.querySelector(`.pt[data-i="${best.i}"]`)?.classList.add('hot');
  tip.innerHTML = (best.i >= 0 ? `<strong>Nokta ${best.i + 1}</strong>` : '<strong>Tahmin</strong>') +
    `<br>${esc(state.xName)}: ${fmt(best.p.x)}<br>${esc(state.yName)}: ${fmt(best.p.y)}`;
  tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + 'px';
  tip.style.top = (e.clientY + 14) + 'px';
}

// ---- Olaylar ----
$('#addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const x = Number($('#xIn').value), y = Number($('#yIn').value);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  addPoints([{ x, y }]);
  $('#xIn').value = ''; $('#yIn').value = ''; $('#xIn').focus();
});

$('#bulkBtn').addEventListener('click', () => {
  const { points, skipped } = Stats.parseCSV($('#bulkIn').value);
  if (points.length) addPoints(points);
  $('#bulkIn').value = '';
  if (skipped) alert(`${points.length} nokta eklendi, ${skipped} satır okunamadı ve atlandı.`);
});

$('#fileIn').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const { points, skipped } = Stats.parseCSV(await f.text());
  if (points.length) addPoints(points);
  alert(`${points.length} nokta eklendi` + (skipped ? `, ${skipped} satır atlandı.` : '.'));
  e.target.value = '';
});

$('#sampleSel').addEventListener('change', (e) => {
  const smp = SAMPLES[e.target.value];
  if (!smp) return;
  state.points = []; state.xName = smp.xName; state.yName = smp.yName;
  addPoints(smp.pts.map(([x, y]) => ({ x, y })));
  e.target.value = '';
});

$('#clearBtn').addEventListener('click', () => {
  if (state.points.length && !confirm('Tüm veriler silinsin mi?')) return;
  state.points = []; state.lastPred = null; save(); render();
});

$('#dataTable').addEventListener('click', (e) => {
  const b = e.target.closest('[data-del]');
  if (b) removePoint(Number(b.dataset.del));
});

for (const [id, key] of [['#xName', 'xName'], ['#yName', 'yName']]) {
  $(id).addEventListener('input', (e) => {
    state[key] = e.target.value.trim() || key[0].toUpperCase();
    save(); renderStats(); renderChart(); renderPrediction();
    $('#thX').textContent = state.xName; $('#thY').textContent = state.yName; $('#predLabel').textContent = state.xName;
  });
}

$('#predForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const x = Number($('#predIn').value);
  if (!Number.isFinite(x)) return;
  state.lastPred = x; renderChart(); renderPrediction();
});

$('#chart').addEventListener('mousemove', onChartMove);
$('#chart').addEventListener('mouseleave', () => { $('#tooltip').hidden = true; });

$('#themeBtn').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem(STORE_KEY + '-theme', root.dataset.theme); } catch {}
});
try { const t = localStorage.getItem(STORE_KEY + '-theme'); if (t) document.documentElement.dataset.theme = t; } catch {}

let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderChart, 100); });

load();
render();
