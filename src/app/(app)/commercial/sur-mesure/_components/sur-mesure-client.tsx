"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Ruler, Plus, RefreshCw, Loader2, Search, LayoutGrid, List as ListIcon,
  Flame, Target, TrendingUp, Clock,
} from "lucide-react";
import clsx from "clsx";
import { ProjetDrawer } from "./projet-drawer";
import { PdfThumb } from "./pdf-thumb";

const TEAL = "#0E6973";

export interface UserLite { id: string; prenom: string; nom: string; role: string }

interface Props {
  users: UserLite[];
  vueDefaut: "all" | "dessin" | "needprice";
  currentUserId: string;
}

export interface Projet {
  id: string;
  numero: string;
  titre: string;
  typeProjet: string;
  statut: string;
  priorite: string;
  numeroSellsy: string | null;
  typeSellsy: string | null;
  montantSellsy: number | null;
  statutConversion: string | null;
  contact: { id: string; nom: string; prenom: string } | null;
  proprietaire: { id: string; prenom: string; nom: string } | null;
  assigne: { id: string; prenom: string; nom: string } | null;
  documents: { id: string; estCouverture: boolean; url: string; type: string }[];
  _count: { commentaires: number; documents: number };
}

const PIPELINE: { statut: string; label: string }[] = [
  { statut: "DESSIN_DEMANDE", label: "À dessiner" },
  { statut: "RDV_CLIENT", label: "RDV client" },
  { statut: "DESSIN_EN_COURS", label: "Dessin en cours" },
  { statut: "PLANS_PRETS", label: "Plans prêts" },
  { statut: "NEED_PRICE", label: "Need Price" },
  { statut: "PRIX_RECU", label: "Prix reçu" },
  { statut: "PRESENTE_CLIENT", label: "Présenté client" },
  { statut: "GAGNE", label: "Gagné" },
  { statut: "PERDU", label: "Perdu" },
];

const TYPE_LABELS: Record<string, string> = {
  CUISINE: "Cuisine", DRESSING: "Dressing", SDB: "Salle de bains",
  MOBILIER: "Mobilier", AMENAGEMENT_COLLECTIVITE: "Collectivité", AUTRE: "Autre",
};

