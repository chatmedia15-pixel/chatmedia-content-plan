import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authService } from "@/features/auth/auth.service";
import { useSession } from "@/features/auth/useSession";

export function LoginPage() {
  const { session, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sudah login? Langsung lempar ke beranda.
  if (!sessionLoading && session) {
    return <Navigate to="/beranda" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await authService.signIn(email.trim(), password);
      navigate("/beranda", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal masuk.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <img
            src="/logo-chat.jpeg"
            alt="Chatmedia Logo"
            className="mx-auto mb-4 h-20 w-20 rounded-xl object-contain"
          />
          <h1 className="text-xl font-semibold text-ink">Content Plan</h1>
          <p className="mt-1 text-sm text-sub">Chatmedia Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary disabled:opacity-60"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary disabled:opacity-60"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Memproses…
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-sub">
          Hubungi admin untuk mendapatkan akses.
        </p>
      </div>
    </div>
  );
}
