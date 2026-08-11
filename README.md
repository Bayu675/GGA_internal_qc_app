# Return QC Management System

Sistem manajemen **Quality Control (QC) barang return** berbasis web untuk menggantikan proses manual pengecekan barang, dokumentasi foto, dan pencatatan hasil inspeksi menjadi satu platform terpusat.

Aplikasi ini mengintegrasikan proses **penarikan data Sales Order (SO)**, pencetakan barcode, inspeksi QC, dokumentasi foto, hingga keputusan tindak lanjut barang melalui konsep **Closed-Loop Barcode Workflow**.

Sistem menggunakan arsitektur microservice dengan integrasi **VFP/ERP melalui PostgreSQL ETL Service** untuk sinkronisasi data master.

---

## ✨ Fitur Utama

### 🔥 Fitur Terbaru

- **Return Berulang (R2/R3)** — otomatis mendeteksi return dengan kombinasi SO & item code yang sama dan memberikan suffix seperti `- R2`, `- R3`.
- **Integrasi API ETL** — menarik data Sales Order dari backend VFP/PostgreSQL ETL.
- **Barcode Scanner In-App** — scan barcode langsung dari kamera dengan audio feedback.
- **Thermal Label Printing** — mencetak label `80 × 50 mm` dengan barcode CODE128.
- **Partial Resolution** — mendukung penjualan kembali dan scrap secara parsial dan akumulatif.
- **Global UI Provider** — Toast & Modal berbasis React Context sebagai pengganti `window.alert()` dan `window.confirm()`.
- **Advanced Dashboard Filtering** — filter toko, status QC, resolution, dan rentang tanggal.
- **Dynamic Excel Export** — export laporan berdasarkan filter dan multi-toko.
- **API Diagnostics** — pengecekan koneksi dan endpoint ETL langsung dari halaman Tarik SO.
- **Client-Side Image Compression** — kompresi foto sebelum upload untuk menghemat storage.
- **Lightbox / Click-to-Zoom** — melihat detail foto QC dengan lebih nyaman.
- **Sticky Bottom Action Bar** — memudahkan aksi pada form QC dan edit dari perangkat mobile.

### 📋 Fitur Lainnya

- Import data master dari Excel.
- Dashboard responsif untuk Desktop dan Mobile.
- Pencarian data dengan debounce.
- Filter berdasarkan status QC.
- Bulk delete data.
- Kamera QC langsung dari browser.
- Multi-photo untuk dokumentasi kerusakan.
- Damage Notes.
- Edit data master dan hasil QC.
- Auto cleanup file foto yang sudah tidak digunakan.
- Export hasil QC ke Excel.

---

## 🛠 Tech Stack

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

---

## 🏗 Arsitektur Sistem

Aplikasi menggunakan pendekatan microservice untuk memisahkan aplikasi QC dengan layanan sinkronisasi data ERP/VFP.

```text
                    INTERNET
                       │
                       │ HTTPS
                       ▼
                ┌───────────────┐
                │  HP / Browser │
                │  Staf Gudang  │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  Next.js App  │
                │   Port 3000   │
                └───────┬───────┘
                        │
                    Fetch API
                        │
                        ▼
                ┌───────────────┐
                │  VFP ETL      │
                │   Port 3001   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ PostgreSQL    │
                │ VFP Database  │
                └───────────────┘
```

### Prinsip Akses

- Hanya port `3000` yang di-expose ke internet melalui Ngrok.
- Port `3001` digunakan oleh aplikasi sebagai backend ETL.
- Client tidak mengakses PostgreSQL secara langsung.
- Sinkronisasi data dilakukan melalui ETL Service.

---

## 🔄 Closed-Loop Barcode Workflow

Barcode CODE128 digunakan sebagai identitas barang selama proses QC hingga resolution.

```text
Tarik Data SO
      │
      ▼
Cetak Barcode Label
      │
      ▼
Tempel Barcode
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

### Barcode

- **Generator:** JsBarcode
- **Scanner:** html5-qrcode
- **Format:** CODE128
- **Target perangkat:** Android, Laptop, dan Desktop dengan webcam

Hasil scan akan digunakan untuk mencari data barang secara otomatis melalui dashboard.

---

## 🚀 Workflow Penggunaan

### 1. Tarik Data Sales Order

Staf memasukkan nomor SO dan sistem akan:

1. Menghubungi API ETL.
2. Mengambil data master barang return.
3. Memvalidasi data.
4. Menyimpan data ke database lokal.
5. Menampilkan hasil pada dashboard.

Jika SO dan item code pernah diproses sebelumnya, sistem dapat mendeteksi return berulang dan menawarkan suffix seperti:

```text
SO/123
SO/123 - R2
SO/123 - R3
```

---

### 2. Cetak Barcode Label

Label thermal berukuran `80 × 50 mm` berisi:

- Nomor SO.
- Informasi barang.
- Barcode CODE128.

Label kemudian ditempelkan pada barang fisik dan digunakan sepanjang proses QC.

---

### 3. Form QC & Kamera Browser

QC dapat dilakukan langsung melalui browser menggunakan kamera perangkat.

Teknologi kamera:

```javascript
navigator.mediaDevices.getUserMedia()
```

#### Foto Barang Utama

Digunakan untuk:

- Foto keseluruhan barang.
- Dokumentasi kondisi fisik.

#### Status `BAD`

Sistem menampilkan:

- Upload foto kerusakan.
- Multi-photo support.
- Damage Notes.

#### Status `PARTIAL_GOOD`

Sistem mengaktifkan:

- Input **Good Qty** dengan validasi minimal `1`.
- Kalkulasi otomatis **Bad Qty** secara read-only.
- Upload foto bagian yang rusak.
- Damage Notes.

Secara konsep:

```text
Total Qty
   │
   ├── Good Qty  → Input User
   │
   └── Bad Qty   → Otomatis dihitung
