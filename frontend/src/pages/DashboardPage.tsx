import { FormEvent, type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DayPicker as ReactDayPicker } from "react-day-picker";
import { id } from "react-day-picker/locale";
import { ArrowDown, ArrowUp, CalendarDays, ChevronsUpDown, LayoutDashboard, List, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Pencil, Trash2, X } from "lucide-react";
import { apiFetch, clearSession, getStoredUser, navigate } from "../lib/api";

type License = {
  id: string;
  kode: string;
  kode2: string | null;
  nama: string;
  versi: string | null;
  tgl_status: string | null;
  tgl_expired: string;
  tgl_daftar: string;
  modul: string | null;
};

type Pagination = { page: number; limit: number; total: number; total_pages: number };
type LicenseSummary = { total_lisensi: number; status_aktif: number; status_expired: number };
type LicenseForm = { kode: string; kode2: string; nama: string; versi: string; tgl_expired: string; modul: string };
type SortKey = "nama" | "kode2" | "versi" | "modul" | "tgl_status" | "tgl_expired" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" } | null;

function DayPicker(props: ComponentProps<typeof ReactDayPicker>) {
  const currentYear = new Date().getFullYear();
  return <ReactDayPicker captionLayout="dropdown" startMonth={new Date(2000, 0)} endMonth={new Date(currentYear + 20, 11)} {...props} />;
}

function dateInputValue(value: string) { return value ? value.slice(0, 10) : ""; }
function displayDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function isExpired(value: string) {
  const expiry = new Date(`${dateInputValue(value)}T23:59:59`);
  return expiry.getTime() < Date.now();
}
function futureDate() {
  const date = new Date(); date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}
const emptyForm = (): LicenseForm => ({ kode: "", kode2: "", nama: "", versi: "", tgl_expired: futureDate(), modul: "" });
const MODULE_HINTS = [
  ["1", "BRI / Qlola"],
  ["2", "BCA"],
  ["3", "Mandiri MCM"],
  ["4", "BSI"],
  ["5", "Mandiri Bisnis"],
  ["6", "BNI Bisnis (BNI Direct)"],
  ["7", "BCA Bisnis"],
  ["8", "BNI"],
  ["9", "BCA QRIS"],
  ["10", "WA center"],
  ["11", "Kopra Mandiri"],
  ["12", "Qlola BRI"],
  ["13", "Kopra Mandiri New"],
  ["XLS", "Unlock fitur export Excel"],
] as const;

