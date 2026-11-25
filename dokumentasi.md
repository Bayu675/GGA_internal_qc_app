# Dokumentasi Sistem Manajemen QC Barang Return

## Deskripsi Singkat

Aplikasi web internal (*Warehouse QC Tools*) untuk manajemen Quality Control (QC) barang return yang mengubah proses manual menjadi sistem digital terpusat.

Sistem menangani proses penarikan data Sales Order (SO), pencetakan Barcode Label, inspeksi QC, pencatatan kondisi packing, hingga pengambilan keputusan tindak lanjut barang menggunakan konsep **Closed-Loop Barcode Workflow**.

Aplikasi beroperasi menggunakan arsitektur **Microservice** dan terintegrasi dengan **VFP ETL Service (Port 3001)** untuk sinkronisasi data master.

---

# Tech Stack

| Komponen | Teknologi |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS |
| Database | SQLite |
| ORM | Prisma ORM |
| UI Management | React Context (Global UI Provider) |
| Excel Processor | SheetJS (`xlsx`) |
| Barcode Generator | JsBarcode |
| Barcode Scanner | html5-qrcode |
| Process Manager | PM2 |
| HTTPS Tunnel | Ngrok |
| Backend ETL | PostgreSQL ETL Service (Port 3001) |

### Catatan

Ngrok digunakan untuk menyediakan koneksi HTTPS yang diwajibkan browser agar fitur berikut dapat berjalan pada perangkat mobile:

- Kamera QC
- Barcode Scanner
- Upload Foto

---

# Standar UI & Error Handling

- Aplikasi tidak menggunakan `window.alert()` atau `window.confirm()` bawaan browser.
- Seluruh notifikasi sukses/gagal dan konfirmasi tindakan menggunakan hook `useUI()` dari `src/components/UIProvider.tsx` untuk merender *Toast* atau *Modal* berbasis Tailwind CSS.
- Seluruh interaksi *Server Action* dibungkus dengan *Error Handling* (`try-catch`). Apabila koneksi database terputus atau jaringan bermasalah, state `isPending` dikembalikan ke kondisi normal dan notifikasi error ditampilkan tanpa membuat aplikasi *crash*.

---

# Arsitektur Sistem (Microservice)

Sistem menggunakan pendekatan Microservice untuk memisahkan aplikasi QC dengan layanan sinkronisasi data ERP/VFP.

## Diagram Arsitektur

```text
                 INTERNET
                    |
                    |
                HTTPS (Ngrok)
                    |
                    v
             [HP Staf Gudang]
                    |
                    v
         [Next.js App - Port 3000]
                    |
                    | Fetch API
                    v
        [VFP ETL Service - Port 3001]
                    |
                    v
          [PostgreSQL VFP Database]
```

## Catatan Penting

- Hanya Port `3000` yang di-expose ke internet melalui Ngrok.
- Port `3001` hanya dapat diakses melalui `localhost`.
- Database PostgreSQL tidak pernah diakses langsung oleh client.
- Seluruh komunikasi ke database ERP/VFP dilakukan melalui ETL Service.

Pemisahan ini membuat arsitektur lebih aman dan lebih mudah dikembangkan.

---

# Closed-Loop Barcode Workflow

Sistem menggunakan Barcode 1D (CODE128) sebagai identitas barang selama proses QC.

## Alur Sistem

```text
Tarik Data SO
     |
     v
Cetak Barcode Label
     |
     v
Tempel Barcode di Barang
     |
     v
QC Barang
     |
     v
Simpan Hasil QC
     |
     v
Scan Barcode
     |
     v
Tentukan Resolution
     |
     v
Export Report
     |
     v
   Selesai
```

## Barcode Generator

Menggunakan `JsBarcode`.

Barcode dibuat secara otomatis berdasarkan nomor Sales Order (SO).

## Barcode Scanner

Menggunakan `html5-qrcode`, dengan dukungan:

- Hardware Acceleration
- Native Barcode Detector API
- Kamera HP Android
- Kamera Laptop/Desktop

