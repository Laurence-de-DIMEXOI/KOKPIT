"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  PackageSearch,
  Plus,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Ship,
  Check,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 20;

const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: "En attente", cls: "bg-amber-100 text-amber-800" },
  CONTACTE: { label: "Contacté", cls: "bg-blue-100 text-blue-800" },
  SATISFAIT: { label: "Satisfait", cls: "bg-green-100 text-green-800" },
  ANNULE: { label: "Annulé", cls: "bg-gray-100 text-gray-500" },
};
const STATUTS = ["EN_ATTENTE", "CONTACTE", "SATISFAIT", "ANNULE"];
const CATEGORIES = ["CUISINE", "DRESSING", "SALON", "SDB", "AUTRE"];

interface BesoinMatch {
  id: string;
  bcdi: string;
  imp: string;
  navire: string | null;
  descMeuble: string;
  score: number;
  dateArrivee: string | null;
  statut: string;
}
interface Besoin {
  id: string;
  reference: string;
  nomClient: string;
  telephone: string | null;
  email: string | null;
  recherche: string;
  motsCles: string | null;
  categorie: string | null;
  delai: string | null;
  statut: string;
  notes: string | null;
  createdAt: string;
  createdBy?: { nom: string; prenom: string };
  matches: BesoinMatch[];
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function BesoinsClientsPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<Besoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Besoin | null>(null);

  const fetchItems = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (statutFilter !== "ALL") p.set("statut", statutFilter);
      p.set("page", String(page));
      p.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/commercial/besoins-clients?${p}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
        setTotal(data.pagination.total);
      } else addToast(data.error || "Erreur de chargement", "error");
    } catch {
      addToast("Erreur de connexion", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statutFilter, addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingMatches = (b: Besoin) => b.matches.filter((m) => m.statut === "SUGGERE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-[#4C9DB0]" /> Besoins clients
          </h1>
          <p className="text-cockpit-secondary text-xs sm:text-sm">
            {total} besoin{total > 1 ? "s" : ""} — alerte quand un meuble stock correspondant arrive par container
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm shadow-cockpit-sm"
          style={{ background: "linear-gradient(135deg,#4C9DB0,#7Fc4d4)" }}
        >
          <Plus className="w-4 h-4" /> Nouveau besoin
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cockpit-secondary" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Rechercher client, meuble, mot-clé…"
            className="w-full pl-9 pr-3 py-2 border border-cockpit rounded-lg bg-cockpit-card text-sm text-cockpit-primary"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => { setPage(1); setStatutFilter(e.target.value); }}
          className="px-3 py-2 border border-cockpit rounded-lg bg-cockpit-card text-sm text-cockpit-primary"
        >
          <option value="ALL">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{STATUT_BADGE[s].label}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4C9DB0]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-cockpit-secondary text-sm">Aucun besoin client pour l'instant.</div>
      ) : (
        <div className="bg-cockpit-card border border-cockpit rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cockpit-dark/40 text-cockpit-secondary text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Client</th>
                <th className="text-left px-4 py-2 font-medium">Recherche</th>
                <th className="text-left px-4 py-2 font-medium">Délai</th>
                <th className="text-left px-4 py-2 font-medium">Statut</th>
                <th className="text-left px-4 py-2 font-medium">Arrivage</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const pend = pendingMatches(b);
                return (
                  <tr key={b.id} onClick={() => setSelected(b)}
                    className="border-t border-cockpit hover:bg-cockpit-dark/20 cursor-pointer">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-cockpit-heading">{b.nomClient}</div>
                      <div className="text-[11px] text-cockpit-secondary">{b.reference}{b.telephone ? ` · ${b.telephone}` : ""}</div>
                    </td>
                    <td className="px-4 py-2.5 text-cockpit-primary max-w-[280px]">
                      <div className="truncate">{b.recherche}</div>
                      {b.categorie && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#4C9DB0]/15 text-[#4C9DB0]">{b.categorie}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-cockpit-secondary text-xs">{b.delai || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUT_BADGE[b.statut]?.cls || ""}`}>
                        {STATUT_BADGE[b.statut]?.label || b.statut}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {pend > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          <Ship className="w-3 h-3" /> {pend} en mer
                        </span>
                      ) : <span className="text-cockpit-secondary/50 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded border border-cockpit disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-cockpit-secondary">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded border border-cockpit disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && <BesoinForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); setPage(1); fetchItems(false); }} />}
      {selected && <BesoinDrawer besoin={selected} onClose={() => setSelected(null)} onChanged={() => fetchItems(false)} />}
    </div>
  );
}