```

Foto dikompresi di sisi client sebelum dikirim ke server untuk mengurangi penggunaan storage.

---

### 4. Simpan Hasil QC

Hasil inspeksi menyimpan:

- Status QC.
- Foto barang.
- Foto kerusakan.
- Catatan kerusakan.
- Good Qty / Bad Qty untuk `PARTIAL_GOOD`.
- Waktu proses QC.

Foto lama akan dibersihkan otomatis ketika diganti atau tidak lagi digunakan.

---

### 5. Resolution Management

Setelah QC selesai, barang dapat diberikan keputusan tindak lanjut.

| Status | Keterangan |
| --- | --- |
| `(Kosong)` | Menunggu keputusan |
| `DIJUAL_KEMBALI` | Seluruh barang kembali masuk stok jual |
| `SCRAP` | Seluruh barang dimusnahkan / dibuang |
| `PARTIAL_SOLD` | Sebagian barang dijual kembali secara akumulatif |
| `PARTIAL_SCRAP` | Sebagian barang di-scrap secara akumulatif |

#### Partial Resolution

Sistem mendukung resolusi barang secara bertahap.

Contoh:

```text
Total Barang = 10

Hari 1 → Jual 5
Sisa    = 5

Hari 2 → Scrap 2
Sisa    = 3
```

Karakteristik:

- User memasukkan jumlah yang benar-benar diproses secara manual.
- Tidak ada auto-fill jumlah resolution.
- Sistem melacak histori dan akumulasi `soldQty` serta `scrapQty`.
- Total resolution tidak boleh melebihi sisa barang yang belum diresolusi.

---

### 6. Reporting

Laporan dapat diexport ke Excel berdasarkan:

- Toko.
- Rentang tanggal.
- Status QC.
- Resolution.

Contoh alur:

```text
Filter Dashboard
      ↓
Pilih Filter Export
      ↓
Generate Excel
      ↓
Download Report
```

---

## 📊 Mapping Status

### Status QC

| Status | Keterangan |
| --- | --- |
| `PENDING` | Belum dilakukan inspeksi |
| `GOOD` | Barang sesuai / baik |
| `BAD` | Barang rusak |
| `PARTIAL_GOOD` | Sebagian barang baik dan sebagian rusak |

### Resolution

| Status | Keterangan |
| --- | --- |
| `(Kosong)` | Menunggu keputusan |
| `DIJUAL_KEMBALI` | Seluruh barang kembali masuk stok jual |
| `SCRAP` | Seluruh barang dimusnahkan / dibuang |
| `PARTIAL_SOLD` | Sebagian barang dijual kembali |
| `PARTIAL_SCRAP` | Sebagian barang di-scrap |

---

## 🗄 Struktur Database

Relasi utama:

```text
ReturnItem (1)
      │
      ▼
QCResult (1)
```

### `ReturnItem`

Menyimpan data master barang hasil sinkronisasi API ETL.

Field utama:

| Field | Keterangan |
| --- | --- |
| `id` | Primary Key |
| `soNumber` | Nomor SO |
| `customerName` | Nama customer |
| `itemCode` | Kode barang |
| `itemName` | Nama barang |
| `width` | Lebar |
| `height` | Tinggi |
| `qtyOrder` | Quantity order |
| `qcStatus` | Status QC |

### `QCResult`

Menyimpan hasil inspeksi QC dan keputusan resolution.

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `returnItemId` | String | Foreign Key |
| `finalStatus` | String | `GOOD` / `BAD` / `PARTIAL_GOOD` |
| `generalPhotoUrl` | String | Foto barang |
| `damagePhotoUrl` | String? | Array URL foto kerusakan dalam JSON string |
| `damageNotes` | String? | Catatan kerusakan |
| `processedAt` | DateTime | Waktu QC selesai |
| `resolution` | String? | Status resolution |
| `goodQty` | Int? | Jumlah barang bagus dari hasil QC |
| `badQty` | Int? | Jumlah barang rusak dari hasil QC |
| `soldQty` | Int? | Akumulasi jumlah qty dijual kembali |
| `scrapQty` | Int? | Akumulasi jumlah qty di-scrap |
| `resolvedAt` | DateTime? | Waktu tindakan resolution terakhir |

---

## 📷 Penyimpanan Foto

Foto QC disimpan di:

```text
public/uploads/
```

Sistem menggunakan client-side image compression sebelum upload:

```text
Camera
   ↓
