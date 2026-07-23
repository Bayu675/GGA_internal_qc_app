# Dokumentasi Sistem Manajemen QC Barang Return

## 📌 Deskripsi Singkat

Aplikasi web internal (*Warehouse QC Tools*) untuk manajemen Quality Control (QC) barang return yang mengubah proses manual menjadi sistem digital terpusat.

Sistem kini tidak hanya menangani proses inspeksi barang, tetapi juga mengintegrasikan proses penarikan data Sales Order (SO), pencetakan Barcode Label, inspeksi QC, hingga pengambilan keputusan tindak lanjut barang menggunakan konsep **Closed-Loop Barcode Workflow**.

Aplikasi beroperasi menggunakan arsitektur **Microservice** dan terintegrasi dengan **VFP ETL Service (Port 3001)** untuk sinkronisasi data master secara real-time.

---

# 🛠 Tech Stack

| Komponen          | Teknologi                          |
| ----------------- | ---------------------------------- |
| Framework         | Next.js 15 (App Router)            |
| Language          | TypeScript (Strict Mode)           |
| Styling           | Tailwind CSS                       |
| Database          | SQLite                             |
| ORM               | Prisma ORM                         |
| Excel Processor   | SheetJS (`xlsx`)                   |
| Barcode Generator | JsBarcode                          |
| Barcode Scanner   | html5-qrcode                       |
| Process Manager   | PM2                                |
| HTTPS Tunnel      | Ngrok                              |
| Backend ETL       | PostgreSQL ETL Service (Port 3001) |

### Catatan

Ngrok digunakan untuk menyediakan koneksi HTTPS yang diwajibkan browser agar fitur:

* Kamera QC
* Barcode Scanner
* Upload Foto

dapat berjalan dengan baik pada perangkat mobile.

---

# 🚀 Arsitektur Sistem (Microservice)

Sistem menggunakan pendekatan Microservice untuk memisahkan aplikasi QC dengan layanan sinkronisasi data ERP/VFP.

### Diagram Arsitektur

```text
                INTERNET
                    │
                    │
               HTTPS (Ngrok)
                    │
                    ▼
            [HP Staf Gudang]
                    │
                    ▼
        [Next.js App - Port 3000]
                    │
                    │ Fetch API
                    ▼
       [VFP ETL Service - Port 3001]
                    │
                    ▼
         [PostgreSQL VFP Database]
```

### Catatan Penting

* Hanya Port `3000` yang di-expose ke internet melalui Ngrok.
* Port `3001` hanya dapat diakses melalui `localhost`.
* Database PostgreSQL tidak pernah diakses langsung oleh client.
* Seluruh komunikasi database dilakukan melalui ETL Service.

Hal ini membuat arsitektur lebih aman dan mudah dikembangkan di kemudian hari.

---

# 🔄 Closed-Loop Barcode Workflow

Sistem menggunakan Barcode 1D (CODE128) sebagai identitas unik barang selama proses QC.

### Alur Sistem

```text
Tarik Data SO
       │
       ▼
Cetak Barcode Label
       │
       ▼
Tempel Barcode di Barang
       │
       ▼
QC Barang
       │
       ▼
Simpan Hasil QC
       │
       ▼
Scan Barcode
       │
       ▼
Tentukan Resolution
       │
       ▼
Export Report
       │
       ▼
      Selesai
```

### Barcode Generator

Menggunakan:

```text
JsBarcode
```

Barcode akan dibuat secara otomatis berdasarkan:

```text
Nomor Sales Order (SO)
```

### Barcode Scanner

Menggunakan:

```text
html5-qrcode
```

dengan dukungan:

* Hardware Acceleration
* Native Barcode Detector API
* Kamera HP Android
* Kamera Laptop/Desktop

### Auto Filtering

Hasil Barcode Scan akan:

```text
Barcode Scan
      ↓
Nomor SO
      ↓
Debounced Search
      ↓
Dashboard Filter
      ↓
Menampilkan 1 Data Barang
```

---

# 🚀 Fitur Utama

## 1. Tarik Data Sales Order (API ETL)