## Auto Filtering

Hasil pemindaian barcode akan diproses melalui alur berikut:

```text
Barcode Scan
     |
     v
Nomor SO
     |
     v
Debounced Search
     |
     v
Dashboard Filter
     |
     v
Menampilkan Data Barang
```

---

# Fitur Utama

## 1. Tarik Data Sales Order (API ETL)

### Tujuan

Mengambil data master barang return secara otomatis dari sistem ERP/VFP.

### Fitur

- Input Nomor SO.
- Sinkronisasi data melalui API.
- Diagnostik koneksi API.
- Validasi endpoint ETL.
- Penarikan data secara real-time.

### Arsitektur

```text
Next.js
   |
   v
Fetch API
   |
   v
ETL Service
   |
   v
PostgreSQL
   |
   v
ReturnItem
```

---

## 1.1 Penanganan Return Berulang (R2, R3)

Sistem memiliki logika untuk mendeteksi barang yang di-return lebih dari satu kali.

### Workflow

```text
Tarik SO
   |
   v
Cek Database (SO & Item Code)
   |
   v
Jika Ditemukan: Munculkan Peringatan Konfirmasi
   |
   v
Jika Disetujui: Tambahkan Suffix (Contoh: SO/123 - R2)
   |
   v
Simpan ke Database dan Tampilkan Badge Peringatan di Dashboard
```

---

## 2. Dashboard Interaktif

Dashboard dirancang untuk mendukung penggunaan Desktop maupun Mobile.

### Filter Status QC

- PENDING
- GOOD
- BAD
- PARTIAL_GOOD

### Filter Resolution

- DIJUAL_KEMBALI
- SCRAP
- PARTIAL_SOLD
- PARTIAL_SCRAP

### Search

Pencarian berdasarkan:

- Nomor SO
- Nama Barang
- Customer
- Nama Toko

### Advanced Filtering

Filter berdasarkan:

- Toko
- Status QC
- Resolution
- Rentang Tanggal

### Debounced Search

Sistem menggunakan delay `500 ms` untuk:

- Mengurangi *over-fetching* database.
- Meningkatkan performa SQLite.
- Memberikan pengalaman pencarian yang lebih responsif.

### Bulk Delete

Digunakan untuk:

- Membersihkan data salah import.
- Menghapus data secara massal.

### Checklist untuk Cetak Label Massal

Dashboard menyediakan checkbox pada tabel untuk memilih beberapa barang sekaligus. Data yang dipilih dapat diteruskan ke fitur **Cetak Label Massal** tanpa harus membuka halaman setiap barang satu per satu.

---

## 3. Form QC & Kamera Browser

### Teknologi Kamera

```javascript
navigator.mediaDevices.getUserMedia()
```

### Foto Barang Utama

Digunakan untuk:

- Foto keseluruhan barang.
- Dokumentasi kondisi fisik.

### Logika Kondisional (Status Barang)

Jika status dipilih **BAD**, sistem menampilkan form untuk:

- Upload foto kerusakan (*multi-photo support*).
- Damage Notes.

Jika status dipilih **PARTIAL_GOOD**, sistem mengaktifkan fitur tambahan:

- Input jumlah barang bagus (*Good Qty*) dengan validasi minimal 1.
- Kalkulasi otomatis jumlah barang rusak (*Bad Qty*) secara *read-only*.
- Form upload foto kerusakan untuk bagian yang rusak.
- Damage Notes.

### Kondisi Packing

Form QC menyediakan dropdown untuk mencatat kondisi fisik kemasan barang return. Status packing juga ditampilkan pada halaman detail dan edit data.

| Status Packing | Keterangan |
| --- | --- |
| Ada Packing | Barang return datang lengkap dengan packing/kardus aslinya. |
| Tanpa Packing | Barang return datang tanpa kemasan. |

Nilai status packing disimpan pada field `packingStatus` di model `QCResult`. Data lama yang belum memiliki nilai pada field ini dapat tetap kosong.

