# Veri Laboratuvarı

Veri ekledikçe sonuç üreten etkileşimli bir tarayıcı uygulaması.

## Neler yapıyor?

- **Veri girişi:** Tek tek (X, Y) noktası ekleyebilir, CSV yapıştırabilir ya da dosya yükleyebilir veya hazır örnek veri setlerinden birini seçebilirsin.
- **Anlık sonuçlar:** Nokta sayısı, ortalama, medyan, standart sapma, en küçük ve en büyük değer, korelasyon (r) ve uyum (R²).
- **Eğilim çizgisi:** En küçük kareler doğrusal regresyonu. Formül ve ilişkinin gücü Türkçe olarak açıklanır.
- **Tahmin:** Bir X değeri girersen tahmini Y değerini hesaplar ve grafikte gösterir.
- **Etkileşimli grafik:** Noktaların üzerine gelince değerleri gösterir.
- Veriler tarayıcıda saklanır, sayfa yenilense de kaybolmaz. Açık ve koyu tema desteklenir.

## Çalıştırma

Kurulum gerekmez. `index.html` dosyasını tarayıcıda açman yeterli.

## Test

```bash
node tests/stats.test.js
```

## Dosyalar

| Dosya | Görevi |
|---|---|
| `index.html` | Sayfa yapısı |
| `style.css` | Görünüm (açık/koyu tema) |
| `stats.js` | İstatistik ve regresyon hesapları |
| `app.js` | Arayüz, grafik ve etkileşimler |
| `tests/stats.test.js` | Hesaplama testleri |