### Tujuan

Mengambil data master barang return secara otomatis dari sistem ERP/VFP.

### Fitur

* Input Nomor SO
* Sinkronisasi data melalui API
* Diagnostik koneksi API
* Validasi endpoint ETL
* Penarikan data secara real-time

### Arsitektur

```text
Next.js
   ↓
Fetch API
   ↓
ETL Service
   ↓
PostgreSQL
   ↓
ReturnItem
```

---

## 2. Dashboard Interaktif

Dashboard dirancang untuk mendukung penggunaan Desktop maupun Mobile.

### Fitur Dashboard

#### Filter Status

* PENDING
* GOOD
* BAD
* PARTIAL_GOOD

#### Filter Resolution

* DIJUAL_KEMBALI
* SCRAP

#### Search

Pencarian berdasarkan:

* Nomor SO
* Nama Barang
* Customer
* Nama Toko

#### Advanced Filtering

Filter berdasarkan:

* Toko
* Status QC
* Resolution
* Rentang Tanggal

#### Debounced Search

Sistem menggunakan delay:

```text
500 ms
```

untuk:

* Mengurangi over-fetching database.
* Meningkatkan performa SQLite.
* Memberikan pengalaman pencarian yang lebih responsif.

#### Bulk Delete

Digunakan untuk:

* Membersihkan data salah import.
* Menghapus data secara massal.

---

## 3. Form QC & Kamera Browser

### Teknologi

```javascript
navigator.mediaDevices.getUserMedia()
```

### Fitur

#### Foto Barang Utama

Digunakan untuk:

* Foto keseluruhan barang.
* Dokumentasi kondisi fisik.

#### Logika Kondisional

Jika status dipilih:

```text
BAD
```

atau

```text
PARTIAL_GOOD
```

maka sistem akan menampilkan:

* Upload foto kerusakan
* Multi-photo support
* Damage Notes

### Penyimpanan Foto

```text
Camera
   ↓
Base64
   ↓
Convert JPG
   ↓
public/uploads/
```

Seluruh foto akan disimpan sebagai file `.jpg` pada server lokal.

---

## 4. Barcode Scanner

Scanner dapat digunakan melalui:

* HP Android
* Laptop
* Desktop dengan Webcam

### Workflow

```text
Scan Barcode
      ↓
Nomor SO
      ↓
Dashboard Search
      ↓
Menampilkan Data Barang
      ↓
Input Resolution
      ↓
Simpan
```

### Keuntungan

* Mempercepat pencarian data.
* Mengurangi human error.
* Memudahkan operasional gudang.

---

## 5. Thermal Label Printing

Ukuran label:

```text
80 x 50 mm
```

Informasi yang dicetak:

* Nomor SO
* Informasi Barang
* Barcode CODE128

### Workflow

```text
Generate Barcode
       ↓
Print Label
       ↓
Tempel pada Barang
       ↓
Digunakan untuk QC
       ↓
Digunakan untuk Resolution
```

---

## 6. Resolution Management

Fitur terbaru yang digunakan untuk menentukan keputusan akhir barang.

### Resolution Status

| Status         | Keterangan                     |
| -------------- | ------------------------------ |
| (Kosong)       | Menunggu keputusan             |
| DIJUAL_KEMBALI | Barang kembali masuk stok jual |
| SCRAP          | Barang dimusnahkan / dibuang   |

### Workflow

```text
QC Selesai
      ↓
Scan Barcode
      ↓
Buka Detail Barang
      ↓
Pilih Resolution
      ↓
Simpan
```

---

## 7. Export Report (Enterprise)

Laporan Excel dapat dibuat secara spesifik berdasarkan:

* Nama Toko
* Rentang Tanggal
* Status QC
* Resolution

### Workflow

```text
Filter Dashboard
       ↓
Generate Excel
       ↓
Server Action
       ↓
Translate Status
       ↓
Download Excel
```

### Terjemahan Status

Status database:

```text
DIJUAL_KEMBALI
```

akan diterjemahkan menjadi:

```text
Dijual Kembali
```

agar lebih mudah dibaca oleh pihak Management.