### Penyimpanan Foto

Sistem menggunakan **Client-Side Image Compression** melalui HTML5 Canvas sebelum foto dikirim ke server.

```text
Camera
   |
   v
Resize Max 1080px & Compress JPEG 70%
   |
   v
Base64 -> Convert JPG
   |
   v
public/uploads/
```

Seluruh foto disimpan sebagai file `.jpg` pada server lokal.

---

## 4. Barcode Scanner

Scanner dapat digunakan melalui:

- HP Android
- Laptop
- Desktop dengan Webcam

### Workflow

```text
Scan Barcode
     |
     v
Nomor SO
     |
     v
Dashboard Search
     |
     v
Menampilkan Data Barang
     |
     v
Input Resolution
     |
     v
Simpan
```

### Keuntungan

- Mempercepat pencarian data.
- Mengurangi *human error*.
- Memudahkan operasional gudang.

---

## 5. Thermal Label Printing (Satuan & Massal)

Ukuran label:

```text
80 x 50 mm
```

Informasi yang dicetak:

- Nomor SO
- Informasi Barang
- Barcode CODE128

### Cetak Label Satuan

Cetak label satuan tersedia dari halaman yang berkaitan dengan data barang, yaitu Form QC, Detail QC, dan Edit Barang.

### Cetak Label Massal (Bulk Print)

Pengguna dapat memilih beberapa barang melalui checkbox pada tabel dashboard, kemudian menjalankan proses cetak label massal.

Fitur ini menggunakan mekanisme **Isolated Hidden IFrame**. Proses pencetakan dilakukan pada iframe terpisah agar dialog print browser dapat memuat seluruh barcode SVG dengan benar dan menghindari hasil cetak yang terpotong pada thermal printer.

### Workflow

```text
Pilih Barang melalui Checkbox
          |
          v
     Cetak Massal
          |
          v
Siapkan Konten Label pada IFrame Terpisah
          |
          v
      Dialog Print
          |
          v
     Cetak Label
          |
          v
   Tempel pada Barang
```

---

## 6. Resolution Management

Fitur ini digunakan untuk menentukan keputusan akhir barang setelah proses QC. Sistem mendukung penanganan barang secara bertahap (*accumulative/partial resolution*).

### Resolution Status

| Status | Keterangan |
| --- | --- |
| (Kosong) | Menunggu keputusan atau belum ada resolusi. |
| DIJUAL_KEMBALI | Seluruh barang kembali masuk stok jual. |
| SCRAP | Seluruh barang dimusnahkan/dibuang. |
| PARTIAL_SOLD | Sebagian barang dijual kembali secara akumulatif. |
| PARTIAL_SCRAP | Sebagian barang dimusnahkan/dibuang secara akumulatif. |
| RESOLVED_MIXED | Barang telah selesai ditindaklanjuti melalui kombinasi penjualan kembali dan scrap. |

### Fitur Partial Resolution (Akumulatif)

- Pengguna dapat memasukkan jumlah barang yang di-scrap atau dijual kembali secara manual tanpa *auto-fill*.
- Sistem melacak dan mengakumulasi jumlah resolusi sebelumnya. Contoh: dari 10 barang, 5 dijual hari ini dan 2 di-scrap pada hari berikutnya.
- Sistem memvalidasi agar total input resolusi tidak melebihi sisa barang yang belum diresolusi.
- Jumlah terjual dan jumlah scrap disimpan secara akumulatif pada `soldQty` dan `scrapQty`.

### Anti-Stale Data Guard (Pencegahan Bentrok Multi-Device)

Fitur ini mencegah eksekusi resolusi menggunakan informasi sisa stok yang sudah tidak sesuai dengan kondisi database, misalnya ketika staf membuka sistem secara bersamaan melalui HP dan laptop.

Mekanisme kerja:

