'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Pencil } from 'lucide-react';

// Floating "Edit" button shown only to admin / web_designer while viewing
// a public page, post or product. Links to the matching admin editor.
export function EditContentButton({ href, label }: { href: string; label?: string }) {
  const { data: session } = useSession() || {};
  const role = (session?.user as any)?.role;
  if (role !== 'admin' && role !== 'web_designer') return null;

  return (
    <Link
      href={href}
      title="Chỉnh sửa nội dung"
      className="fixed top-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg ring-1 ring-black/5 transition hover:opacity-90 hover:shadow-xl"
    >
      <Pencil className="h-4 w-4" />
      {label || 'Chỉnh sửa'}
    </Link>
  );
}
