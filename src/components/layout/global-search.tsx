"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  ClipboardList,
  X,
  Loader2,
  FileText,
  ShoppingCart,
  Package,
  LayoutDashboard,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import { traduireStatut } from "@/lib/sellsy-statuts";

interface ContactResult {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  lifecycleStage: string;
}

interface TaskResult {
  id: string;
  titre: string;
  statut: string;
  echeance: string | null;
}

interface EstimateResult {
  id: number;
  number: string;
  subject: string;
  company_name: string;
  status: string;
  total: string;
}

interface OrderResult {
  id: number;
  number: string;
  subject: string;
  company_name: string;
  status: string;
  total: string;
}

interface ProductResult {
  id: number;
  name: string;
  reference: string;
  unitAmount: string;
}

interface LeadResult {
  id: string;
  statut: string;
  source: string;
  priorite: string;
  createdAt: string;
  contact: { nom: string; prenom: string; email: string };
}

interface PageResult {
  label: string;
  href: string;
  espace: string;
}

interface SearchResults {
  contacts: ContactResult[];
  tasks: TaskResult[];
  leads: LeadResult[];
  estimates: EstimateResult[];
  orders: OrderResult[];
  products: ProductResult[];
  pages: PageResult[];
}

const stageColors: Record<string, string> = {
  PROSPECT: "text-[#03C3EC]",
  LEAD: "text-[#FFAB00]",
  CLIENT: "text-[#71DD37]",
  INACTIF: "text-[#8592A3]",
};

const statutLabels: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

const leadStatutLabels: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  DEVIS: "Devis",
  VENTE: "Vente",
  PERDU: "Perdu",
};

const leadStatutColors: Record<string, string> = {
  NOUVEAU: "text-cockpit-info",
  EN_COURS: "text-cockpit-warning",
  DEVIS: "text-[#9C27B0]",
  VENTE: "text-cockpit-success",
  PERDU: "text-cockpit-danger",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  };

  const openExternal = (url: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    window.open(url, "_blank");
  };

  const totalResults =
    (results?.contacts?.length || 0) +
    (results?.tasks?.length || 0) +
    (results?.leads?.length || 0) +
    (results?.estimates?.length || 0) +
    (results?.orders?.length || 0) +
    (results?.products?.length || 0) +
    (results?.pages?.length || 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cockpit bg-cockpit-card hover:bg-cockpit-dark hover:border-cockpit-yellow/30 transition-colors text-sm text-cockpit-secondary w-52"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="text-[10px] text-cockpit-secondary bg-cockpit-dark border border-cockpit rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-1 w-[32rem] bg-cockpit-card rounded-xl shadow-cockpit-lg border border-cockpit z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-cockpit">
            <Search className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Contact, demande, devis, commande, produit..."
              className="flex-1 text-sm outline-none bg-transparent text-cockpit-primary placeholder:text-cockpit-secondary/60"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults(null); }} className="p-0.5 hover:bg-cockpit-dark rounded">
                <X className="w-3.5 h-3.5 text-cockpit-secondary" />
              </button>
            )}
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-cockpit-yellow" />}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-6 text-center text-sm text-cockpit-secondary">
                Tapez au moins 2 caractères
              </div>
            ) : results && totalResults === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-cockpit-secondary">
                Aucun résultat pour &quot;{query}&quot;
              </div>
            ) : results ? (
              <>
                {/* Pages */}
                {results.pages.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutDashboard className="w-3 h-3" /> Pages
                    </div>
                    {results.pages.map((p) => (
                      <button
                        key={p.href}
                        onClick={() => navigate(p.href)}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary">{p.label}</span>
                          <span className="text-[11px] text-cockpit-secondary">{p.espace}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Contacts */}
                {results.contacts.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Contacts
                    </div>
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/contacts/${c.id}`)}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary">
                            {c.prenom} {c.nom}
                          </span>
                          <span className={`text-[11px] font-semibold ${stageColors[c.lifecycleStage] || "text-cockpit-secondary"}`}>
                            {c.lifecycleStage}
                          </span>
                        </div>
                        <p className="text-xs text-cockpit-secondary truncate">{c.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Leads / Demandes */}
                {results.leads && results.leads.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Inbox className="w-3 h-3" /> Demandes
                    </div>
                    {results.leads.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => navigate(`/leads`)}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary">
                            {l.contact.prenom} {l.contact.nom}
                          </span>
                          <span className={`text-[11px] font-semibold ${leadStatutColors[l.statut] || "text-cockpit-secondary"}`}>
                            {leadStatutLabels[l.statut] || l.statut}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-cockpit-secondary truncate">{l.contact.email}</p>
                          <span className="text-[10px] text-cockpit-secondary">
                            {l.source} · {new Date(l.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Devis */}
                {results.estimates.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Devis Sellsy
                    </div>
                    {results.estimates.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => openExternal(getSellsyUrl("estimate", e.id))}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary">
                            {e.number || e.subject || `Devis #${e.id}`}
                          </span>
                          <span className="text-[11px] text-cockpit-secondary">{traduireStatut(e.status)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-cockpit-secondary truncate">{e.company_name || "—"}</p>
                          <span className="text-xs font-semibold text-cockpit-yellow">
                            {Number(e.total || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Commandes */}
                {results.orders.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingCart className="w-3 h-3" /> Commandes Sellsy
                    </div>
                    {results.orders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => openExternal(getSellsyUrl("order", o.id))}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary">
                            {o.number || o.subject || `Commande #${o.id}`}
                          </span>
                          <span className="text-[11px] text-cockpit-secondary">{traduireStatut(o.status)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-cockpit-secondary truncate">{o.company_name || "—"}</p>
                          <span className="text-xs font-semibold text-cockpit-yellow">
                            {Number(o.total || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Produits */}
                {results.products.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3 h-3" /> Produits Catalogue
                    </div>
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openExternal(getSellsyUrl("product", p.id))}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary truncate">{p.name}</span>
                          {p.reference && (
                            <span className="text-[11px] text-cockpit-secondary ml-2 flex-shrink-0">
                              {p.reference}
                            </span>
                          )}
                        </div>
                        {p.unitAmount && (
                          <p className="text-xs text-cockpit-yellow font-semibold">
                            {Number(p.unitAmount).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€ HT
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tâches */}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-cockpit-dark text-[11px] font-semibold text-cockpit-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3 h-3" /> Tâches
                    </div>
                    {results.tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate("/commercial/taches")}
                        className="w-full text-left px-3 py-2.5 hover:bg-cockpit-yellow/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-cockpit-primary line-clamp-1">{t.titre}</span>
                          <span className="text-[11px] text-cockpit-secondary">{statutLabels[t.statut] || t.statut}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
