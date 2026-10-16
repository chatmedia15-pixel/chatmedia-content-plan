import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Card, SectionHeader, AiBadge, Pill } from "@/components/ui";
import { useGenerateCaption } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { BRANDS } from "@/lib/constants";

interface Message {
  role: "user" | "ai";
  text: string;
  time: number;
}

const SUGGESTIONS = [
  "Buat caption promosi untuk haircut baru",
  "Ide konten TikTok untuk treatment sepatu",
  "Hook menarik untuk konten cafe",
  "Caption untuk produk apparel custom",
  "Strategi konten seminggu untuk barbershop",
];

export function AssistantPage() {
  const { push } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Halo! Saya asisten marketing untuk brand ChatBarber, Chat Shoe Treatment, Chatbox, dan Chttn Basic.\n\nSaya bisa membantu Anda:\n• Menulis caption\n• Membuat hook menarik\n• Memberi ide konten\n• Menyusun strategi\n\nApa yang bisa saya bantu?",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [brand, setBrand] = useState(BRANDS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genCaption = useGenerateCaption();

  // Auto-scroll ke bawah
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q || genCaption.isPending) return;

    // Tambah pesan user
    setMessages((m) => [...m, { role: "user", text: q, time: Date.now() }]);
    setInput("");

    try {
      const brandObj = BRANDS.find((b) => b.id === brand)!;
      const reply = await genCaption.mutateAsync({
        brand: brandObj.name,
        title: q,
        platform: "Instagram",
        pillar: brandObj.pillars[0],
      });

      setMessages((m) => [...m, { role: "ai", text: reply, time: Date.now() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal";
      setMessages((m) => [
        ...m,
        { role: "ai", text: `⚠️ Error: ${msg}`, time: Date.now() },
      ]);
    }
  }

  function handleClear() {
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
            <Pill tone="blue">{BRANDS.find((b) => b.id === brand)?.name}</Pill>
            <button
              onClick={handleClear}
              className="rounded-lg border border-line p-1.5 text-sub transition hover:bg-slate-50"
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
                onClick={() => setBrand(b.id)}
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

        {/* Suggestion chips (hanya saat chat masih pendek) */}
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
