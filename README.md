# Return QC Management System

Sistem manajemen Quality Control (QC) barang return berbasis web yang dirancang untuk menggantikan proses manual pengecekan barang, dokumentasi foto, dan pencatatan hasil inspeksi menjadi satu platform terpusat.

Kini dilengkapi dengan **Ekosistem Barcode Tertutup (Closed-loop)** dan **Integrasi API VFP (Postgres ETL)** untuk mempercepat operasional gudang mulai dari penarikan data SO, inspeksi QC, pencetakan barcode, hingga eksekusi tindak lanjut barang.

---

## ✨ Fitur Utama

### Fitur Terbaru

* **[NEW]** Integrasi API Tarik SO Otomatis dari Server VFP (Postgres ETL)
* **[NEW]** Barcode Scanner In-App menggunakan kamera HP (`html5-qrcode`)
* **[NEW]** Print Thermal Label 80x50mm dengan Barcode CODE128
* **[NEW]** Status Tindak Lanjut Barang (`DIJUAL_KEMBALI` & `SCRAP`)
* **[NEW]** Advanced Filter Dashboard (Dropdown Toko & Real-time Search)
* **[NEW]** Export Excel Dinamis berdasarkan Toko & Rentang Tanggal
* **[NEW]** Fitur Diagnostik & Cek Koneksi API ETL pada halaman Tarik SO

### Fitur Existing

* Import data master dari file Excel
* Dashboard responsif (Desktop & Mobile)
* Pencarian data secara real-time
* Filter data berdasarkan Status QC
* Bulk delete data
* Kamera QC langsung dari browser HP
* Multi-photo untuk barang rusak/minus
* Catatan kerusakan (*Damage Notes*)
* Edit data master dan hasil QC
* Auto cleanup file foto yang tidak digunakan
* Export laporan hasil QC ke Excel
* Print Thermal Label 80x50mm untuk pendataan barang

---

## 🏗 Tech Stack

* Next.js 15 (App Router)
* TypeScript (Strict Mode)
* Tailwind CSS
* Prisma ORM
* SQLite Database
* SheetJS (xlsx)
* html5-qrcode
* JsBarcode
* PM2
* Ngrok

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd return-qc-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npx prisma db push
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan pada:

```text
http://localhost:3000
```

---

## ⚙ Persyaratan Integrasi API ETL

Untuk menggunakan fitur **Tarik Data Sales Order (SO)**, pastikan Backend ETL telah berjalan pada:

```text
http://localhost:3001
```

> Aplikasi Return QC bertindak sebagai **Client** yang menarik data dari Microservice ETL tersebut.

Pastikan:

* Backend ETL telah aktif.
* Port `3001` dapat diakses.
* Endpoint API ETL berjalan dengan baik.
* Status koneksi dapat dicek melalui fitur diagnostik pada halaman Tarik SO.

---

## 🚀 Production Deployment

### Build Application

```bash
npm run build
```

### Run with PM2

```bash
pm2 start npm --name "return-qc-app" -- start
```

### Save PM2 Configuration

```bash
pm2 save
pm2 startup
```

---

## 🌐 Akses dari HP (Camera Support)

Browser hanya mengizinkan akses kamera melalui koneksi HTTPS.

Jalankan Ngrok:

```bash
ngrok http 3000
```

Kemudian bagikan URL HTTPS yang dihasilkan kepada staf gudang.

Contoh:

```text
https://abc123.ngrok-free.app
```

Fitur yang membutuhkan akses kamera:

* Kamera QC Barang
* Barcode Scanner
* Upload Foto Kerusakan

---

## 📂 Struktur Folder

```text
.
├── app/
├── actions/
├── components/
├── lib/
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/
├── dev.db
├── package.json
└── README.md
```

---

## 🔄 Workflow Penggunaan (Closed-Loop)

### 1. Tarik Data Sales Order

Staf melakukan:

* Input Nomor Sales Order
* Menarik data dari ERP/VFP melalui API ETL
* Melakukan validasi data barang return

### 2. Cetak Barcode Label

Staf mencetak Thermal Label berukuran `80x50mm` yang berisi:

* Nomor SO
* Informasi barang
* Barcode CODE128

Label kemudian ditempelkan pada barang fisik.

### 3. QC Barang

Staf melakukan:

* Foto barang
* Menentukan Status QC
* Menambahkan foto kerusakan
* Menambahkan catatan kerusakan (*Damage Notes*)

Status QC yang tersedia:

* `PENDING`
* `GOOD`
* `BAD`
* `PARTIAL_GOOD`

### 4. Simpan Hasil QC

Sistem akan:

* Menyimpan data ke database
* Menyimpan foto ke storage lokal
* Membersihkan file foto lama secara otomatis apabila diganti atau dihapus

### 5. Eksekusi Tindak Lanjut

Setelah QC selesai, atasan dapat menentukan tindak lanjut barang.

Pilihan yang tersedia:

| Resolution     | Keterangan                     |
| -------------- | ------------------------------ |
| (Kosong)       | Menunggu keputusan             |
| DIJUAL_KEMBALI | Barang kembali masuk stok jual |
| SCRAP          | Barang dimusnahkan / dibuang   |

Proses dilakukan dengan:

* Scan Barcode menggunakan HP
* Membuka detail barang
* Menentukan status tindak lanjut

### 6. Reporting

Laporan dapat diexport ke Excel berdasarkan:

* Toko
* Rentang Tanggal
* Status QC
* Status Resolution

---

## 📊 Mapping Status Sistem

### Status QC

| Status       | Keterangan            |
| ------------ | --------------------- |
| PENDING      | Belum dicek fisik     |
| GOOD         | Barang sesuai         |
| BAD          | Barang rusak          |
| PARTIAL_GOOD | Sebagian barang rusak |

### Status Tindak Lanjut (Resolution)

| Status         | Keterangan                     |
| -------------- | ------------------------------ |
| (Kosong)       | Menunggu keputusan atasan      |
| DIJUAL_KEMBALI | Barang kembali masuk stok jual |
| SCRAP          | Barang dimusnahkan / dibuang   |

---

## 📷 Penyimpanan Foto

Seluruh foto QC disimpan pada:

```text
public/uploads/
```

Sistem akan secara otomatis:

* Menghapus file foto yang sudah tidak digunakan.
* Membersihkan file lama apabila dilakukan penggantian foto.
* Menghindari penumpukan file sampah pada storage.

---

## 🛡 File yang Tidak Boleh Masuk Git

Pastikan file `.gitignore` berisi:

```gitignore
*.db
public/uploads/
.next/
node_modules/
```

---

## 🔄 Update Deployment

Pada server jalankan:

```bash
git pull origin main
npm install
npm run build
pm2 restart return-qc-app
```

---

## 📚 Dokumentasi Lengkap

Dokumentasi teknis lengkap tersedia pada:

```text
dokumentasi.md
```

Dokumen tersebut menjadi **Single Source of Truth** untuk:

* Arsitektur Sistem
* Database Schema
* Integrasi API ETL
* Workflow QC
* Sistem Barcode
* Deployment
* Git Workflow
* Pengelolaan Foto
* Export Report
* Status Resolution Barang

---

## 👨‍💻 Author

**Bayu A.K.A Ryu**
