"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Tabs under the header for Danny and Aníbal. */
export function StaffNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="mb-5 flex gap-1 border-b border-slate-200" aria-label="Menu">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex h-12 items-center border-b-[3px] px-4 text-base font-semibold ${
              active ? "border-navy text-navy" : "border-transparent text-slate-500"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