function getPageNumbers(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  if (currentPage >= totalPages - 3) return [1, "start-ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "start-ellipsis", currentPage - 1, currentPage, currentPage + 1, "end-ellipsis", totalPages];
}

async function readPayload(response: Response) {
  const payload = await response.json().catch(() => ({ message: "Respons server tidak valid" }));
  if (!response.ok) throw Object.assign(new Error(payload.message || "Permintaan gagal"), { status: response.status, details: payload.errors });
  return payload;
}

export default function DashboardPage() {
  const [items, setItems] = useState<License[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [summary, setSummary] = useState<LicenseSummary | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | "edit" | "delete" | "logout" | null>(null);
  const [selected, setSelected] = useState<License | null>(null);
  const [form, setForm] = useState<LicenseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState("Administrator");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const logoutForExpiredSession = useCallback(() => {
    clearSession();
    navigate("/login", true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      if (sort?.key === "tgl_status") {
        params.set("sort_by", "tgl_status");
        params.set("sort_order", sort.direction);
      }
      const response = await apiFetch(`/lisensi?${params}`);
      if (response.status === 401) return logoutForExpiredSession();
      const payload = await readPayload(response);
      setItems(payload.data);
      setPagination(payload.pagination);
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "Gagal memuat lisensi" });
    } finally { setLoading(false); }
  }, [limit, logoutForExpiredSession, page, search, sort?.direction, sort?.key]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch("/lisensi/summary");
      if (response.status === 401) return logoutForExpiredSession();
      const payload = await readPayload(response);
      setSummary(payload.data);
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "Gagal memuat summary lisensi" });
    }
  }, [logoutForExpiredSession]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => {
    try {
      const stored = getStoredUser();
      if (stored?.email) setUserEmail(stored.email);
    } catch { /* ignore invalid local profile */ }
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileSidebarOpen]);

  const sortedItems = useMemo(() => {
    if (!sort || sort.key === "tgl_status") return items;
    return [...items].sort((first, second) => {
      let firstValue: string | number;
      let secondValue: string | number;
      if (sort.key === "status") {
        firstValue = isExpired(first.tgl_expired) ? 1 : 0;
        secondValue = isExpired(second.tgl_expired) ? 1 : 0;
      } else if (sort.key === "tgl_expired" || sort.key === "tgl_status") {
        const firstDate = first[sort.key];
        const secondDate = second[sort.key];
        firstValue = firstDate ? new Date(firstDate.replace(" ", "T")).getTime() : 0;
        secondValue = secondDate ? new Date(secondDate.replace(" ", "T")).getTime() : 0;
      } else {
        firstValue = (first[sort.key] || "").toString();
        secondValue = (second[sort.key] || "").toString();
      }
      const comparison = typeof firstValue === "number"
        ? firstValue - (secondValue as number)
        : firstValue.localeCompare(secondValue as string, "id", { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [items, sort]);
  const pageNumbers = useMemo(() => getPageNumbers(page, Math.max(1, pagination.total_pages)), [page, pagination.total_pages]);
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const lastItem = Math.min(pagination.page * pagination.limit, pagination.total);

  function submitSearch(event: FormEvent) { event.preventDefault(); setPage(1); setSearch(query.trim()); }
  function toggleSort(key: SortKey) {
    if (key === "tgl_status") setPage(1);
    setSort((current) => current?.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "tgl_status" ? "desc" : "asc" });
  }
  function openEdit(item: License) {
    setSelected(item);
    setForm({ kode: item.kode, kode2: item.kode2 || "", nama: item.nama, versi: item.versi || "", tgl_expired: dateInputValue(item.tgl_expired), modul: item.modul || "" });
    setDialog("edit");
  }
  function openDelete(item: License) { setSelected(item); setDialog("delete"); }
  function openLogout() { setMobileSidebarOpen(false); setDialog("logout"); }
  function closeDialog() { if (!saving) { setDialog(null); setSelected(null); } }

  async function saveLicense(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const editing = dialog === "edit" && selected;
      const requestPayload = editing
        ? { nama: form.nama, tgl_expired: form.tgl_expired, modul: form.modul || null }
        : { ...form, kode2: form.kode2 || null, versi: form.versi || null, modul: form.modul || null };
      const response = await apiFetch(editing ? `/lisensi/${selected.id}` : "/lisensi", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (response.status === 401) return logoutForExpiredSession();
      const payload = await readPayload(response);
      setDialog(null); setSelected(null);
      setNotice({ type: "success", text: payload.message || `Lisensi berhasil ${editing ? "diperbarui" : "dibuat"}` });
      await Promise.all([load(), loadSummary()]);
    } catch (reason) {
      const error = reason as Error & { details?: string[] };
      setNotice({ type: "error", text: error.details?.join(" · ") || error.message || "Gagal menyimpan lisensi" });
    } finally { setSaving(false); }
  }

  async function deleteLicense() {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await apiFetch(`/lisensi/${selected.id}`, { method: "DELETE" });
      if (response.status === 401) return logoutForExpiredSession();
      const payload = await readPayload(response);
      setDialog(null); setSelected(null);
      setNotice({ type: "success", text: payload.message || "Lisensi berhasil dihapus" });
      await loadSummary();
      if (items.length === 1 && page > 1) setPage(page - 1); else await load();
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "Gagal menghapus lisensi" });
    } finally { setSaving(false); }
  }

  function confirmLogout() {
    setDialog(null);
    logoutForExpiredSession();
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {mobileSidebarOpen && <button type="button" className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] lg:hidden" aria-label="Tutup menu navigasi" onClick={() => setMobileSidebarOpen(false)} />}

      <aside
        id="dashboard-sidebar"
        aria-label="Navigasi dashboard"
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,280px)] flex-col border-r border-zinc-800 bg-[#18181b] p-4 text-white shadow-2xl transition-[width,transform] duration-200 lg:translate-x-0 lg:shadow-none ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[244px]"}`}
      >
        <div className={`flex h-12 items-center gap-3 px-2 ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-zinc-900">LB</span>
          <div className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}><p className="text-sm font-semibold">LisensiBank</p><p className="text-[11px] text-zinc-500">Control Center</p></div>
          <button type="button" className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Tutup sidebar" onClick={() => setMobileSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="mt-8 space-y-1">
          <p className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-600 ${sidebarCollapsed ? "lg:hidden" : ""}`}>Workspace</p>
          <a href="/dashboard" title={sidebarCollapsed ? "Ringkasan" : undefined} onClick={() => setMobileSidebarOpen(false)} className={`flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}><LayoutDashboard size={18} className="shrink-0" /><span className={sidebarCollapsed ? "lg:hidden" : ""}>Ringkasan</span></a>
          <button title={sidebarCollapsed ? "Daftar lisensi" : undefined} className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`} onClick={() => { setMobileSidebarOpen(false); document.getElementById("license-table")?.scrollIntoView({ behavior: "smooth" }); }}><List size={18} className="shrink-0" /><span className={sidebarCollapsed ? "lg:hidden" : ""}>Daftar lisensi</span></button>
        </nav>
        <div className="mt-auto border-t border-zinc-800 pt-4">
          <div className={`mb-3 flex items-center gap-3 px-2 ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">A</span><div className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}><p className="truncate text-xs font-medium">Administrator</p><p className="truncate text-[11px] text-zinc-500">{userEmail}</p></div></div>
          <button onClick={openLogout} title={sidebarCollapsed ? "Keluar dari akun" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}><LogOut size={17} className="shrink-0" /><span className={sidebarCollapsed ? "lg:hidden" : ""}>Keluar dari akun</span></button>
        </div>
      </aside>

      <main className={`transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[244px]"}`}>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden" aria-label="Buka sidebar" aria-controls="dashboard-sidebar" aria-expanded={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(true)}><Menu size={18} /></button>
            <button type="button" className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:grid" aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"} aria-controls="dashboard-sidebar" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((current) => !current)}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">Manajemen Lisensi</p><p className="hidden text-xs text-zinc-500 sm:block">Kelola akses addon bank</p></div>
          </div>
          <div className="flex items-center gap-2"><span className="desktop-only rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />API terhubung</span><button onClick={openLogout} className="btn btn-outline h-9 min-h-9 px-3 lg:hidden">Keluar</button></div>
        </header>

        <div className="mx-auto max-w-[1440px] p-5 lg:p-8">
          <div className="mb-7">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.15em] text-zinc-400">Dashboard operasional</p><h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Ringkasan lisensi</h1><p className="mt-2 text-sm text-zinc-500">Pantau dan perbarui akses aplikasi addon bank.</p></div>
          </div>

          <section className="mb-7 grid gap-3 sm:grid-cols-3">
            <Metric label="Total lisensi" value={summary?.total_lisensi ?? "—"} hint="Seluruh lisensi terdaftar" mark="∑" />
            <Metric label="Lisensi aktif" value={summary?.status_aktif ?? "—"} hint="Masa berlaku masih aktif" mark="✓" tone="green" />
            <Metric label="Lisensi expired" value={summary?.status_expired ?? "—"} hint="Masa berlaku telah berakhir" mark="!" tone="amber" />
          </section>

          <section id="license-table" className="card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
              <div><h2 className="text-base font-semibold">Daftar lisensi</h2><p className="mt-1 text-xs text-zinc-500"><strong className="font-semibold text-zinc-700">{pagination.total}</strong> total data · {pagination.total_pages} halaman</p></div>
              <form onSubmit={submitSearch} className="flex w-full gap-2 lg:w-auto"><input aria-label="Cari lisensi" className="input min-w-0 lg:w-[300px]" placeholder="Cari nama, kode, perangkat, modul..." value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn btn-outline">Cari</button>{search && <button type="button" className="btn btn-outline px-3" aria-label="Hapus pencarian" onClick={() => { setQuery(""); setSearch(""); setPage(1); }}>×</button>}</form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-500"><th className="px-5 py-2 font-semibold"><SortHeader label="Nama / kode" sortKey="nama" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Kode 2" sortKey="kode2" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Versi" sortKey="versi" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Modul" sortKey="modul" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Tanggal aktivitas" sortKey="tgl_status" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Berakhir" sortKey="tgl_expired" sort={sort} onSort={toggleSort} /></th><th className="px-4 py-2 font-semibold"><SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} /></th><th className="px-5 py-3 text-right font-semibold">Aksi</th></tr></thead>
                <tbody className="license-table-body">
                  {loading ? <LoadingRows /> : items.length === 0 ? <tr><td colSpan={8} className="px-5 py-16 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-400">⌕</div><p className="mt-3 font-medium">Tidak ada lisensi ditemukan</p><p className="mt-1 text-xs text-zinc-500">Coba kata kunci lain atau tambahkan lisensi baru.</p></td></tr> : sortedItems.map((item) => {
                    const expired = isExpired(item.tgl_expired);
                    return <tr key={item.id} className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/70"><td className="px-5 py-4"><p className="font-medium text-zinc-900">{item.nama}</p><p className="mt-1 font-mono text-[11px] text-zinc-500">{item.kode}</p></td><td className="px-4 py-4"><p className="max-w-[170px] truncate font-mono text-xs text-zinc-700" title={item.kode2 || ""}>{item.kode2 || "—"}</p></td><td className="px-4 py-4"><span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs">{item.versi || "—"}</span></td><td className="px-4 py-4"><div className="flex max-w-[220px] flex-wrap gap-1">{item.modul ? item.modul.split(",").slice(0, 3).map((module) => <span key={module} className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600">{module.trim()}</span>) : <span className="text-zinc-400">—</span>}</div></td><td className="px-4 py-4"><p className="whitespace-nowrap text-xs font-medium">{displayDate(item.tgl_status)}</p></td><td className="px-4 py-4"><p className="text-xs font-medium">{displayDate(item.tgl_expired)}</p><p className="mt-1 text-[11px] text-zinc-400">Daftar {displayDate(item.tgl_daftar)}</p></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${expired ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${expired ? "bg-amber-500" : "bg-emerald-500"}`} />{expired ? "Kedaluwarsa" : "Aktif"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(item)} className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label={`Ubah ${item.nama}`} title="Ubah lisensi"><Pencil size={15} /></button><button onClick={() => openDelete(item)} className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-700" aria-label={`Hapus ${item.nama}`} title="Hapus lisensi"><Trash2 size={15} /></button></div></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4 border-t border-zinc-200 px-5 py-4 text-xs text-zinc-500 xl:flex-row xl:items-center xl:justify-between">
              <p>Menampilkan <strong className="font-semibold text-zinc-700">{firstItem}–{lastItem}</strong> dari <strong className="font-semibold text-zinc-700">{pagination.total}</strong> data</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
                <label className="flex items-center gap-2 whitespace-nowrap">Baris per halaman
                  <select className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                    {[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-1" aria-label="Navigasi halaman">
                  <button type="button" title="Halaman pertama" aria-label="Halaman pertama" className="btn btn-outline h-8 min-h-8 w-8 px-0 text-sm" disabled={page <= 1 || loading} onClick={() => setPage(1)}>«</button>
                  <button type="button" title="Halaman sebelumnya" aria-label="Halaman sebelumnya" className="btn btn-outline h-8 min-h-8 w-8 px-0 text-sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>‹</button>
                  {pageNumbers.map((item) => typeof item === "number" ? <button type="button" key={item} aria-label={`Halaman ${item}`} aria-current={item === page ? "page" : undefined} className={`btn h-8 min-h-8 min-w-8 px-2 text-xs ${item === page ? "btn-primary" : "btn-outline"}`} disabled={loading} onClick={() => setPage(item)}>{item}</button> : <span key={item} className="grid h-8 w-7 place-items-center text-zinc-400">…</span>)}
                  <button type="button" title="Halaman berikutnya" aria-label="Halaman berikutnya" className="btn btn-outline h-8 min-h-8 w-8 px-0 text-sm" disabled={page >= pagination.total_pages || loading} onClick={() => setPage(page + 1)}>›</button>
                  <button type="button" title="Halaman terakhir" aria-label="Halaman terakhir" className="btn btn-outline h-8 min-h-8 w-8 px-0 text-sm" disabled={page >= pagination.total_pages || loading} onClick={() => setPage(Math.max(1, pagination.total_pages))}>»</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {notice && <div role="status" className={`fixed right-5 top-20 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${notice.type === "success" ? "border-emerald-200 bg-white text-emerald-800" : "border-red-200 bg-white text-red-700"}`}>{notice.text}</div>}

      {(dialog === "create" || dialog === "edit") && <LicenseDialog mode={dialog} form={form} setForm={setForm} saving={saving} onClose={closeDialog} onSubmit={saveLicense} />}
      {dialog === "delete" && selected && <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="card w-full max-w-md p-6"><div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50 font-bold text-red-600">!</div><h2 id="delete-title" className="text-lg font-semibold">Hapus lisensi?</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Lisensi <strong className="text-zinc-800">{selected.nama}</strong> dengan kode <span className="font-mono text-xs">{selected.kode}</span> akan dihapus permanen.</p><div className="mt-6 flex justify-end gap-2"><button className="btn btn-outline" onClick={closeDialog} disabled={saving}>Batal</button><button className="btn btn-danger" onClick={deleteLicense} disabled={saving}>{saving ? "Menghapus..." : "Ya, hapus"}</button></div></div></div>}
      {dialog === "logout" && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="card w-full max-w-md p-6"><div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-700"><LogOut size={20} /></div><h2 id="logout-title" className="text-lg font-semibold">Keluar dari akun?</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Anda akan keluar dari dashboard manajemen lisensi dan perlu login kembali untuk melanjutkan.</p><div className="mt-6 flex justify-end gap-2"><button type="button" className="btn btn-outline" onClick={closeDialog}>Batal</button><button type="button" className="btn btn-primary" onClick={confirmLogout}>Ya, keluar</button></div></div></div>}
    </div>
  );
}

function Metric({ label, value, hint, mark, tone }: { label: string; value: number | string; hint: string; mark: string; tone?: "green" | "amber" }) {
  const color = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600";
  return <div className="card p-5"><div className="flex items-start justify-between"><p className="text-xs font-medium text-zinc-500">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${color}`}>{mark}</span></div><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1.5 text-[11px] text-zinc-400">{hint}</p></div>;
}

function LoadingRows() {
  return <>{Array.from({ length: 5 }, (_, index) => <tr key={index} className="border-b border-zinc-100"><td colSpan={8} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-zinc-100" /></td></tr>)}</>;
}

function LicenseDialog({ mode, form, setForm, saving, onClose, onSubmit }: { mode: "create" | "edit"; form: LicenseForm; setForm: (value: LicenseForm) => void; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!calendarOpen) return;

    function closeOnOutsideInteraction(event: MouseEvent | TouchEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCalendarOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideInteraction);
    document.addEventListener("touchstart", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideInteraction);
      document.removeEventListener("touchstart", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [calendarOpen]);
  const field = (key: keyof LicenseForm) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: event.target.value }) });
  const selectedDate = form.tgl_expired ? new Date(`${form.tgl_expired}T00:00:00`) : undefined;
  return <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="license-dialog-title"><div className="card my-6 w-full max-w-2xl overflow-visible"><div className="flex items-start justify-between border-b border-zinc-200 px-6 py-5"><div><h2 id="license-dialog-title" className="text-lg font-semibold">{mode === "create" ? "Tambah lisensi baru" : "Ubah lisensi"}</h2><p className="mt-1 text-xs text-zinc-500">{mode === "create" ? "Lengkapi identitas dan masa berlaku lisensi." : "Ubah nama, tanggal expired, atau modul lisensi."}</p></div><button aria-label="Tutup dialog" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">×</button></div><form onSubmit={onSubmit}><div className="grid gap-5 p-6 sm:grid-cols-2">{mode === "edit" && <div className="sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Identitas lisensi</p><div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs"><span>Kode: <strong className="font-mono text-zinc-700">{form.kode}</strong></span><span>Perangkat: <strong className="font-mono text-zinc-700">{form.kode2 || "—"}</strong></span><span>Versi: <strong className="font-mono text-zinc-700">{form.versi || "—"}</strong></span></div></div>}<div className={mode === "edit" ? "sm:col-span-2" : ""}><label className="label" htmlFor="nama">Nama lisensi *</label><input id="nama" className="input" placeholder="Bank Contoh" maxLength={255} required {...field("nama")} /></div>{mode === "create" && <><div><label className="label" htmlFor="kode">Kode lisensi *</label><input id="kode" className="input font-mono" placeholder="ABC123" maxLength={255} required {...field("kode")} /></div><div><label className="label" htmlFor="kode2">ID perangkat</label><input id="kode2" className="input font-mono" placeholder="DEVICE01" maxLength={255} {...field("kode2")} /></div><div><label className="label" htmlFor="versi">Versi aplikasi</label><input id="versi" className="input font-mono" placeholder="1.0.0" maxLength={100} {...field("versi")} /></div></>}<div className="sm:col-span-2"><label className="label" htmlFor={mode === "create" ? "expired" : "expired-picker"}>Tanggal expired *</label>{mode === "create" ? <input id="expired" className="input" type="date" required {...field("tgl_expired")} /> : <div ref={calendarRef} className="relative"><button id="expired-picker" type="button" aria-haspopup="dialog" aria-expanded={calendarOpen} className="input flex items-center justify-between text-left" onClick={() => setCalendarOpen(!calendarOpen)}><span className={selectedDate ? "text-zinc-900" : "text-zinc-400"}>{selectedDate ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(selectedDate) : "Pilih tanggal expired"}</span><CalendarDays size={16} className="text-zinc-400" aria-hidden="true" /></button>{calendarOpen && <div className="absolute left-0 top-12 z-50 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"><DayPicker mode="single" locale={id} selected={selectedDate} defaultMonth={selectedDate} onSelect={(date) => { if (!date) return; const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); setForm({ ...form, tgl_expired: `${year}-${month}-${day}` }); setCalendarOpen(false); }} /></div>}</div>}</div><div className="sm:col-span-2"><label className="label" htmlFor="modul">Modul</label><textarea id="modul" className="input" placeholder="Contoh: 1, 2, XLS" aria-describedby={mode === "edit" ? "modul-help modul-options" : "modul-help"} {...field("modul")} /><p id="modul-help" className="mt-1.5 text-[11px] text-zinc-400">Pisahkan beberapa modul dengan tanda titik koma (;).</p>{mode === "edit" && <div id="modul-options" className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs font-semibold text-zinc-700">Modul Addon Bank</p><dl className="mt-2 grid gap-x-5 gap-y-1.5 text-[11px] leading-4 text-zinc-600 sm:grid-cols-2">{MODULE_HINTS.map(([code, description]) => <div key={code} className="grid grid-cols-[2.25rem_1fr] gap-1"><dt className="font-mono font-semibold text-zinc-800">{code}</dt><dd>{description}</dd></div>)}</dl></div>}</div></div><div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-200 bg-zinc-50 px-6 py-4"><button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Batal</button><button className="btn btn-primary" disabled={saving}>{saving && <span className="spinner" />}{saving ? "Menyimpan..." : mode === "create" ? "Buat lisensi" : "Simpan perubahan"}</button></div></form></div></div>;
}

function SortHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return <button type="button" className="flex items-center gap-1.5 rounded-md py-1.5 text-left hover:text-zinc-900" onClick={() => onSort(sortKey)} aria-label={`Urutkan berdasarkan ${label}`}><span>{label}</span><Icon size={13} className={active ? "text-zinc-900" : "text-zinc-400"} /></button>;
}