1. Saat pengguna mengirim perubahan resolusi, client turut mengirim parameter `expectedRemainingQty`, yaitu jumlah sisa barang yang terlihat pada layar pengguna saat itu.
2. Backend membandingkan nilai tersebut dengan sisa barang terkini di database.
3. Jika jumlah sisa di database berbeda, berarti data yang dilihat pengguna sudah tidak mutakhir. Backend menolak eksekusi agar perubahan tidak diterapkan berdasarkan data basi.
4. Sistem menampilkan pesan peringatan dan memicu `router.refresh()` agar tampilan diperbarui mengikuti data terbaru dari database.

Validasi ini membantu mencegah bentrok perubahan ketika beberapa perangkat memproses barang yang sama secara bersamaan.

### Workflow Resolution

```text
QC Selesai
     |
     v
Scan Barcode
     |
     v
Buka Detail Barang
     |
     v
Pilih Resolution
     |
     v
Validasi Sisa Stok
     |
     v
Simpan
```

---

## 7. Edit Data & Koreksi Manual Eksekusi

Halaman edit (`/edit/[id]`) digunakan untuk memperbarui data barang, data QC, dan melakukan koreksi terhadap hasil eksekusi tindak lanjut.

### Edit Master Data

Pengguna dapat mengubah:

- Nomor SO.
- Customer.
- Kode Barang.
- Nama Barang.
- Dimensi (L x T).
- Qty Order.

### Edit Data QC

Pengguna dapat mengubah:

- Status QC (GOOD, BAD, atau PARTIAL_GOOD).
- Foto fisik barang.
- Foto kerusakan/minus.
- Catatan kerusakan (*Damage Notes*).
- Status Packing.

### Koreksi Manual Eksekusi

Edit Form menyediakan input manual untuk mengoreksi:

- **Qty Terjual (`soldQty`)**: jumlah barang yang dijual kembali.
- **Qty Scrap (`scrapQty`)**: jumlah barang yang di-scrap/dibuang.

Form menampilkan indikator **Sisa Stok** secara langsung agar pengguna dapat melihat jumlah barang yang belum ditindaklanjuti.

### Otomatisasi Status Resolusi

Status resolusi disesuaikan dengan jumlah terjual, jumlah scrap, dan sisa barang:

- Jika `Qty Terjual == Qty Order`, status menjadi **DIJUAL_KEMBALI**.
- Jika `Qty Scrap == Qty Order`, status menjadi **SCRAP**.
- Jika jumlah terjual dan scrap secara gabungan menghabiskan seluruh stok, status menjadi **RESOLVED_MIXED**.
- Jika masih terdapat sisa stok setelah sebagian barang ditindaklanjuti, status menunjukkan kondisi parsial.
- Jika `Qty Terjual == 0` dan `Qty Scrap == 0`, status resolusi otomatis kembali menjadi **kosong/belum ada keputusan**.

Pengembalian ke status kosong tersebut membuat data kembali ke kondisi belum memiliki keputusan tindak lanjut.

---

## 8. Rekap Kerja Harian (`/report`)

Halaman `/report` menyediakan rekap aktivitas operasional gudang berdasarkan dua sudut pandang, yaitu pemasukan hasil QC dan pengeluaran hasil eksekusi resolusi.

### Tab Pemasukan (Hasil QC)

Rekap pemasukan didasarkan pada waktu barang selesai diinspeksi, yaitu field `processedAt`.

Informasi ringkasan yang ditampilkan:

- Total SO.
- Total Qty Masuk.
- Kondisi Good.
- Kondisi Bad.
- Catatan Kerusakan.

### Tab Pengeluaran (Eksekusi)

Rekap pengeluaran didasarkan pada waktu tindakan resolusi dieksekusi, yaitu field `resolvedAt`.

Informasi ringkasan yang ditampilkan:

- Total Qty Keluar.
- Jumlah Dijual Kembali.
- Jumlah Di-Scrap.
- Sisa Stok.
- Status Resolusi.

### Fitur Laporan

