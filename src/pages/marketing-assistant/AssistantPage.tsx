import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Trash2, MessageSquare } from "lucide-react";
import { Card, SectionHeader, AiBadge, Pill } from "@/components/ui";
import { useGenerateCaption } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { BRANDS } from "@/lib/constants";

// ─────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────
const STORAGE_KEY = "chatmedia:assistant-messages";
const BRAND_KEY = "chatmedia:assistant-brand";
const MAX_MESSAGES = 50;

interface Message {
  role: "user" | "ai";
  text: string;
  time: number;
}

const WELCOME: Message = {
  role: "ai",
  text: `Halo! Saya asisten marketing untuk brand ChatBarber, Chat Shoe Treatment, Chatbox, dan Chttn Basic.

Saya bisa membantu Anda:
• Menulis caption
• Membuat hook menarik
• Memberi ide konten
• Menyusun strategi

Apa yang bisa saya bantu?`,
  time: Date.now(),
};

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME];
    return parsed;
  } catch {
    return [WELCOME];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    // Batasi history
    const trimmed = msgs.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

function loadBrand(): string {
  try {
    return localStorage.getItem(BRAND_KEY) ?? BRANDS[0].id;
  } catch {
    return BRANDS[0].id;
  }
}

function saveBrand(id: string) {
  try {
    localStorage.setItem(BRAND_KEY, id);
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────
// Komponen
// ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Buat caption promosi untuk haircut baru",
  "Ide konten TikTok untuk treatment sepatu",
  "Hook menarik untuk konten cafe",
  "Caption untuk produk apparel custom",
  "Strategi konten seminggu untuk barbershop",
];

export function AssistantPage() {
  const { push } = useToast();
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [brand, setBrand] = useState<string>(() => loadBrand());
  const scrollRef = useRef<HTMLDivElement>(null);
  const genCaption = useGenerateCaption();

  // ── Auto-scroll ke bawah ──────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ── Persist messages ──────────────────────────
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // ── Persist brand ─────────────────────────────
  useEffect(() => {
    saveBrand(brand);
  }, [brand]);

  // ── Kirim pesan ───────────────────────────────
  async function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q || genCaption.isPending) return;

    const userMsg: Message = {
      role: "user",
      text: q,
      time: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const brandObj = BRANDS.find((b) => b.id === brand)!;
      const reply = await genCaption.mutateAsync({
        brand: brandObj.name,
        title: q,
        platform: "Instagram",
        pillar: brandObj.pillars[0],
      });

      const aiMsg: Message = {
        role: "ai",
        text: reply,
        time: Date.now(),
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal";
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `⚠️ Error: ${msg}`,
          time: Date.now(),
        },
      ]);
    }
  }

  // ── Clear chat ────────────────────────────────
  function handleClear() {
    if (messages.length <= 1) {
      push("Belum ada percakapan");
      return;
    }
    if (!confirm("Hapus semua percakapan?")) return;

    setMessages([
      {
        role: "ai",
        text: "Percakapan dibersihkan. Ada yang bisa saya bantu?",
        time: Date.now(),
      },
    ]);
    push("Percakapan dibersihkan");
  }

  // ── Ganti brand ───────────────────────────────
  function handleBrandChange(id: string) {
    setBrand(id);
    const brandObj = BRANDS.find((b) => b.id === id);
    if (brandObj) {
      push(`Konteks brand: ${brandObj.name}`);
    }
  }

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Asisten Marketing"
        desc="Chat dengan AI untuk bantuan strategi konten & copywriting."
      />

      <Card className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">AI Assistant</span>
            <AiBadge />
          </div>
          <div className="flex items-center gap-2">
            {messageCount > 0 && (
              <Pill tone="neutral">
                <MessageSquare className="h-3 w-3" />
                {messageCount} pesan
              </Pill>
            )}
            <Pill tone="blue">{BRANDS.find((b) => b.id === brand)?.name}</Pill>
            <button
              onClick={handleClear}
              disabled={messages.length <= 1}
              className="rounded-lg border border-line p-1.5 text-sub transition hover:bg-slate-50 disabled:opacity-40"
              title="Bersihkan percakapan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Brand selector */}
        <div className="border-b border-line bg-slate-50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium text-sub">
              Konteks brand:
            </span>
            {BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBrandChange(b.id)}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition"
                style={{
                  backgroundColor: brand === b.id ? b.color : "transparent",
                  color: brand === b.id ? "white" : "#5B6478",
                  border: `1px solid ${brand === b.id ? b.color : "#E7E9F0"}`,
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  backgroundColor: m.role === "user" ? "#2F5CFF" : "#F1F3F9",
                  color: m.role === "user" ? "white" : "#0F1729",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {genCaption.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-sub">
                <Loader2 className="h-3.5 w-3.5 animate-spin-slow text-ai" />
                AI sedang menulis…
              </div>
            </div>
          )}
        </div>

        {/* Suggestion chips */}
        {messages.length <= 2 && !genCaption.isPending && (
          <div className="border-t border-line px-4 py-2">
            <div className="mb-1.5 text-[10px] font-medium text-sub">
              Contoh pertanyaan:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[11px] text-sub transition hover:bg-primary-light hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !genCaption.isPending) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tulis pertanyaan atau permintaan…"
            disabled={genCaption.isPending}
            className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || genCaption.isPending}
            className="rounded-lg bg-primary p-2.5 text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {genCaption.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin-slow" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