const VUE_FILTRES: Record<string, string[]> = {
  dessin: ["DESSIN_DEMANDE", "RDV_CLIENT", "DESSIN_EN_COURS", "PLANS_PRETS"],
  needprice: ["NEED_PRICE", "PRIX_RECU"],
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function SurMesureClient({ users, vueDefaut, currentUserId }: Props) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [kpis, setKpis] = useState<{ enCours: number; tauxConversion: number; valeurPipeline: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vue, setVue] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtrePriorite, setFiltrePriorite] = useState("");
  const [nonConverti, setNonConverti] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjets = useCallback(async () => {
    setRefreshing(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filtreType) p.set("type", filtreType);
      if (filtrePriorite) p.set("priorite", filtrePriorite);
      if (nonConverti) { p.set("nonConverti", "true"); p.set("montantMin", "4000"); }
      const res = await fetch(`/api/sur-mesure?${p.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjets(data.projets || []);
        setKpis(data.kpis || null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filtreType, filtrePriorite, nonConverti]);

  useEffect(() => { fetchProjets(); }, [fetchProjets]);

  // Filtre de vue par défaut (Laurent/Elaury)
  const statutsVisibles = VUE_FILTRES[vueDefaut] || null;
  const projetsFiltres = useMemo(
    () => statutsVisibles ? projets.filter((p) => statutsVisibles.includes(p.statut)) : projets,
    [projets, statutsVisibles]
  );

  const colonnes = statutsVisibles
    ? PIPELINE.filter((c) => statutsVisibles.includes(c.statut))
    : PIPELINE;

  return (
    <div data-espace="commercial" className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2">
            <Ruler className="w-6 h-6" style={{ color: TEAL }} /> Sur-Mesure
          </h1>
          <p className="text-sm text-cockpit-secondary mt-0.5">Cuisines · dressings · SDB · mobilier · collectivités</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-cockpit-card rounded-lg p-1 border border-cockpit">
            <button onClick={() => setVue("kanban")} className={clsx("px-2.5 py-1.5 rounded-md", vue === "kanban" ? "text-white" : "text-cockpit-secondary")} style={vue === "kanban" ? { background: TEAL } : undefined}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setVue("list")} className={clsx("px-2.5 py-1.5 rounded-md", vue === "list" ? "text-white" : "text-cockpit-secondary")} style={vue === "list" ? { background: TEAL } : undefined}><ListIcon className="w-4 h-4" /></button>
          </div>
          <button onClick={fetchProjets} disabled={refreshing} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-cockpit bg-cockpit-card">
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} /> Actualiser
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, #FEEB9C)` }}>
            <Plus className="w-4 h-4" /> Nouveau projet
          </button>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Projets en cours" value={String(kpis.enCours)} />
          <KpiCard icon={<Target className="w-5 h-5" />} label="Taux conversion" value={`${kpis.tauxConversion}%`} />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="Valeur pipeline" value={eur(kpis.valeurPipeline)} />
          <KpiCard icon={<Ruler className="w-5 h-5" />} label="Total projets" value={String(kpis.total)} />
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° SM, Sellsy, client..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-cockpit bg-cockpit-card text-sm" />
        </div>
        <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-3 py-2 rounded-lg border border-cockpit bg-cockpit-card text-sm">
          <option value="">Tous types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)} className="px-3 py-2 rounded-lg border border-cockpit bg-cockpit-card text-sm">
          <option value="">Toute priorité</option>
          <option value="URGENT">Urgent</option>
          <option value="NORMAL">Normal</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cockpit bg-cockpit-card text-sm cursor-pointer">
          <input type="checkbox" checked={nonConverti} onChange={(e) => setNonConverti(e.target.checked)} />
          &gt; 4000€ non convertis
        </label>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: TEAL }} /></div>
      ) : vue === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {colonnes.map((col) => {
            const items = projetsFiltres.filter((p) => p.statut === col.statut);
            return (
              <div key={col.statut} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold uppercase text-cockpit-secondary">{col.label}</span>
                  <span className="text-xs bg-cockpit-dark/40 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((p) => <ProjetCard key={p.id} projet={p} onClick={() => setSelectedId(p.id)} />)}
                  {items.length === 0 && <div className="text-xs text-cockpit-secondary/60 italic px-1 py-4 text-center">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {projetsFiltres.map((p) => <ProjetCard key={p.id} projet={p} onClick={() => setSelectedId(p.id)} horizontal />)}
          {projetsFiltres.length === 0 && <p className="text-center py-12 text-cockpit-secondary">Aucun projet sur-mesure.</p>}
        </div>
      )}

      {selectedId && (
        <ProjetDrawer
          projetId={selectedId}
          users={users}
          currentUserId={currentUserId}
          onClose={() => setSelectedId(null)}
          onChange={fetchProjets}
        />
      )}
      {showCreate && (
        <CreateModal users={users} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchProjets(); }} />
      )}
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg overflow-hidden">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${TEAL}, #FEEB9C)` }} />
      <div className="p-4">
        <div className="flex items-center gap-2 text-cockpit-secondary mb-1"><span style={{ color: TEAL }}>{icon}</span><span className="text-xs font-semibold">{label}</span></div>
        <p className="text-2xl font-bold" style={{ color: TEAL }}>{value}</p>
      </div>
    </div>
  );
}