- **Date Picker Filter** untuk memilih tanggal rekap secara spesifik.
- Tabel rincian yang *copy-paste friendly* untuk memudahkan pemindahan data ke laporan manajemen atau spreadsheet.
- Pemisahan tab pemasukan QC dan pengeluaran eksekusi agar kedua aktivitas dapat dipantau secara terpisah.

---

## 9. Export Report Multi-Toko (Enterprise)

Laporan Excel dapat dibuat berdasarkan satu toko atau beberapa toko sekaligus.

### Filter Export

Modal filter export menyediakan:

- Pilihan satu atau banyak toko (*multi-toko*) melalui checkbox.
- Pencarian nama toko (*search toko*).
- Rentang tanggal, yaitu tanggal mulai dan tanggal akhir.
- Proses download laporan dalam format `.xlsx` melalui endpoint `/api/export`.

### Kolom Laporan Excel

| No. | Kolom | Keterangan |
| --- | --- | --- |
| 1 | NO | Nomor urut data. |
| 2 | Tanggal Terima (QC) | Tanggal penerimaan/penyelesaian proses QC. |
| 3 | Tanggal Keluar (Eksekusi) | Tanggal eksekusi resolusi. |
| 4 | Sales Order | Nomor SO. |
| 5 | Customer | Nama customer. |
| 6 | Kode Barang | Kode barang. |
| 7 | Nama Barang | Nama barang. |
| 8 | L & T | Dimensi lebar dan tinggi. |
| 9 | Qty Order | Jumlah order. |
| 10 | Qty Dijual | Jumlah barang yang dijual kembali. |
| 11 | Qty Scrap | Jumlah barang yang di-scrap/dibuang. |
| 12 | Sisa Stok | Jumlah barang yang belum ditindaklanjuti. |
| 13 | Status QC | Hasil inspeksi QC. |
| 14 | Status Packing | Ada Packing / Tanpa Packing. |
| 15 | Tindak Lanjut | Keputusan resolusi barang. |
| 16 | Notes Minus | Catatan kerusakan/minus. |

Untuk data lama yang belum memiliki nilai `packingStatus`, kolom Status Packing dibiarkan kosong.

### Workflow Export

```text
Buka Modal Export
       |
       v
Pilih Satu atau Banyak Toko
       |
       v
Cari Nama Toko (Opsional)
       |
       v
Tentukan Rentang Tanggal
       |
       v
Generate Excel
       |
       v
Endpoint /api/export
       |
       v
Download File .xlsx
```

### Terjemahan Status

Status database seperti:

```text
DIJUAL_KEMBALI
```

diterjemahkan menjadi label yang lebih mudah dibaca:

```text
Dijual Kembali
```

Tujuannya agar laporan lebih mudah dipahami oleh pihak Management.

---

# Struktur Database

Sistem menggunakan relasi:

```text
ReturnItem (1)
     |
     v
QCResult (1)
```

## Model: ReturnItem

Digunakan untuk menyimpan data master hasil sinkronisasi API ETL.

| Field | Keterangan |
| --- | --- |
| id | Primary Key |
| soNumber | Nomor SO |
| customerName | Nama Customer |
| itemCode | Kode Barang |
| itemName | Nama Barang |
| width | Lebar |
| height | Tinggi |
| qtyOrder | Quantity Order |
| qcStatus | Status QC |

## Model: QCResult

Digunakan untuk menyimpan hasil inspeksi QC, kondisi packing, dan keputusan akhir barang.

| Field | Tipe Data | Keterangan |
| --- | --- | --- |
| returnItemId | String | Foreign Key ke `ReturnItem`. |
| finalStatus | String | GOOD / BAD / PARTIAL_GOOD. |
| generalPhotoUrl | String | Foto barang. |
| damagePhotoUrl | String? | Foto kerusakan (array URL dalam JSON string). |
| damageNotes | String? | Catatan kerusakan. |
| processedAt | DateTime | Waktu QC selesai. |
| resolution | String? | Status tindak lanjut/resolusi barang. |
| goodQty | Int? | Jumlah barang bagus dari hasil QC. |
| badQty | Int? | Jumlah barang rusak dari hasil QC. |
| soldQty | Int? | Akumulasi jumlah barang yang dijual kembali. |
| scrapQty | Int? | Akumulasi jumlah barang yang di-scrap. |
| resolvedAt | DateTime? | Waktu eksekusi tindakan resolusi terakhir. |
| packingStatus | String? | Kondisi kemasan barang: Ada Packing / Tanpa Packing. |

