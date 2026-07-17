import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditForm } from "@/components/EditForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage(props: EditPageProps) {
  // Next.js 15 requires awaiting params
  const resolvedParams = await props.params;

  // Fetch item and its QC relations
  const item = await prisma.returnItem.findUnique({
    where: { id: resolvedParams.id },
    include: { qcResult: true },
  });

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center pb-20">
      <div className="w-full max-w-3xl bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Edit Data Barang</h1>
          <p className="text-sm text-gray-500 mt-1">Ubah master data SO, foto, atau ubah status QC.</p>
        </div>

        {/* Pass fetched data to the Client Component Form */}
        <EditForm item={item} />
      </div>
    </main>
  );
}