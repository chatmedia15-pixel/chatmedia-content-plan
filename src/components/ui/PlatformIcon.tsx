import { Camera, Music2 } from "lucide-react";

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  if (platform === "Instagram") return <Camera className={className} />;
  return <Music2 className={className} />;
}
