# Depo Bulucu — PWA Kurulum & Dağıtım Rehberi

## Dosya Yapısı
```
warehouse-pwa/
├── index.html      ← Uygulamanın tamamı (HTML + CSS + JS)
├── manifest.json   ← PWA manifest (ad, ikon, renkler)
├── sw.js           ← Service Worker (çevrimdışı önbellek)
├── icons/
│   ├── icon-192.png   ← 192×192 uygulama ikonu
│   └── icon-512.png   ← 512×512 uygulama ikonu
└── README.md
```

---

## 1. İkon Oluşturma (Ücretsiz)

[https://favicon.io/favicon-generator/](https://favicon.io/favicon-generator/) adresine gidin:
- Metin: `DB` veya 🏭
- Arka plan: `#0f172a` (koyu lacivert)
- Renk: `#f59e0b` (amber)
- `icons/` klasörüne `icon-192.png` ve `icon-512.png` olarak kaydedin

---

## 2. Vercel'e Deploy (Önerilen — Ücretsiz)

### A. GitHub reposu oluşturun
```bash
# Tüm dosyaları bir klasöre koyun
git init
git add .
git commit -m "Depo Bulucu PWA v1.0"
git remote add origin https://github.com/KULLANICI/depo-bulucu.git
git push -u origin main
```

### B. Vercel'e bağlayın
1. [vercel.com](https://vercel.com) → "Sign up" (GitHub ile)
2. "New Project" → GitHub reponuzu seçin
3. Framework: **Other** (plain HTML)
4. "Deploy" — bitti! ✓

📌 URL: `https://depo-bulucu.vercel.app`

### C. PWA için HTTPS zorunluluğu
Vercel otomatik HTTPS sağlar. Service Worker yalnızca HTTPS'te çalışır.

---

## 3. GitHub Pages'e Deploy (Alternatif)

1. GitHub reposu → Settings → Pages
2. Source: `main` branch / `/ (root)`
3. Save → `https://KULLANICI.github.io/depo-bulucu/`

⚠️ **Önemli**: `manifest.json` içindeki `start_url` ve `sw.js` içindeki `PRECACHE_URLS`'i
GitHub Pages subdirectory'sine göre güncelleyin:
```javascript
// sw.js içinde
const PRECACHE_URLS = [
  '/depo-bulucu/',
  '/depo-bulucu/index.html',
  ...
];
```

---

## 4. iPhone'a Kurma

1. **Safari** ile URL'yi açın (Chrome/Firefox çalışmaz!)
2. Alt çubuktaki **Paylaş** (⎋) butonuna dokunun
3. "**Ana Ekrana Ekle**" seçin
4. "Ekle" — uygulama ana ekranda görünür

Artık internet olmadan da çalışır. Veriler IndexedDB'de saklanır.

---

## 5. Excel Dosyası Formatı

Uygulama şu sütunları otomatik tanır:

| Sütun | Alternatif Adlar |
|-------|-----------------|
| `Material` | material, malzeme, code, kod |
| `Material Description` | description, açıklama, tanım |
| `Storage Bin` | storage bin, bin, raf, konum |
| `Unrestricted` | unrestricted, stok, miktar |
| `Base Unit of Measure` | base unit, birim, unit |

> SAP MB52 / LX26 raporu doğrudan desteklenir.

---

## 6. Veri Güncelleme

İşçi SAP'tan yeni Excel çektikçe:
1. Uygulamayı açsın
2. "Excel veya CSV Seç" butonuna bassın
3. Yeni dosyayı seçsin → Eski veri silinir, yeni veri yüklenir

---

## 7. Teknik Detaylar

| Özellik | Değer |
|---------|-------|
| Veri Depolama | IndexedDB (Dexie.js) |
| Excel Parse | SheetJS v0.18.5 |
| Offline | Service Worker (Cache-First) |
| Font | Barlow + JetBrains Mono |
| Tarayıcı Desteği | iOS Safari 14+, Chrome 80+ |
| Veri Limiti | ~100,000+ kayıt (IndexedDB) |
