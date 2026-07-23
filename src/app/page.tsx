// src/app/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { ReturnItemTable } from "@/components/ReturnItemTable";
import { DashboardFilters } from "@/components/DashboardFilters";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page) || 1;
  const search = typeof searchParams?.search === 'string' ? searchParams.search : '';
  const tab = searchParams?.tab === 'completed' ? 'completed' : 'pending';
  const dateQuery = typeof searchParams?.date === 'string' ? searchParams.date : '';
  const customerQuery = typeof searchParams?.customer === 'string' ? searchParams.customer : '';

  const take = 10;
  const skip = (page - 1) * take;
  
  let dateFilter = undefined;
  if (dateQuery) {
    const startDate = new Date(dateQuery);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    dateFilter = { gte: startDate, lt: endDate };
  }

  // Build Prisma where clause
  const whereCondition = {
    AND: [
      ...(dateFilter ? [{ createdAt: dateFilter }] : []),
      ...(customerQuery ? [{ customerName: customerQuery }] : []), // Filter Toko
      {
        OR: [
          { soNumber: { contains: search } },
          { itemName: { contains: search } },
          { itemCode: { contains: search } },
        ],
      },
      {
        qcStatus: tab === 'pending' ? 'PENDING' : { not: 'PENDING' },
      },
    ],
  };

  // Fetch data (Tabel, Total Data, dan Daftar Unik Toko) secara paralel
  const [items, totalItems, distinctCustomers] = await Promise.all([
    prisma.returnItem.findMany({
      where: whereCondition,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.returnItem.count({ where: whereCondition }),
    prisma.returnItem.findMany({
      select: { customerName: true },
      distinct: ['customerName'],
      orderBy: { customerName: 'asc' }
    })
  ]);

  const customerList = distinctCustomers.map(c => c.customerName);
  const totalPages = Math.ceil(totalItems / take);
  const baseUrl = `/?tab=${tab}${search ? `&search=${encodeURIComponent(search)}` : ''}${customerQuery ? `&customer=${encodeURIComponent(customerQuery)}` : ''}${dateQuery ? `&date=${dateQuery}` : ''}`;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        
        {/* Header App */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard QC Barang Return</h1>
            <p className="text-sm text-gray-500">Kelola dan inspeksi barang return dari berbagai toko.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Link href="/tarik-so" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border-none">
                🔍 Tarik Data SO
              </Button>
            </Link>
            <Link href="/import" className="w-full sm:w-auto">
              <Button className="w-full">+ Import Manual</Button>
            </Link>
          </div>
        </div>

        {/* TABS (Pending / Completed) */}
        <div className="flex space-x-2 w-full md:w-auto mb-4 border-b border-gray-200 pb-4">
          <Link href="/?tab=pending" className="flex-1 md:flex-none">
            <Button variant={tab === 'pending' ? 'primary' : 'secondary'} className="w-full">
              Belum Dicek
            </Button>
          </Link>
          <Link href="/?tab=completed" className="flex-1 md:flex-none">
            <Button variant={tab === 'completed' ? 'primary' : 'secondary'} className="w-full">
              Sudah Dicek
            </Button>
          </Link>
        </div>

        {/* Komponen Filter Keren Kita (Scanner, Dropdown, Search, Modal) */}
        <DashboardFilters 
          tab={tab}
          initialSearch={search}
          initialDate={dateQuery}
          initialCustomer={customerQuery}
          customerList={customerList}
        />

        {/* Tabel Data & Pagination */}
        <ReturnItemTable items={items} tab={tab} />
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />

      </div>
    </main>
  );
}