function ProjetCard({ projet, onClick, horizontal }: { projet: Projet; onClick: () => void; horizontal?: boolean }) {
  // Couverture = 1re page du plan 3D (PDF) en priorité ; sinon une vraie image.
  const plan3d = projet.documents.find((d) => d.type === "plan_3d" || /\.pdf($|\?)/i.test(d.url));
  const images = projet.documents.filter((d) => d.type !== "plan_3d" && !/\.pdf($|\?)/i.test(d.url));
  const couverture = images.find((d) => d.estCouverture) || images[0];
  return (
    <button onClick={onClick} className={clsx("w-full text-left bg-cockpit-card rounded-lg border border-cockpit hover:border-cockpit-info/40 transition shadow-sm overflow-hidden", horizontal && "flex items-center gap-3 p-3")}>
      {!horizontal && (plan3d
        ? <PdfThumb url={plan3d.url} className="h-24 w-full bg-cockpit-dark/30" />
        : couverture && <div className="h-24 w-full bg-cockpit-dark/30" style={{ backgroundImage: `url(${couverture.url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      )}
      <div className={clsx(!horizontal && "p-3", "flex-1 min-w-0")}>
        <div className="flex items-center gap-1.5 mb-1">
          {projet.priorite === "URGENT" && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#C2185B" }}>Urgent</span>}
          <span className="text-[10px] font-mono text-cockpit-secondary">{projet.numero}</span>
          {projet.typeSellsy === "BON_COMMANDE" && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Signée</span>}
        </div>
        <p className="text-sm font-semibold text-cockpit-primary truncate">{projet.titre}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-cockpit-secondary">
          <span className="px-1.5 py-0.5 rounded bg-cockpit-dark/30">{TYPE_LABELS[projet.typeProjet] || projet.typeProjet}</span>
          {projet.montantSellsy != null && <span className="font-semibold">{eur(projet.montantSellsy)}</span>}
          {projet.assigne && <span>· {projet.assigne.prenom}</span>}
        </div>
      </div>
    </button>
  );
}

// ===== Modal création =====
function CreateModal({ users, onClose, onCreated }: { users: UserLite[]; onClose: () => void; onCreated: () => void }) {
  const [titre, setTitre] = useState("");
  const [typeProjet, setTypeProjet] = useState("CUISINE");
  const [priorite, setPriorite] = useState("NORMAL");
  const [numeroSellsy, setNumeroSellsy] = useState("");
  const [assigneId, setAssigneId] = useState("");
  const [brief, setBrief] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const laurent = users.find((u) => u.prenom.toLowerCase().includes("laurent"));

  const submit = async () => {
    if (!titre.trim()) { setErr("Titre requis"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/sur-mesure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre, typeProjet, priorite,
          numeroSellsy: numeroSellsy || null,
          assigneId: assigneId || laurent?.id || null,
          briefTechnique: brief || null,
        }),
      });
      if (res.ok) onCreated();
      else { const d = await res.json(); setErr(d.error || "Erreur"); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4" style={{ background: `linear-gradient(135deg, ${TEAL}, #FEEB9C)` }}>
          <h2 className="text-lg font-bold text-white">Nouveau projet sur-mesure</h2>
        </div>
        <div className="p-4 space-y-3">
          <Field label="Titre *"><input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex: AUBER ANNE LAURE CUISINE" className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><select value={typeProjet} onChange={(e) => setTypeProjet(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm">{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Priorité"><select value={priorite} onChange={(e) => setPriorite(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm"><option value="NORMAL">Normal</option><option value="URGENT">Urgent</option></select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="N° Sellsy (DEPI/BCDI)"><input value={numeroSellsy} onChange={(e) => setNumeroSellsy(e.target.value)} placeholder="DEPI-08195" className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" /></Field>
            <Field label="Assigné dessin"><select value={assigneId} onChange={(e) => setAssigneId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm"><option value="">{laurent ? `${laurent.prenom} (défaut)` : "—"}</option>{users.map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}</select></Field>
          </div>
          <Field label="Brief technique"><textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Mesures, dimensions, configuration, références..." className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="p-4 border-t border-cockpit flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-cockpit text-sm">Annuler</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: TEAL }}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Créer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-cockpit-secondary mb-1">{label}</label>{children}</div>;
}
