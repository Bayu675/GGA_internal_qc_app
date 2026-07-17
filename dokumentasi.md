# Dokumentasi Sistem Manajemen QC Barang Return

## 📌 Deskripsi Singkat

Aplikasi web internal (tools) untuk manajemen Quality Control (QC) barang return. Aplikasi ini mengubah proses manual (pengecekan barang, foto via WhatsApp, dan pencatatan keterangan) menjadi sistem digital terpusat.

Data awal di-import dari file Excel, staf gudang melakukan pengecekan fisik menggunakan kamera HP langsung dari browser, dan hasil akhirnya dapat di-export kembali menjadi laporan Excel.

---

# 🛠 Tech Stack

| Komponen | Teknologi |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | Strict TypeScript |
| Styling | Tailwind CSS (Responsive Desktop & Mobile) |
| Database | SQLite (File-based) |
| ORM | Prisma |
| Excel Processor | SheetJS (`xlsx`) |
| Process Manager | PM2 |
| Tunneling | Ngrok |

### Catatan

Ngrok digunakan untuk menyediakan koneksi HTTPS yang diwajibkan browser agar API kamera (`navigator.mediaDevices.getUserMedia`) dapat berjalan di perangkat mobile.

---

# 🚀 Fitur Utama

## 1. Import Data Master (Excel)

### Tujuan
Mengimpor daftar Sales Order (SO) barang return dari file Excel ke database.

### Fitur

- Upload file Excel (`.xlsx`)
- Parsing dilakukan menggunakan **Server Actions Next.js**
- Menghindari beban parsing di browser client
- Menghindari konflik Webpack saat memproses file Excel
- Data otomatis disimpan ke database
- Status awal otomatis:

```text
PENDING
```

---

## 2. Dashboard Interaktif (Responsive)

### Desktop View

Menggunakan tampilan tabel (table view) standar.

### Mobile View

Tabel otomatis berubah menjadi card view agar lebih nyaman digunakan pada layar HP dan menghindari horizontal scroll.

### Fitur Dashboard

#### Filter Status

Memisahkan data berdasarkan:

- PENDING (Belum Dicek)
- GOOD
- BAD
- PARTIAL_GOOD

#### Search

Pencarian real-time berdasarkan:

- Nomor SO
- Nama Barang
- Nama Customer

#### Bulk Delete

Fitur hapus massal menggunakan checkbox untuk membersihkan data yang salah import.

---

## 3. Form QC & Custom Web Camera

### Tujuan

Memungkinkan staf gudang melakukan pengecekan langsung dari browser tanpa perlu membuka aplikasi kamera bawaan perangkat.

### Teknologi

```javascript
navigator.mediaDevices.getUserMedia()
```

### Fitur

#### Foto Barang Utama

Mengambil foto keseluruhan kondisi barang.

#### Logika Kondisional

Jika status dipilih:

```text
BAD
```

atau

```text
PARTIAL_GOOD
```

maka sistem akan menampilkan field tambahan:

- Upload foto kerusakan/minus
- Mendukung multi-photo
- Input catatan/keterangan kerusakan

### Penyimpanan Foto

Alur penyimpanan:

```text
Camera
↓
Base64
↓
Convert JPG
↓
public/uploads/
```

Foto disimpan sebagai file fisik `.jpg` pada server lokal.

---

## 4. Fitur Edit Terpusat

### Tujuan

Mengubah data master dan hasil QC dalam satu form.

### Data yang Dapat Diedit

#### Master Data

- Nomor SO
- Customer
- Kode Barang
- Nama Barang
- Ukuran
- Qty

#### Hasil QC

- Status
- Foto Barang
- Foto Kerusakan
- Notes/Keterangan

### Smart Storage Cleanup

Saat foto lama:

- Dihapus
- Diganti

maka sistem otomatis menghapus file fisik lama dari server menggunakan:

```javascript
fs.unlink()
```

### Manfaat

- Menghemat storage
- Mencegah file orphan/sampah menumpuk
- Menjaga performa server

---

## 5. Export Report (Excel)

### Tujuan

