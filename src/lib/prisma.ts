import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

// Ambil lokasi file db dari env
const dbPath = (process.env.DATABASE_URL ?? 'file:./dev.db').replace('file:', '');

// 1. Buat instance database sqlite
const sqlite = new Database(dbPath);

// 2. Bungkus ke adapter dengan menyertakan properti url yang diminta Prisma 7
const adapter = new PrismaBetterSqlite3({
  url: dbPath,
  // pass instance database-nya ke dalam objek internal adapter jika versinya meminta
  // jika masih protes, cukup gunakan { url: dbPath } saja
});

export const prisma = new PrismaClient({ adapter });