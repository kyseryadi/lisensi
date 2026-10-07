import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch, navigate, saveSession } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }, false);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Login gagal");
      saveSession(payload.data.token, payload.data.user);
      navigate("/dashboard", true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login gagal");
    } finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-4 py-10">
      <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center space-y-2 sm:p-8">
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-xs font-bold text-white">LB</span>
          <h1 className="text-xl font-medium tracking-tight">LisensiBank</h1>
        </div>

        <section className="card overflow-hidden">
          <header className="px-6 pb-3 pt-6">
            <h2 className="text-lg font-semibold tracking-tight">Masuk</h2>
            <p className="mt-1.5 text-sm leading-5 text-zinc-500">
              Masukkan email dan password untuk<br className="hidden sm:block" /> mengakses dashboard lisensi.
            </p>
          </header>

          <form onSubmit={submit}>
            <div className="grid gap-4 px-6 py-3">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" autoComplete="email" placeholder="nama@contoh.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input id="password" className="input pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
                  <button type="button" className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900" aria-label={showPassword ? "Sembunyikan password" : "Lihat password"} title={showPassword ? "Sembunyikan password" : "Lihat password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
              <button className="btn btn-primary mt-1 w-full" disabled={loading}>{loading && <span className="spinner" />}{loading ? "Memverifikasi..." : "Masuk"}</button>
            </div>
          </form>

          <footer className="px-8 pb-6 pt-4 text-center text-xs leading-5 text-zinc-500">
            Dengan masuk, Anda menyetujui kebijakan akses dan keamanan sistem.
          </footer>
        </section>
      </div>
    </main>
  );
}
