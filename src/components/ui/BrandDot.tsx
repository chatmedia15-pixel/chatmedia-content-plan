import { brandColor } from "@/lib/format";

interface BrandDotProps {
  id: string;
  size?: number;
}

export function BrandDot({ id, size = 8 }: BrandDotProps) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: brandColor(id) }}
    />
  );
}