Menghasilkan laporan QC lengkap yang menggabungkan data master dan hasil inspeksi.

### Output

File Excel (`.xlsx`) yang berisi:

- Data master barang
- Status QC
- Foto barang
- Foto kerusakan
- Notes/Keterangan minus

### Proses

```text
Master Data
+
QC Result
↓
Generate Excel
↓
Download Otomatis
```

---

# 🗄 Struktur Database (Prisma Schema)

Sistem menggunakan relasi **1-to-1** antara data master hasil import dan data hasil QC.

---

## Model: ReturnItem

Menyimpan data master yang berasal dari file Excel.

### Fields

| Field | Keterangan |
|---------|---------|
| id | Primary Key |
| soNumber | Nomor Sales Order |
| customerName | Nama Customer |
| itemCode | Kode Barang |
| itemName | Nama Barang |
| width | Lebar |
| height | Tinggi |
| qtyOrder | Quantity Order |
| qcStatus | Status QC |

---

## Model: QCResult

Menyimpan hasil pemeriksaan QC.

### Fields

| Field | Keterangan |
|---------|---------|
| returnItemId | Foreign Key ke ReturnItem |
| finalStatus | GOOD / BAD / PARTIAL_GOOD |
| generalPhotoUrl | Path foto keseluruhan barang |
| damagePhotoUrl | JSON Array path foto kerusakan |
| damageNotes | Catatan kerusakan |

### Relasi

```text
ReturnItem (1)
      │
      │
      ▼
QCResult (1)
```

---

# 💻 Panduan Deployment (Local Server)

Aplikasi dijalankan pada laptop server lokal dan diakses melalui internet menggunakan Ngrok.

---

## Instalasi Awal

### 1. Update Source Code

```bash
git pull origin main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Sinkronisasi Database

```bash
npx prisma db push
```

---

## Build & Run (Production)

Wajib dijalankan pada mode production untuk performa terbaik.

### 1. Build Aplikasi

```bash
npm run build
```

### 2. Jalankan dengan PM2

```bash
pm2 start npm --name "return-qc-app" -- start
```

### 3. Simpan Konfigurasi PM2

```bash
pm2 save
pm2 startup
```

---

# 🌐 Expose ke Internet (Akses Kamera HP)

Jalankan Ngrok:

```bash
ngrok http 3000
```

### Catatan Penting

Bagikan URL HTTPS yang dihasilkan Ngrok kepada staf gudang.

API kamera browser (WebRTC) mewajibkan koneksi HTTPS untuk dapat berjalan.

---

# 🔄 Prosedur Update Kode (Git Workflow)

## Tujuan

Memastikan database lokal dan file foto tidak hilang saat deployment update.

### Pastikan `.gitignore` Berisi

```gitignore
*.db
public/uploads/
```

### Workflow Development

#### Di Laptop Development

```bash
git add .
git commit -m "update fitur"
git push origin main
```

#### Di Laptop Server

```bash
git pull origin main
npm install
npm run build
pm2 restart return-qc-app
```

---

# 📂 Struktur Folder Penting

```text
project-root/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│   └── uploads/
│       ├── photo-1.jpg
│       ├── photo-2.jpg
│       └── ...
│
├── app/
│
├── actions/
│
├── lib/
│
├── dev.db
│
└── package.json
```

---

# 📋 Alur Sistem (End-to-End)

```text
Import Excel
      │
      ▼
Database (Status: PENDING)
      │
      ▼
Dashboard QC
      │
      ▼
Foto Barang + Input Status
      │
      ▼
Simpan Hasil QC
      │
      ▼
Foto Tersimpan di Server
      │
      ▼
Export Laporan Excel
      │
      ▼
Selesai
```

---

# 🎯 Single Source of Truth

Dokumen ini merupakan referensi utama (Single Source of Truth) untuk:

- Arsitektur sistem
- Struktur database
- Workflow QC
- Deployment server
- Git workflow
- Pengelolaan file foto
- Export laporan

Setiap perubahan fitur atau perubahan arsitektur wajib diperbarui pada dokumen ini agar tetap menjadi sumber dokumentasi yang akurat dan terkini.