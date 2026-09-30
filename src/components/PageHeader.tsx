"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N

// A Client Component so the title follows the language toggle immediately. A Server Component would keep
// the language it was rendered with until the page is fetched again.
// `string` is allowed for titles that are data rather than a label, like a group's name.
export default function PageHeader({ title }: { title: Text | string }) {
  const { t } = useLanguage(); // I18N

  return (
    <header className="sticky top-0 border-b bg-gray-50 py-3 text-center font-semibold text-blue-500">
      {typeof title === "string" ? title : t(title)}
    </header>
  );
}
