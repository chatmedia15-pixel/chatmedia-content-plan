// ── Tipe dasar ─────────────────────────────────────────
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Lightbulb,
  CalendarRange,
  CalendarDays,
  Archive,
  MessageSquare,
  CheckCircle2,
  FlaskConical,
  Users,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type BrandId = string;
export type Platform = "Instagram" | "TikTok";
export type ProductionStatus =
  | "Ide"
  | "Direncanakan"
  | "Produksi"
  | "Editing"
  | "Siap Publikasi";
export type Objective = "Jangkauan" | "Interaksi" | "Konversi";
export type WorkflowStage = "planning" | "calendar" | "published";

export interface Brand {
  id: BrandId;
  slug: string;
  name: string;
  category: string;
  color: string;
  pillars: string[];
  ideas: string[];
}

// ── Brand bawaan (PRD §3.1) ────────────────────────────
export const BRANDS: Brand[] = [
  {
    id: "5ba0cdfc-5446-4eb7-bdce-f17b4ab55353",
    slug: "chatbarber",
    name: "ChatBarber",
    category: "Barber & Grooming",
    color: "#2F5CFF",
    pillars: [
      "Transformation",
      "Edukasi",
      "Behind the Scene",
      "Lifestyle",
      "Entertainment",
    ],
    ideas: [
      "Before & After haircut",
      "Transformasi gaya rambut",
      "Tips memilih haircut",
      "Kesalahan memilih gaya rambut",
      "Barber POV",
      "Behind the scene",
      "Reaksi pelanggan",
      "Tren haircut",
      "Barber tools",
      "Haircut + shoe treatment lifestyle",
    ],
  },
  {
    id: "798f3bbc-9053-4354-810b-0a4f0ef025f8",
    slug: "shoetreatment",
    name: "Chat Shoe Treatment",
    category: "Shoe Care",
    color: "#0EA5A4",
    pillars: [
      "Transformation",
      "Edukasi",
      "Testimonial",
      "Product/Service",
      "Storytelling",
    ],
    ideas: [
      "Before & After",
      "Sepatu hampir dibuang",
      "Kesalahan mencuci sepatu",
      "Tips merawat sneakers",
      "Sepatu putih menguning",
      "Deep Cleaning",
      "Fast Cleaning",
      "Proses treatment",
      "Reaksi pelanggan",
      "Tips menjaga sepatu",
    ],
  },
  {
    id: "8c2b7e25-0cf1-4d51-9721-04d10fc09cd0",
    slug: "chatbox",
    name: "Chatbox",
    category: "Cafe & Lifestyle",
    color: "#D97706",
    pillars: [
      "Lifestyle",
      "Community",
      "Behind the Scene",
      "Product/Service",
      "Storytelling",
    ],
    ideas: [
      "Suasana cafe",
      "Morning coffee",
      "Menu favorit",
      "Behind the scene barista",
      "Cerita menu",
      "Lifestyle",
      "Nongkrong",
      "Customer experience",
      "Rekomendasi menu",
      "Community moment",
    ],
  },
  {
    id: "d5fb99b0-d69f-4108-98f2-8511d297ea26",
    slug: "konveksi",
    name: "Chttn Basic",
    category: "Custom Apparel",
    color: "#7C3AED",
    pillars: [
      "Behind the Scene",
      "Product/Service",
      "Edukasi",
      "Storytelling",
      "Promotion",
    ],
    ideas: [
      "Proses produksi",
      "Desain menjadi produk",
      "Behind the scene",
      "Pemilihan bahan",
      "Detail jahitan",
      "Custom apparel",
      "Packaging",
      "Hasil produksi",
      "Kesalahan memilih bahan",
      "Produk dari nol sampai jadi",
    ],
  },
];

export const BRAND_MAP: Record<string, Brand> = Object.fromEntries(
  BRANDS.map((b) => [b.id, b]),
);

export const BRAND_BY_SLUG: Record<string, Brand> = Object.fromEntries(
  BRANDS.map((b) => [b.slug, b]),
);

// ── Platform & format (PRD §3.2) ───────────────────────
export const PLATFORMS: Platform[] = ["Instagram", "TikTok"];

export const FORMATS: Record<Platform, string[]> = {
  Instagram: ["Reels", "Feed", "Carousel", "Story"],
  TikTok: ["Video", "Photo Mode"],
};