---

# 🗄 Struktur Database

Sistem menggunakan relasi:

```text
ReturnItem (1)
        │
        ▼
   QCResult (1)
```

---

## Model : ReturnItem

Digunakan untuk menyimpan data master hasil sinkronisasi API ETL.

### Fields

| Field        | Keterangan     |
| ------------ | -------------- |
| id           | Primary Key    |
| soNumber     | Nomor SO       |
| customerName | Nama Customer  |
| itemCode     | Kode Barang    |
| itemName     | Nama Barang    |
| width        | Lebar          |
| height       | Tinggi         |
| qtyOrder     | Quantity Order |
| qcStatus     | Status QC      |

---

## Model : QCResult

Digunakan untuk menyimpan hasil inspeksi QC dan keputusan akhir barang.

| Field           | Tipe Data | Keterangan                |
| --------------- | --------- | ------------------------- |
| returnItemId    | String    | Foreign Key               |
| finalStatus     | String    | GOOD / BAD / PARTIAL_GOOD |
| generalPhotoUrl | String    | Foto Barang               |
| damagePhotoUrl  | String?   | Foto Kerusakan            |
| damageNotes     | String?   | Catatan Kerusakan         |
| resolution      | String?   | DIJUAL_KEMBALI / SCRAP    |
| processedAt     | DateTime  | Waktu QC Selesai          |

---

# 📷 Penyimpanan Foto

Lokasi penyimpanan:

```text
public/uploads/
```

### Smart Storage Cleanup

Apabila foto:

* Diganti
* Dihapus

maka sistem akan otomatis menjalankan:

```javascript
fs.unlink()
```

untuk:

* Menghapus file lama.
* Mencegah file orphan.
* Menghemat storage server.

---

# 💻 Panduan Deployment

## Instalasi Awal

### Update Source Code

```bash
git pull origin main
```

### Install Dependencies

```bash
npm install
```

### Sinkronisasi Database

```bash
npx prisma db push
```

---

## Build Production

```bash
npm run build
```

---

## Jalankan dengan PM2

```bash
pm2 start npm --name "return-qc-app" -- start
```

### Simpan Konfigurasi PM2

```bash
pm2 save
pm2 startup
```

---

# 🔄 Update Schema Database

Apabila terdapat perubahan struktur database, wajib menjalankan:

```bash
git pull origin main
npm install
npx prisma db push
npm run build
pm2 restart return-qc-app
```

> **Catatan:** Penambahan field `resolution` pada model `QCResult` mewajibkan sinkronisasi schema menggunakan `npx prisma db push`.

---

# 🌐 Expose ke Internet

Jalankan:

```bash
ngrok http 3000
```

Contoh:

```text
https://abc123.ngrok-free.app
```

Browser mewajibkan HTTPS untuk menjalankan:

* Kamera QC
* Barcode Scanner
* Upload Foto

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
│
├── app/
├── actions/
├── components/
├── lib/
│
├── dev.db
├── package.json
├── README.md
└── dokumentasi.md
```

---

# 📋 Alur Sistem (End-to-End)

```text
Tarik Data SO
      │
      ▼
Sinkronisasi API ETL
      │
      ▼
Dashboard QC
      │
      ▼
Cetak Barcode Label
      │
      ▼
QC Barang
      │
      ▼
Simpan Hasil QC
      │
      ▼
Scan Barcode
      │
      ▼
Tentukan Resolution
      │
      ▼
Export Report Excel
      │
      ▼
      Selesai
```

---

# 🎯 Single Source of Truth

Dokumen ini merupakan referensi utama (*Single Source of Truth*) untuk:

* Arsitektur Sistem
* Integrasi API ETL
* Struktur Database
* Workflow QC
* Closed-Loop Barcode System
* Barcode Scanner
* Resolution Management
* Deployment Server
* Git Workflow
* Pengelolaan File Foto
* Export Report

Seluruh perubahan fitur dan perubahan arsitektur sistem wajib diperbarui pada dokumen ini agar tetap menjadi sumber dokumentasi yang akurat, konsisten, dan terkini.