### Catatan Field `packingStatus`

Field `packingStatus` menyimpan kondisi kemasan barang ketika proses QC dilakukan. Field ini bersifat nullable (`String?`) sehingga data lama yang belum memiliki informasi packing tetap dapat disimpan tanpa harus mengisi nilai secara retroaktif.

---

# Penyimpanan Foto

Lokasi penyimpanan:

```text
public/uploads/
```

## Smart Storage Cleanup

Apabila foto diganti atau dihapus, sistem menjalankan:

```javascript
fs.unlink()
```

untuk:

- Menghapus file lama.
- Mencegah file *orphan*.
- Menghemat storage server.

---

# Panduan Deployment

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

# Update Schema Database

Apabila terdapat perubahan struktur database, jalankan:

```bash
git pull origin main
npm install
npx prisma db push
npm run build
pm2 restart return-qc-app
```

> **Catatan:** Perubahan model Prisma, termasuk penambahan field `packingStatus` pada model `QCResult`, memerlukan sinkronisasi schema menggunakan `npx prisma db push` sebelum aplikasi dijalankan dengan schema terbaru.

---

# Expose ke Internet

Jalankan:

```bash
ngrok http 3000
```

Contoh alamat:

```text
https://abc123.ngrok-free.app
```

Browser mewajibkan HTTPS untuk menjalankan:

- Kamera QC.
- Barcode Scanner.
- Upload Foto.

---

# Struktur Folder Penting

Struktur folder utama berdasarkan pembaruan dokumentasi:

```text
project-root/
|
├── prisma/
│   └── schema.prisma
|
├── public/
│   └── uploads/
|
├── src/
│   ├── app/
│   │   └── api/
│   ├── components/
│   └── lib/
|
├── dev.db
├── package.json
├── README.md
└── dokumentasi.md
```

Keterangan:

- `prisma/`: konfigurasi schema database Prisma.
- `public/uploads/`: penyimpanan foto hasil QC.
- `src/app/`: halaman aplikasi Next.js App Router dan route API.
- `src/components/`: komponen UI, termasuk provider UI.
- `src/lib/`: fungsi pendukung dan utilitas aplikasi.
- `dev.db`: file database SQLite.

---

# Alur Sistem (End-to-End)

```text
Tarik Data SO
      |
      v
Sinkronisasi API ETL
      |
      v
Dashboard QC
      |
      v
Cetak Barcode Label (Satuan/Massal)
      |
      v
QC Barang & Catat Kondisi Packing
      |
      v
Simpan Hasil QC
      |
      v
Scan Barcode
      |
      v
Tentukan Resolution
      |
      v
Validasi Sisa Stok (Anti-Stale Data Guard)
      |
      v
Rekap Kerja Harian / Export Report Excel
      |
      v
    Selesai
```

---

# Single Source of Truth

Dokumen ini merupakan referensi utama (*Single Source of Truth*) untuk:

- Arsitektur Sistem.
- Integrasi API ETL.
- Struktur Database.
- Workflow QC.
- Closed-Loop Barcode System.
- Barcode Scanner.
- Thermal Label Printing satuan dan massal.
- Pencatatan Kondisi Packing.
- Resolution Management.
- Anti-Stale Data Guard.
- Koreksi Manual Eksekusi.
- Rekap Kerja Harian.
- Export Report Multi-Toko.
- Deployment Server.
- Git Workflow.
- Pengelolaan File Foto.

Seluruh perubahan fitur dan perubahan arsitektur sistem wajib diperbarui pada dokumen ini agar tetap menjadi sumber dokumentasi yang akurat, konsisten, dan terkini.