export const OBJECTIVES: Objective[] = ["Jangkauan", "Interaksi", "Konversi"];

export const PRODUCTION_STATUSES: ProductionStatus[] = [
  "Ide",
  "Direncanakan",
  "Produksi",
  "Editing",
  "Siap Publikasi",
];

export const WORKFLOW_STAGES: WorkflowStage[] = [
  "planning",
  "calendar",
  "published",
];

export const CONTENT_STYLES = [
  "Edukatif",
  "Santai",
  "Gen Z",
  "Storytelling",
  "Lifestyle",
  "Entertainment",
  "Profesional",
  "Promosi",
  "Behind the Scene",
];

// ── Status styling ─────────────────────────────────────
export const STATUS_STYLE: Record<
  string,
  { bg: string; fg: string; dot: string; gradient: string }
> = {
  Ide: {
    bg: "#EEF1F6",
    fg: "#5B6478",
    dot: "#94A3B8",
    gradient: "linear-gradient(135deg, #94A3B8, #64748B)",
  },
  Direncanakan: {
    bg: "#FEF6E7",
    fg: "#D97706",
    dot: "#D97706",
    gradient: "linear-gradient(135deg, #FBBF24, #D97706)",
  },
  Produksi: {
    bg: "#EEF2FF",
    fg: "#2F5CFF",
    dot: "#2F5CFF",
    gradient: "linear-gradient(135deg, #60A5FA, #2F5CFF)",
  },
  Editing: {
    bg: "#F5F3FF",
    fg: "#7C3AED",
    dot: "#7C3AED",
    gradient: "linear-gradient(135deg, #A78BFA, #7C3AED)",
  },
  "Siap Publikasi": {
    bg: "#EAFBF1",
    fg: "#16A34A",
    dot: "#16A34A",
    gradient: "linear-gradient(135deg, #4ADE80, #16A34A)",
  },
  "Sudah Dipublikasi": {
    bg: "#EAFBF1",
    fg: "#16A34A",
    dot: "#16A34A",
    gradient: "linear-gradient(135deg, #4ADE80, #16A34A)",
  },
};

export function statusStyle(s: string) {
  return STATUS_STYLE[s] ?? STATUS_STYLE["Ide"];
}

// ── Navigasi ───────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  path: string;
  group: string;
  icon: LucideIcon;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Utama",
    items: [
      {
        id: "beranda",
        label: "Beranda",
        path: "/beranda",
        group: "Utama",
        icon: LayoutDashboard,
      },
      {
        id: "analitik",
        label: "Analitik",
        path: "/analitik",
        group: "Utama",
        icon: BarChart3,
      },
      {
        id: "insight",
        label: "Insight AI",
        path: "/insight",
        group: "Utama",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Produksi Konten",
    items: [
      {
        id: "ide",
        label: "Ide Konten",
        path: "/ide",
        group: "Produksi",
        icon: Lightbulb,
      },
      {
        id: "rencana30",
        label: "Perencanaan 30 Hari",
        path: "/rencana",
        group: "Produksi",
        icon: CalendarRange,
      },
      {
        id: "kalender",
        label: "Kalender Konten",
        path: "/kalender",
        group: "Produksi",
        icon: CalendarDays,
      },
      {
        id: "dipublikasi",
        label: "Konten Dipublikasi",
        path: "/dipublikasi",
        group: "Produksi",
        icon: Archive,
      },
    ],
  },
  {
    label: "Riset & AI",
    items: [
      {
        id: "asisten",
        label: "Asisten Marketing",
        path: "/asisten",
        group: "Riset",
        icon: MessageSquare,
      },
      {
        id: "cek",
        label: "Cek Konten",
        path: "/cek",
        group: "Riset",
        icon: CheckCircle2,
      },
      {
        id: "lab",
        label: "Lab Eksperimen",
        path: "/lab",
        group: "Riset",
        icon: FlaskConical,
      },
      {
        id: "kompetitor",
        label: "Kompetitor",
        path: "/kompetitor",
        group: "Riset",
        icon: Users,
      },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        id: "laporan",
        label: "Laporan",
        path: "/laporan",
        group: "Laporan",
        icon: FileText,
      },
      {
        id: "pengaturan",
        label: "Pengaturan",
        path: "/pengaturan",
        group: "Laporan",
        icon: Settings,
      },
    ],
  },
];

export const NAV_ALL: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
