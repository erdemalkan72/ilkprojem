// Saf istatistik fonksiyonları — DOM'a bağımlı değil, test edilebilir.
(function (root) {
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const mean = (a) => (a.length ? sum(a) / a.length : NaN);

  function median(a) {
    if (!a.length) return NaN;
    const s = [...a].sort((p, q) => p - q);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // Örneklem standart sapması (n-1)
  function stdev(a) {
    if (a.length < 2) return NaN;
    const m = mean(a);
    return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / (a.length - 1));
  }

  // En küçük kareler doğrusal regresyon: y = slope * x + intercept
  function linearRegression(points) {
    const n = points.length;
    if (n < 2) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const mx = mean(xs), my = mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (const p of points) {
      sxy += (p.x - mx) * (p.y - my);
      sxx += (p.x - mx) ** 2;
      syy += (p.y - my) ** 2;
    }
    if (sxx === 0) return null; // tüm x'ler aynı → eğim tanımsız
    const slope = sxy / sxx;
    const intercept = my - slope * mx;
    const r = syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy);
    return { slope, intercept, r, r2: Number.isNaN(r) ? NaN : r * r };
  }

  // "x,y" / "x;y" / "x<tab>y" satırlarını ayrıştırır; başlık ve hatalı satırları atlar.
  function parseCSV(text) {
    const points = [];
    let skipped = 0;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const parts = line.split(/[;\t,]\s*|\s+/).filter(Boolean);
      const x = Number(parts[0]), y = Number(parts[1]);
      if (parts.length >= 2 && Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
      else skipped++;
    }
    return { points, skipped };
  }

  const api = { sum, mean, median, stdev, linearRegression, parseCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Stats = api;
})(this);