// ── Formulaire création ──────────────────────────────────────────────
function BesoinForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { addToast } = useToast();
  const [f, setF] = useState({ nomClient: "", telephone: "", email: "", recherche: "", motsCles: "", categorie: "", delai: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.nomClient.trim() || !f.recherche.trim()) { addToast("Nom et recherche obligatoires", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/commercial/besoins-clients", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
      });
      if (res.ok) { addToast("Besoin créé", "success"); onCreated(); }
      else { const d = await res.json(); addToast(d.error || "Erreur", "error"); }
    } catch { addToast("Erreur de connexion", "error"); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cockpit-card border-l border-cockpit shadow-xl overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-cockpit-heading">Nouveau besoin client</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-cockpit-secondary" /></button>
        </div>
        <Field label="Nom du client *"><input className="inp" value={f.nomClient} onChange={(e) => set("nomClient", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone"><input className="inp" value={f.telephone} onChange={(e) => set("telephone", e.target.value)} /></Field>
          <Field label="Email"><input className="inp" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        </div>
        <Field label="Ce que cherche le client *"><textarea className="inp" rows={2} value={f.recherche} onChange={(e) => set("recherche", e.target.value)} placeholder="ex. table basse teck 120cm" /></Field>
        <Field label="Mots-clés (pour l'alerte, séparés par virgule)"><input className="inp" value={f.motsCles} onChange={(e) => set("motsCles", e.target.value)} placeholder="table basse, teck" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select className="inp" value={f.categorie} onChange={(e) => set("categorie", e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Délai souhaité"><input className="inp" value={f.delai} onChange={(e) => set("delai", e.target.value)} placeholder="avant septembre" /></Field>
        </div>
        <Field label="Notes"><textarea className="inp" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <button onClick={submit} disabled={saving}
          className="w-full py-2.5 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#4C9DB0,#7Fc4d4)" }}>
          {saving ? "Enregistrement…" : "Créer le besoin"}
        </button>
      </div>
      <style jsx>{`.inp{width:100%;padding:0.5rem 0.65rem;border:1px solid var(--color-cockpit-border,#d8dee9);border-radius:0.5rem;background:var(--color-cockpit-input,#fff);font-size:0.875rem}`}</style>
    </div>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-cockpit-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

// ── Drawer détail + matches ──────────────────────────────────────────
function BesoinDrawer({ besoin, onClose, onChanged }: { besoin: Besoin; onClose: () => void; onChanged: () => void }) {
  const { addToast } = useToast();
  const [statut, setStatut] = useState(besoin.statut);
  const [notes, setNotes] = useState(besoin.notes || "");
  const [matches, setMatches] = useState<BesoinMatch[]>(besoin.matches);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/commercial/besoins-clients/${besoin.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut, notes }),
      });
      if (res.ok) { addToast("Mis à jour", "success"); onChanged(); onClose(); }
      else addToast("Erreur", "error");
    } catch { addToast("Erreur de connexion", "error"); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm("Supprimer ce besoin ?")) return;
    const res = await fetch(`/api/commercial/besoins-clients/${besoin.id}`, { method: "DELETE" });
    if (res.ok) { addToast("Supprimé", "success"); onChanged(); onClose(); }
    else addToast("Erreur", "error");
  };

  const setMatch = async (m: BesoinMatch, s: string) => {
    const res = await fetch(`/api/commercial/besoins-clients/matches/${m.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: s }),
    });
    if (res.ok) { setMatches((prev) => prev.map((x) => x.id === m.id ? { ...x, statut: s } : x)); onChanged(); }
    else addToast("Erreur", "error");
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cockpit-card border-l border-cockpit shadow-xl overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-cockpit-heading">{besoin.nomClient}</h2>
            <div className="text-[11px] text-cockpit-secondary">{besoin.reference}</div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-cockpit-secondary" /></button>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-cockpit-primary">
          {besoin.telephone && <a href={`tel:${besoin.telephone}`} className="inline-flex items-center gap-1 text-[#4C9DB0]"><Phone className="w-3.5 h-3.5" />{besoin.telephone}</a>}
          {besoin.email && <a href={`mailto:${besoin.email}`} className="inline-flex items-center gap-1 text-[#4C9DB0]"><Mail className="w-3.5 h-3.5" />{besoin.email}</a>}
        </div>

        <div className="text-sm text-cockpit-primary bg-cockpit-dark/20 rounded-lg p-3">
          <div className="font-medium mb-1">Recherche</div>
          {besoin.recherche}
          {besoin.motsCles && <div className="mt-1 text-xs text-cockpit-secondary">Mots-clés : {besoin.motsCles}</div>}
          {besoin.delai && <div className="mt-1 text-xs text-cockpit-secondary">Délai : {besoin.delai}</div>}
        </div>

        {/* Matches / arrivages */}
        <div>
          <div className="text-xs font-semibold text-cockpit-secondary mb-1.5 flex items-center gap-1"><Ship className="w-3.5 h-3.5" /> Arrivages correspondants</div>
          {matches.length === 0 ? (
            <div className="text-xs text-cockpit-secondary/60">Aucune correspondance détectée pour l'instant.</div>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className={`border rounded-lg p-2.5 text-xs ${m.statut === "IGNORE" ? "opacity-50 border-cockpit" : "border-orange-200 bg-orange-50/50"}`}>
                  <div className="font-medium text-cockpit-heading">{m.descMeuble}</div>
                  <div className="text-cockpit-secondary">{m.bcdi} · {m.imp}{m.navire ? ` · ${m.navire}` : ""} · arrivée {fmtDate(m.dateArrivee)}</div>
                  {m.statut === "SUGGERE" ? (
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => setMatch(m, "CONFIRME")} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white"><Check className="w-3 h-3" /> C'est ça</button>
                      <button onClick={() => setMatch(m, "IGNORE")} className="px-2 py-1 rounded border border-cockpit text-cockpit-secondary">Ignorer</button>
                    </div>
                  ) : (
                    <div className="mt-1 font-semibold">{m.statut === "CONFIRME" ? "✅ Confirmé — à rappeler" : "Ignoré"}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="Statut">
          <select className="w-full px-2.5 py-2 border border-cockpit rounded-lg bg-cockpit-input text-sm" value={statut} onChange={(e) => setStatut(e.target.value)}>
            {STATUTS.map((s) => <option key={s} value={s}>{STATUT_BADGE[s].label}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="w-full px-2.5 py-2 border border-cockpit rounded-lg bg-cockpit-input text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-lg font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4C9DB0,#7Fc4d4)" }}>
            {saving ? "…" : "Enregistrer"}
          </button>
          <button onClick={del} className="px-3 py-2.5 rounded-lg border border-red-200 text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>,
    document.body
  );
}
