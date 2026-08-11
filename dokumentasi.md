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
| UI Management     | React Context (Global UI Provider) |
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

# 🎨 Standar UI & Error Handling

* Aplikasi tidak lagi menggunakan `window.alert()` atau `window.confirm()` bawaan browser.
* Seluruh notifikasi sukses/gagal dan konfirmasi tindakan wajib memanggil hook `useUI()` dari `src/components/UIProvider.tsx` yang akan merender *Toast* atau *Modal* berbasis Tailwind CSS.
* Seluruh interaksi *Server Action* dibungkus dengan *Error Handling* (`try-catch`) komprehensif, sehingga apabila koneksi database terputus atau jaringan bermasalah, state `isPending` akan kembali normal dan *Toast error* ramah pengguna akan muncul tanpa membuat aplikasi *crash*.

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

## 1b. Penanganan Return Berulang (R2, R3)

Sistem memiliki logika untuk mendeteksi barang yang di-return lebih dari satu kali.

### Workflow
```text
Tarik SO -> Cek Database (Berdasarkan SO & Item Code)
      ↓
Jika Ditemukan -> Munculkan Peringatan Konfirmasi
      ↓
Jika OK -> Tambahkan Suffix (Contoh: SO/123 - R2)
      ↓
Simpan ke Database & Tampilkan Badge Peringatan di Dashboard
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

#### Logika Kondisional (Status Barang)

Jika status dipilih **BAD**, sistem akan menampilkan form untuk:

* Upload foto kerusakan (Multi-photo support)
* Damage Notes

Jika status dipilih **PARTIAL_GOOD**, sistem akan mengaktifkan fitur ekstra:

* Input jumlah barang Bagus (Good Qty) dengan validasi minimal 1.
* Kalkulasi otomatis jumlah barang Rusak (Bad Qty) secara *read-only*.
* Form Upload foto kerusakan (untuk bagian yang *bad*).
* Damage Notes.

### Penyimpanan Foto

Sistem menggunakan **Client-Side Image Compression** via HTML5 Canvas sebelum dikirim ke server.

```text
Camera
   ↓
Resize Max 1080px & Compress JPEG 70%
   ↓
Base64 -> Convert JPG
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

Fitur terbaru yang digunakan untuk menentukan keputusan akhir barang, kini dilengkapi dengan kemampuan penanganan barang secara parsial (dibagi).

### Resolution Status

| Status         | Keterangan                                       |
| -------------- | ------------------------------------------------ |
| (Kosong)       | Menunggu keputusan                               |
| DIJUAL_KEMBALI | Seluruh barang kembali masuk stok jual           |
| SCRAP          | Seluruh barang dimusnahkan / dibuang             |
| PARTIAL_SOLD   | Sebagian barang dijual kembali (akumulatif)      |
| PARTIAL_SCRAP  | Sebagian barang dimusnahkan / dibuang (akumulatif)|

### Fitur Partial Resolution (Akumulatif)

Sistem memiliki kecerdasan untuk menangani resolusi barang secara bertahap (*accumulative*).

* User dapat memasukkan jumlah barang yang di-scrap atau dijual kembali secara manual tanpa *auto-fill*.
* Sistem akan secara otomatis melacak dan mengakumulasi riwayat resolusi sebelumnya (contoh: dari 10 barang, 5 dijual hari ini, dan 2 di-scrap keesokan harinya).
* Terdapat validasi ketat yang mencegah total input resolusi melebihi **sisa barang yang belum diresolusi**.

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
| generalPhotoUrl | String    | Foto Barang                                     |
| damagePhotoUrl  | String?   | Foto Kerusakan (Array URL dalam JSON string)    |
| damageNotes     | String?   | Catatan Kerusakan                               |
| processedAt     | DateTime  | Waktu QC Selesai                                |
| resolution      | String?   | DIJUAL_KEMBALI / SCRAP / PARTIAL...             |
| goodQty         | Int?      | (BARU) Jumlah barang bagus dari hasil QC        |
| badQty          | Int?      | (BARU) Jumlah barang rusak dari hasil QC        |
| soldQty         | Int?      | (BARU) Akumulasi jumlah qty dijual kembali      |
| scrapQty        | Int?      | (BARU) Akumulasi jumlah qty di-scrap            |
| resolvedAt      | DateTime? | (BARU) Waktu eksekusi tindakan resolusi terakhir|

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
