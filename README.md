# Return QC Management System

Sistem manajemen Quality Control (QC) barang return berbasis web yang dirancang untuk menggantikan proses manual pengecekan barang, dokumentasi foto, dan pencatatan hasil inspeksi menjadi satu platform terpusat.

---

## ✨ Fitur Utama

- Import data master dari file Excel
- Dashboard responsif (Desktop & Mobile)
- Pencarian data real-time
- Filter status QC
- Bulk delete data
- Kamera langsung dari browser HP
- Multi-photo untuk barang rusak/minus
- Catatan kerusakan (damage notes)
- Edit data master dan hasil QC
- Auto cleanup file foto yang tidak digunakan
- Export laporan hasil QC ke Excel

---

## 🏗 Tech Stack

- Next.js 15 (App Router)
- TypeScript (Strict Mode)
- Tailwind CSS
- Prisma ORM
- SQLite Database
- SheetJS (xlsx)
- PM2
- Ngrok

---

## 📦 Instalasi

### Clone Repository

```bash
git clone <repository-url>
cd return-qc-app
```

### Install Dependencies

```bash
npm install
```

### Setup Database

```bash
npx prisma db push
```

### Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di:

```text
http://localhost:3000
```

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

## 🔄 Workflow Penggunaan

### 1. Import Excel

Upload file Excel berisi data barang return.

### 2. QC Barang

Staf melakukan:

- Foto barang
- Menentukan status QC
- Menambahkan foto kerusakan
- Menambahkan catatan

### 3. Simpan Hasil

Data tersimpan ke database dan foto tersimpan ke server lokal.

### 4. Export Report

Generate laporan Excel hasil QC.

---

## 📊 Status QC

| Status | Keterangan |
|----------|----------|
| PENDING | Belum dicek |
| GOOD | Barang sesuai |
| BAD | Barang rusak |
| PARTIAL_GOOD | Sebagian barang rusak |

---

## 📷 Penyimpanan Foto

Semua foto disimpan pada:

```text
public/uploads/
```

Jika foto diganti atau dihapus, sistem akan otomatis menghapus file lama dari storage untuk menghindari file sampah.

---

## 🛡 File yang Tidak Boleh Masuk Git

Pastikan `.gitignore` berisi:

```gitignore
*.db
public/uploads/
.next/
node_modules/
```

---

## 🔄 Update Deployment

Di server:

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

- Arsitektur Sistem
- Database
- Workflow QC
- Deployment
- Git Workflow
- Pengelolaan Foto
- Export Report

---

## 👨‍💻 Author

Internal Warehouse QC Tools
