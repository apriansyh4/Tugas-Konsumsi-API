# SIPINJAM — Frontend Praktikum API

Halaman web (HTML + Bootstrap 5 + JavaScript fetch) untuk API `https://api.melangkah.my.id`.

| Halaman | Fitur | Endpoint |
|---|---|---|
| `index.html` | Dashboard ringkasan | read semua modul |
| `asset.html` | **CRUD** Master Asset | `asset/read, detail, create, update, delete` |
| `mahasiswa.html` | **CRUD** Master Mahasiswa | `mahasiswa/read, detail, create, update, delete` |
| `peminjaman.html` | **CR** Transaksi Peminjaman | `peminjaman/read, detail, create` |

## Struktur
```
peminjaman-web/
├── index.html
├── asset.html
├── mahasiswa.html
├── peminjaman.html
├── css/style.css
└── js/app.js      ← BASE_URL & helper bersama
```

## Cara menjalankan
Jalankan lewat web server lokal (jangan dobel klik file), misalnya:
- XAMPP: copy folder ke `htdocs/`, buka `http://localhost/peminjaman-web/`
- VS Code: ekstensi **Live Server** → klik kanan `index.html` → *Open with Live Server*
- Python: `python -m http.server 8000` lalu buka `http://localhost:8000`

Ganti alamat API di `js/app.js` bagian `const BASE_URL` bila perlu.

## Jika data tidak muncul (CORS)
Bila console browser menampilkan error **CORS**, di sisi API (file PHP) perlu header:
```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
```

## Template
Tampilan admin dashboard (sidebar + topbar + card + modal) dibangun dengan
[Bootstrap 5.3](https://getbootstrap.com) dan [Bootstrap Icons](https://icons.getbootstrap.com),
terinspirasi dari template gratis seperti *AdminLTE* / *SB Admin*.
