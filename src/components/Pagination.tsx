import React from 'react';
import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g., "/?tab=pending&search=XYZ"
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, baseUrl }) => {
  if (totalPages <= 1) return null;

  // Helper to construct URL with correct query parameters
  const createPageUrl = (page: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    // Clean up existing page param if it exists in the base URL
    const cleanBaseUrl = baseUrl.replace(/&?page=\d+/, '').replace(/\?$/, '');
    const finalSeparator = cleanBaseUrl.includes('?') ? '&' : '?';
    return `${cleanBaseUrl}${finalSeparator}page=${page}`;
  };

  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
      {currentPage > 1 ? (
        <Link href={createPageUrl(currentPage - 1)} className="px-3 py-1 border rounded-md hover:bg-gray-50">
          Prev
        </Link>
      ) : (
        <button disabled className="px-3 py-1 border rounded-md text-gray-400 cursor-not-allowed">
          Prev
        </button>
      )}

      <span className="text-sm font-medium text-gray-700">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link href={createPageUrl(currentPage + 1)} className="px-3 py-1 border rounded-md hover:bg-gray-50">
          Next
        </Link>
      ) : (
        <button disabled className="px-3 py-1 border rounded-md text-gray-400 cursor-not-allowed">
          Next
        </button>
      )}
    </div>
  );
};