import { Card } from "@/components/ui";

interface PlaceholderPageProps {
  title: string;
  desc?: string;
}

export function PlaceholderPage({ title, desc }: PlaceholderPageProps) {
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-sub">
        {desc ?? "Halaman ini akan diimplementasikan pada langkah berikutnya."}
      </p>
    </Card>
  );
}
