import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { ReturnItemTable } from "@/components/ReturnItemTable";

// Next.js App Router convention for Page props containing searchParams
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  // Next.js 15 requires awaiting searchParams
  const searchParams = await props.searchParams;

  // Parse URL search parameters
  const page = Number(searchParams?.page) || 1;
  const search = typeof searchParams?.search === 'string' ? searchParams.search : '';
  const tab = searchParams?.tab === 'completed' ? 'completed' : 'pending';
  const dateQuery = typeof searchParams?.date === 'string' ? searchParams.date : '';

  const take = 10;
  const skip = (page - 1) * take;
  // Setup filter tanggal masuk
  let dateFilter = undefined;
  if (dateQuery) {
    const startDate = new Date(dateQuery);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    dateFilter = { gte: startDate, lt: endDate };
  }

  // Build Prisma where clause based on search and tab filters
  const whereCondition = {
    AND: [
      ...(dateFilter ? [{ createdAt: dateFilter }] : []),
      {
        OR: [
          { soNumber: { contains: search } },
          { itemName: { contains: search } },
          { customerName: { contains: search } },
        ],
      },
      {
        qcStatus: tab === 'pending' ? 'PENDING' : { not: 'PENDING' },
      },
    ],
  };

  // Fetch data and total count concurrently
  const [items, totalItems] = await Promise.all([
    prisma.returnItem.findMany({
      where: whereCondition,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.returnItem.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(totalItems / take);
  const baseUrl = `/?tab=${tab}${search ? `&search=${encodeURIComponent(search)}` : ''}`;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard QC Barang Return</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Direct link to API Route forces a file download */}
            <a href="/api/export" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">📥 Export Excel</Button>
            </a>
              <Link href="/import" className="w-full sm:w-auto">
              <Button className="w-full">+ Import Excel</Button>
            </Link>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex space-x-2 w-full md:w-auto">
            <Link href="/?tab=pending" className="flex-1 md:flex-none">
              <Button 
                variant={tab === 'pending' ? 'primary' : 'secondary'} 
                className="w-full"
              >
                Belum Dicek
              </Button>
            </Link>
            <Link href="/?tab=completed" className="flex-1 md:flex-none">
              <Button 
                variant={tab === 'completed' ? 'primary' : 'secondary'}
                className="w-full"
              >
                Sudah Dicek
              </Button>
            </Link>
          </div>

          <form className="flex w-full md:w-auto gap-2 flex-col sm:flex-row" action="/" method="GET">
            <input type="hidden" name="tab" value={tab} />
            <Input type="date" name="date" defaultValue={dateQuery} className="w-full sm:w-auto" />
            <Input 
              name="search" 
              placeholder="Cari SO, Barang, Customer..." 
              defaultValue={search}
              className="w-full md:w-80"
            />
            <Button type="submit" variant="secondary">Cari</Button>
          </form>
        </div>

        {/* Data Table */}
        <ReturnItemTable items={items} tab={tab} />

        {/* Pagination */}
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />

      </div>
    </main>
  );
}