export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 border-b bg-gray-50 py-3 text-center font-semibold text-blue-500">
      {title}
    </header>
  );
}
