"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, RefreshCw, Send, Trash2, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import type { UserLite } from "./sur-mesure-client";

const TEAL = "#0E6973";

const STATUTS: { v: string; l: string }[] = [
  { v: "DESSIN_DEMANDE", l: "À dessiner" },
  { v: "RDV_CLIENT", l: "RDV client" },
  { v: "DESSIN_EN_COURS", l: "Dessin en cours" },
  { v: "PLANS_PRETS", l: "Plans prêts" },
  { v: "NEED_PRICE", l: "Need Price" },
  { v: "PRIX_RECU", l: "Prix reçu" },
  { v: "PRESENTE_CLIENT", l: "Présenté client" },
  { v: "GAGNE", l: "Gagné" },
  { v: "PERDU", l: "Perdu" },
];

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type Tab = "demande" | "plans" | "needprice" | "sellsy" | "rdv" | "commentaires";

interface Props {
  projetId: string;
  users: UserLite[];
  currentUserId: string;
  onClose: () => void;
  onChange: () => void;
}

export function ProjetDrawer({ projetId, onClose, onChange }: Props) {
  const [projet, setProjet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("demande");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sur-mesure/${projetId}`);
    if (res.ok) { const d = await res.json(); setProjet(d.projet); }
    setLoading(false);
  }, [projetId]);

  useEffect(() => { load(); }, [load]);

  const patch = async (data: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/sur-mesure/${projetId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (res.ok) { await load(); onChange(); }
    } finally { setBusy(false); }
  };

  const refreshSellsy = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/sur-mesure/${projetId}/sellsy`, { method: "POST" });
      if (res.ok) { await load(); onChange(); }
      else { const d = await res.json(); alert(d.error); }
    } finally { setBusy(false); }
  };

  const supprimer = async () => {
    if (!confirm("Supprimer ce projet ?")) return;
    const res = await fetch(`/api/sur-mesure/${projetId}`, { method: "DELETE" });
    if (res.ok) { onChange(); onClose(); }
    else { const d = await res.json(); alert(d.error); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "demande", label: "Demande dessin" },
    { id: "plans", label: "Plans 3D" },
    { id: "needprice", label: "Need Price" },
    { id: "sellsy", label: "Sellsy" },
    { id: "rdv", label: "RDV" },
    { id: "commentaires", label: "Commentaires" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="bg-cockpit-card w-full max-w-2xl h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        {loading || !projet ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" style={{ color: TEAL }} /></div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 sticky top-0 z-10" style={{ background: `linear-gradient(135deg, ${TEAL}, #FEEB9C)` }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/80">{projet.numero}</span>
                    {projet.priorite === "URGENT" && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-[#C2185B]">Urgent</span>}
                    {projet.typeSellsy === "BON_COMMANDE" && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/90 text-green-700">Commande signée</span>}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{projet.titre}</h2>
                </div>
                <button onClick={onClose} className="text-white/90 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {/* Statut selector */}
              <select value={projet.statut} onChange={(e) => patch({ statut: e.target.value })} disabled={busy} className="mt-3 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/95 text-cockpit-primary">
                {STATUTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 border-b border-cockpit overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={clsx("px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition", tab === t.id ? "border-current" : "border-transparent text-cockpit-secondary")} style={tab === t.id ? { color: TEAL } : undefined}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === "demande" && <TabDemande projet={projet} patch={patch} busy={busy} />}
              {tab === "plans" && <TabPlans projet={projet} reload={load} />}
              {tab === "needprice" && <TabNeedPrice projet={projet} projetId={projetId} reload={() => { load(); onChange(); }} />}
              {tab === "sellsy" && <TabSellsy projet={projet} patch={patch} refresh={refreshSellsy} busy={busy} />}
              {tab === "rdv" && <TabRdv projet={projet} />}
              {tab === "commentaires" && <TabCommentaires projet={projet} projetId={projetId} reload={load} />}
            </div>

            <div className="p-4 border-t border-cockpit">
              <button onClick={supprimer} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /> Supprimer le projet</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabDemande({ projet, patch, busy }: any) {
  const [brief, setBrief] = useState(projet.briefTechnique || "");
  return (
    <div className="space-y-3">
      {projet.contact && (
        <div className="text-sm">
          <span className="text-cockpit-secondary">Client : </span>
          <span className="font-semibold">{projet.contact.prenom} {projet.contact.nom}</span>
          {projet.contact.telephone && <span className="text-cockpit-secondary"> · {projet.contact.telephone}</span>}
        </div>
      )}
      <div className="text-sm"><span className="text-cockpit-secondary">Propriétaire : </span>{projet.proprietaire?.prenom} {projet.proprietaire?.nom}</div>
      <div>
        <label className="block text-xs font-semibold text-cockpit-secondary mb-1">Brief technique</label>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" placeholder="Mesures, dimensions, configuration, références produits..." />
        <button onClick={() => patch({ briefTechnique: brief })} disabled={busy} className="mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL }}>Enregistrer le brief</button>
      </div>
    </div>
  );
}

function TabPlans({ projet, reload }: any) {
  const plans = projet.documents.filter((d: any) => d.type === "plan_3d");
  return (
    <div className="space-y-3">
      <p className="text-xs text-cockpit-secondary">Les plans 3D ajoutés notifient automatiquement l'équipe.</p>
      <UploadZone projetId={projet.id} type="plan_3d" reload={reload} label="Ajouter un plan 3D (PDF/image)" />
      {plans.length === 0 ? <p className="text-sm text-cockpit-secondary py-4 text-center">Aucun plan pour le moment.</p> : (
        <ul className="space-y-2">
          {plans.map((d: any) => (
            <li key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-cockpit-dark/30 border border-cockpit">
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate flex items-center gap-1" style={{ color: TEAL }}><ExternalLink className="w-3.5 h-3.5" />{d.nom}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabNeedPrice({ projet, projetId, reload }: any) {
  const [lignes, setLignes] = useState([{ denomination: "", dimensions: "", finitions: "" }]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  if (projet.needPrice) {
    const np = projet.needPrice;
    return (
      <div className="space-y-2 text-sm">
        <div className="p-3 rounded-lg bg-cockpit-dark/30 border border-cockpit">
          <p className="font-semibold">{np.reference} <span className="text-xs font-normal text-cockpit-secondary">· {np.statut}</span></p>
          {np.prixVente != null && <p className="mt-1">Prix de vente : <strong>{eur(np.prixVente)}</strong></p>}
          {np.prixMinimum != null && <p>Prix minimum : {eur(np.prixMinimum)}</p>}
          {np.statut === "DEMANDE" && <p className="text-xs text-cockpit-secondary mt-1">En attente du prix d'Elaury.</p>}
        </div>
      </div>
    );
  }

  const send = async () => {
    const valides = lignes.filter((l) => l.denomination.trim() && l.dimensions.trim());
    if (valides.length === 0) { alert("Au moins un meuble (dénomination + dimensions)"); return; }
    setSending(true);
    try {
      const res = await fetch(`/api/sur-mesure/${projetId}/need-price`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lignes: valides, notes: notes || null }),
      });
      if (res.ok) reload();
      else { const d = await res.json(); alert(d.error); }
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-cockpit-secondary">Envoie une demande de prix à Elaury (Achat). Déclenchable à tout moment.</p>
      {lignes.map((l, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          <input value={l.denomination} onChange={(e) => { const n = [...lignes]; n[i].denomination = e.target.value; setLignes(n); }} placeholder="Dénomination" className="px-2 py-1.5 rounded border border-cockpit bg-white text-sm" />
          <input value={l.dimensions} onChange={(e) => { const n = [...lignes]; n[i].dimensions = e.target.value; setLignes(n); }} placeholder="Dimensions" className="px-2 py-1.5 rounded border border-cockpit bg-white text-sm" />
          <input value={l.finitions} onChange={(e) => { const n = [...lignes]; n[i].finitions = e.target.value; setLignes(n); }} placeholder="Finition" className="px-2 py-1.5 rounded border border-cockpit bg-white text-sm" />
        </div>
      ))}
      <button onClick={() => setLignes([...lignes, { denomination: "", dimensions: "", finitions: "" }])} className="text-xs text-cockpit-secondary">+ Ajouter une ligne</button>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes (optionnel)" className="w-full px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" />
      <button onClick={send} disabled={sending} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL }}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Envoyer le Need Price</button>
    </div>
  );
}

function TabSellsy({ projet, patch, refresh, busy }: any) {
  const [num, setNum] = useState(projet.numeroSellsy || "");
  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="block text-xs font-semibold text-cockpit-secondary mb-1">N° Sellsy (DEPI ou BCDI)</label>
        <div className="flex gap-2">
          <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="DEPI-08195" className="flex-1 px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" />
          <button onClick={() => patch({ numeroSellsy: num })} disabled={busy} className="px-3 py-2 rounded-lg text-sm font-semibold border border-cockpit">Lier</button>
        </div>
      </div>
      {projet.numeroSellsy && (
        <>
          <button onClick={refresh} disabled={busy} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL }}><RefreshCw className={clsx("w-4 h-4", busy && "animate-spin")} /> Rafraîchir le montant</button>
          {projet.montantSellsy != null && (
            <div className="p-3 rounded-lg bg-cockpit-dark/30 border border-cockpit space-y-1">
              <p>Montant HT : <strong>{eur(projet.montantSellsy)}</strong></p>
              <p>Conversion : <span className={projet.statutConversion === "converti" ? "text-green-700 font-semibold" : "text-cockpit-secondary"}>{projet.statutConversion === "converti" ? "Converti en commande" : "Non converti"}</span></p>
              {projet.montantSyncedAt && <p className="text-xs text-cockpit-secondary">Sync : {new Date(projet.montantSyncedAt).toLocaleString("fr-FR")}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabRdv({ projet }: any) {
  if (!projet.rendezVous || projet.rendezVous.length === 0) {
    return <p className="text-sm text-cockpit-secondary py-4 text-center">Aucun RDV rattaché à ce projet.</p>;
  }
  return (
    <ul className="space-y-2">
      {projet.rendezVous.map((r: any) => (
        <li key={r.id} className="p-3 rounded-lg bg-cockpit-dark/30 border border-cockpit text-sm">
          <p className="font-semibold">{new Date(r.dateDebut).toLocaleString("fr-FR")}</p>
          <p className="text-xs text-cockpit-secondary">{r.statut} · {r.source}</p>
        </li>
      ))}
    </ul>
  );
}

function TabCommentaires({ projet, projetId, reload }: any) {
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);
  const add = async () => {
    if (!contenu.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sur-mesure/${projetId}/commentaires`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu }),
      });
      if (res.ok) { setContenu(""); reload(); }
    } finally { setSending(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={contenu} onChange={(e) => setContenu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Ajouter un commentaire..." className="flex-1 px-3 py-2 rounded-lg border border-cockpit bg-white text-sm" />
        <button onClick={add} disabled={sending} className="px-3 py-2 rounded-lg text-white" style={{ background: TEAL }}><Send className="w-4 h-4" /></button>
      </div>
      <ul className="space-y-2">
        {(projet.commentaires || []).map((c: any) => (
          <li key={c.id} className="p-2.5 rounded-lg bg-cockpit-dark/30 border border-cockpit">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">{c.auteur?.prenom} {c.auteur?.nom}</span><span className="text-[10px] text-cockpit-secondary">{new Date(c.createdAt).toLocaleString("fr-FR")}</span></div>
            <p className="text-sm mt-1">{c.contenu}</p>
          </li>
        ))}
        {(projet.commentaires || []).length === 0 && <p className="text-sm text-cockpit-secondary py-2 text-center">Aucun commentaire.</p>}
      </ul>
    </div>
  );
}

// Upload Supabase + register
function UploadZone({ projetId, type, reload, label }: { projetId: string; type: string; reload: () => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload via endpoint générique de media (multipart) — réutilise /api/upload si dispo
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sur-mesure");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) { alert("Échec upload"); return; }
      const { url, path } = await up.json();
      await fetch(`/api/sur-mesure/${projetId}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: file.name, type, url, path }),
      });
      reload();
    } finally { setUploading(false); }
  };
  return (
    <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-cockpit text-sm text-cockpit-secondary cursor-pointer hover:border-cockpit-info/40">
      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {uploading ? "Upload..." : label}
      <input type="file" className="hidden" onChange={handleFile} accept="image/*,application/pdf" />
    </label>
  );
}