Resize Max 1080px
   ↓
Compress JPEG ~70%
   ↓
Upload
   ↓
public/uploads/
```

Sistem juga menjalankan cleanup file ketika foto diganti atau dihapus untuk mencegah orphan files dan pemborosan storage.

---

## 🎨 Standar UI & Error Handling

Aplikasi tidak lagi menggunakan:

```javascript
window.alert()
window.confirm()
```

Seluruh notifikasi dan konfirmasi menggunakan **Global UI Provider** berbasis React Context.

Komponen UI digunakan melalui:

```text
src/components/UIProvider.tsx
```

Standar implementasi:

- Gunakan hook `useUI()` untuk Toast dan Modal.
- Jangan menggunakan `window.alert()` untuk notifikasi.
- Jangan menggunakan `window.confirm()` untuk konfirmasi.
- Server Action harus memiliki error handling yang memadai.
- Gunakan `try-catch` untuk menangani kegagalan database/API.
- State `isPending` harus dikembalikan ke kondisi normal setelah error.
- Error ditampilkan kepada user melalui Toast yang ramah.

---

## 📦 Instalasi

### Prerequisites

Pastikan environment memiliki:

- Node.js
- npm
- SQLite
- PostgreSQL ETL Service jika menggunakan fitur Tarik SO
- PM2 untuk production (opsional)
- Ngrok untuk akses kamera melalui HTTPS (opsional)

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

Aplikasi tersedia di:

```text
http://localhost:3000
```

---

## ⚙️ Integrasi API ETL

Fitur **Tarik Data Sales Order** membutuhkan PostgreSQL ETL Service yang berjalan pada:

```text
http://localhost:3001
```

Return QC bertindak sebagai client untuk service tersebut.

Pastikan:

- ETL Service aktif.
- Port `3001` dapat diakses oleh aplikasi.
- Endpoint API ETL berjalan normal.
- Database PostgreSQL VFP tersedia untuk ETL Service.
- Status koneksi dapat diperiksa melalui fitur diagnostik pada halaman Tarik SO.

---

## 🚀 Production Deployment

### Build

```bash
npm run build
```

### Jalankan dengan PM2

```bash
pm2 start npm --name "return-qc-app" -- start
```

### Simpan konfigurasi PM2

```bash
pm2 save
pm2 startup
```

### Update Deployment

Setelah ada perubahan source code:

```bash
git pull origin main
npm install
npx prisma db push
npm run build
pm2 restart return-qc-app
```

> Jalankan `npx prisma db push` apabila terdapat perubahan pada `schema.prisma`.

---

## 🌐 Akses dari HP & Kamera

Browser modern membutuhkan secure context untuk mengakses kamera.

Untuk deployment sederhana menggunakan Ngrok:

```bash
ngrok http 3000
```

Kemudian gunakan URL HTTPS yang diberikan Ngrok, misalnya:

```text
https://abc123.ngrok-free.app
```

Fitur yang membutuhkan akses kamera:

- Kamera QC.
- Barcode Scanner.
- Dokumentasi foto kerusakan.

> Untuk production, gunakan HTTPS melalui reverse proxy atau infrastructure yang sesuai daripada mengandalkan tunnel development.

---

## 📂 Struktur Folder

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
└── README.md
```

---

## 🛡️ File yang Tidak Boleh Masuk Git

Pastikan `.gitignore` mencakup file dan folder lokal berikut:

```gitignore
*.db
public/uploads/
.next/
node_modules/
```

---

## 📚 Dokumentasi Lengkap

Dokumentasi teknis lengkap tersedia pada:

```text
dokumentasi.md
```

Dokumen tersebut menjadi **Single Source of Truth** untuk:

- Arsitektur sistem.
- Database schema.
- Integrasi API ETL.
- Workflow QC.
- Closed-Loop Barcode System.
- Barcode Scanner.
- Resolution Management.
- Deployment.
- Git Workflow.
- Pengelolaan foto.
- Export report.

Setiap perubahan fitur atau arsitektur sebaiknya selalu diikuti dengan pembaruan dokumentasi agar README dan dokumentasi teknis tetap konsisten.

---

## 👨‍💻 Author

**Bayu A.K.A Ryu**

---

## 📄 License

Dokumen ini merupakan bagian dari dokumentasi internal aplikasi Return QC Management System.
