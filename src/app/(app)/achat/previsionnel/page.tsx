"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Ship,
  Plus,
  X,
  Package,
  ShoppingCart,
  Upload,
  Trash2,
  Link2,
  Unlink,
  Edit3,
  Save,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { parseExcelPrevisionnel } from "@/lib/import-previsionnel";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LigneArrivage {
  id: string;
  reference: string;
  designation: string;
  quantite: number;
  notes: string | null;
}

interface BdcArrivage {
  id: string;
  bdcReference: string;
  clientNom: string | null;
  notes: string | null;
}

interface Arrivage {
  id: string;
  reference: string;
  dateDepart: string | null;
  dateLivraisonEstimee: string | null;
  statut: string;
  notes: string | null;
  createdAt: string;
  _count: { lignes: number; bdcLies: number };
  createdBy: { prenom: string; nom: string };
  // Populated when detail is loaded
  lignes?: LigneArrivage[];
  bdcLies?: BdcArrivage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PREVU: { label: "Prévu", color: "#FFAB00", bg: "#FFF8E1" },
  EN_TRANSIT: { label: "En transit", color: "#03C3EC", bg: "#E3F7FD" },
  ARRIVE: { label: "Arrivé", color: "#71DD37", bg: "#F0FFF4" },
  ANNULE: { label: "Annulé", color: "#FF3E1D", bg: "#FFF0EE" },
};

const STATUTS = ["PREVU", "EN_TRANSIT", "ARRIVE", "ANNULE"];

function fmtDate(val: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUT_LABELS[statut] || { label: statut, color: "#8592A3", bg: "#F5F6F7" };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

// ─── Import Excel Preview ─────────────────────────────────────────────────────

interface ImportPreviewProps {
  arrivageId: string;
  onDone: () => void;
  onCancel: () => void;
}

function ImportExcel({ arrivageId, onDone, onCancel }: ImportPreviewProps) {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ index: number; dateLabel: string; nbLignes: number }[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    const buffer = await f.arrayBuffer();
    const arrivages = parseExcelPrevisionnel(buffer);
    setPreview(arrivages.map((a, i) => ({ index: i, dateLabel: a.dateLabel, nbLignes: a.lignes.length })));
    setSelectedIndex(0);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("arrivageIndex", String(selectedIndex));
    try {
      const res = await fetch(`/api/achat/arrivages/${arrivageId}/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`${data.imported} lignes importées (${data.dateLabel})`, "success");
      onDone();
    } catch (e: any) {
      addToast(e.message || "Erreur import", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-[#E8EAED] rounded-lg p-6 text-center cursor-pointer hover:border-[#CBA1D4] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 text-[#8592A3] mx-auto mb-2" />
        <p className="text-sm text-[#32475C]">
          {file ? file.name : "Cliquer pour choisir le fichier Excel Elaury"}
        </p>
        <p className="text-xs text-[#8592A3] mt-1">Prévisionnel détaillé.xlsx</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider">
            {preview.length} arrivage{preview.length > 1 ? "s" : ""} détecté{preview.length > 1 ? "s" : ""}
          </p>
          {preview.map((a) => (
            <label key={a.index} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-[#F5F6F7]">
              <input
                type="radio"
                name="arrivageIndex"
                checked={selectedIndex === a.index}
                onChange={() => setSelectedIndex(a.index)}
                className="accent-[#CBA1D4]"
              />
              <span className="text-sm text-[#32475C]">
                <span className="font-semibold">{a.dateLabel}</span>
                <span className="text-[#8592A3] ml-1">— {a.nbLignes} commandes</span>
              </span>
            </label>
          ))}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#CBA1D4" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importer
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg text-sm border border-[#E8EAED] text-[#32475C] hover:bg-[#F5F6F7]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drawer Arrivage ──────────────────────────────────────────────────────────

interface DrawerProps {
  arrivage: Arrivage;
  canWrite: boolean;
  onClose: () => void;
  onUpdated: (a: Arrivage) => void;
  onDeleted: (id: string) => void;
}

function ArrivageDrawer({ arrivage, canWrite, onClose, onUpdated, onDeleted }: DrawerProps) {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"produits" | "commandes">("produits");
  const [detail, setDetail] = useState<Arrivage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [showImport, setShowImport] = useState(false);

  // Edit mode for header fields
  const [editing, setEditing] = useState(false);
  const [editStatut, setEditStatut] = useState(arrivage.statut);
  const [editDateDepart, setEditDateDepart] = useState(arrivage.dateDepart ? arrivage.dateDepart.slice(0, 10) : "");
  const [editDateArr, setEditDateArr] = useState(arrivage.dateLivraisonEstimee ? arrivage.dateLivraisonEstimee.slice(0, 10) : "");
  const [editNotes, setEditNotes] = useState(arrivage.notes || "");
  const [saving, setSaving] = useState(false);

  // BDC liaison
  const [newBdc, setNewBdc] = useState("");
  const [newBdcClient, setNewBdcClient] = useState("");
  const [linkingBdc, setLinkingBdc] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/achat/arrivages/${arrivage.id}`);
      const data = await res.json();
      setDetail(data);
    } finally {
      setLoadingDetail(false);
    }
  }, [arrivage.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/achat/arrivages/${arrivage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: editStatut,
          dateDepart: editDateDepart || null,
          dateLivraisonEstimee: editDateArr || null,
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data);
      setEditing(false);
      addToast("Arrivage mis à jour", "success");
    } catch (e: any) {
      addToast(e.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'arrivage ${arrivage.reference} ? Cette action est irréversible.`)) return;
    try {
      await fetch(`/api/achat/arrivages/${arrivage.id}`, { method: "DELETE" });
      onDeleted(arrivage.id);
      onClose();
    } catch {
      addToast("Erreur lors de la suppression", "error");
    }
  };

  const handleLinkBdc = async () => {
    if (!newBdc.trim()) return;
    setLinkingBdc(true);
    try {
      const res = await fetch(`/api/achat/arrivages/${arrivage.id}/bdc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bdcReference: newBdc.trim(),
          clientNom: newBdcClient.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewBdc("");
      setNewBdcClient("");
      await loadDetail();
      addToast(`${newBdc.trim()} lié à cet arrivage`, "success");
    } catch (e: any) {
      addToast(e.message || "Erreur", "error");
    } finally {
      setLinkingBdc(false);
    }
  };

  const handleUnlinkBdc = async (bdcId: string, ref: string) => {
    if (!confirm(`Délier ${ref} de cet arrivage ?`)) return;
    try {
      await fetch(`/api/achat/arrivages/${arrivage.id}/bdc/${bdcId}`, { method: "DELETE" });
      await loadDetail();
      addToast(`${ref} délié`, "success");
    } catch {
      addToast("Erreur", "error");
    }
  };

  const content = (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white z-[9999] flex flex-col shadow-2xl"
        style={{ animation: "slideIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-[#E8EAED]" style={{ background: "linear-gradient(135deg, #CBA1D4, #FEEB9C)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">{arrivage.reference}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatutBadge statut={editing ? editStatut : arrivage.statut} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canWrite && !editing && (
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Info section */}
          <div className="px-6 py-4 border-b border-[#E8EAED] space-y-3">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#8592A3] font-medium mb-1 block">Statut</label>
                  <select
                    value={editStatut}
                    onChange={(e) => setEditStatut(e.target.value)}
                    className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C] bg-white"
                  >
                    {STATUTS.map((s) => (
                      <option key={s} value={s}>{STATUT_LABELS[s]?.label || s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8592A3] font-medium mb-1 block">Départ</label>
                    <input type="date" value={editDateDepart} onChange={(e) => setEditDateDepart(e.target.value)}
                      className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8592A3] font-medium mb-1 block">Arrivée est.</label>
                    <input type="date" value={editDateArr} onChange={(e) => setEditDateArr(e.target.value)}
                      className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8592A3] font-medium mb-1 block">Notes</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2}
                    className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C] resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: "#CBA1D4" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm border border-[#E8EAED] text-[#32475C]">
                    Annuler
                  </button>
                  <button onClick={handleDelete} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F5F6F7] rounded-lg p-3">
                  <p className="text-[10px] text-[#8592A3] uppercase mb-1">Départ</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{fmtDate(arrivage.dateDepart)}</p>
                </div>
                <div className="bg-[#F5F6F7] rounded-lg p-3">
                  <p className="text-[10px] text-[#8592A3] uppercase mb-1">Arrivée est.</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{fmtDate(arrivage.dateLivraisonEstimee)}</p>
                </div>
                {arrivage.notes && (
                  <div className="col-span-2 bg-[#F5F6F7] rounded-lg p-3">
                    <p className="text-xs text-[#32475C]">{arrivage.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E8EAED]">
            {(["produits", "commandes"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === t ? "text-[#CBA1D4] border-b-2 border-[#CBA1D4]" : "text-[#8592A3] hover:text-[#32475C]"
                }`}>
                {t === "produits" ? <Package className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {t === "produits" ? "Produits" : "Commandes"}
                <span className="text-xs bg-[#F5F6F7] px-1.5 py-0.5 rounded-full">
                  {t === "produits" ? (detail?.lignes?.length ?? arrivage._count.lignes) : (detail?.bdcLies?.length ?? arrivage._count.bdcLies)}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-6 py-4">
            {loadingDetail ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#CBA1D4]" />
              </div>
            ) : tab === "produits" ? (
              <div className="space-y-3">
                {canWrite && (
                  <div>
                    {showImport ? (
                      <ImportExcel
                        arrivageId={arrivage.id}
                        onDone={() => { setShowImport(false); loadDetail(); }}
                        onCancel={() => setShowImport(false)}
                      />
                    ) : (
                      <button onClick={() => setShowImport(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#E8EAED] text-sm text-[#8592A3] hover:border-[#CBA1D4] hover:text-[#CBA1D4] transition-colors">
                        <Upload className="w-4 h-4" />
                        Importer Excel Elaury
                      </button>
                    )}
                  </div>
                )}

                {detail?.lignes && detail.lignes.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.lignes.map((l) => (
                      <div key={l.id} className="flex items-center justify-between bg-[#F5F6F7] border border-[#E8EAED] px-4 py-2.5 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-[#CBA1D4] bg-purple-50 px-1.5 py-0.5 rounded">
                            {l.reference}
                          </span>
                          <p className="text-xs text-[#32475C] mt-0.5 truncate">{l.designation}</p>
                          {l.notes && <p className="text-[10px] text-[#8592A3]">{l.notes}</p>}
                        </div>
                        <span className="text-sm font-bold text-[#1F2937] ml-3 flex-shrink-0">×{l.quantite}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8592A3] text-center py-6">
                    Aucun produit — importer le fichier Excel
                  </p>
                )}
              </div>
            ) : (
              /* Onglet Commandes liées */
              <div className="space-y-3">
                {canWrite && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={newBdc}
                        onChange={(e) => setNewBdc(e.target.value)}
                        placeholder="BCDI-XXXXX"
                        className="flex-1 border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]"
                        onKeyDown={(e) => { if (e.key === "Enter") handleLinkBdc(); }}
                      />
                      <input
                        value={newBdcClient}
                        onChange={(e) => setNewBdcClient(e.target.value)}
                        placeholder="Nom client (optionnel)"
                        className="flex-1 border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]"
                      />
                    </div>
                    <button onClick={handleLinkBdc} disabled={!newBdc.trim() || linkingBdc}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: "#CBA1D4" }}>
                      {linkingBdc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Lier ce BDC
                    </button>
                  </div>
                )}

                {detail?.bdcLies && detail.bdcLies.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.bdcLies.map((b) => (
                      <div key={b.id} className="flex items-center justify-between bg-[#F5F6F7] border border-[#E8EAED] px-4 py-2.5 rounded-lg">
                        <div>
                          <span className="text-sm font-mono font-semibold text-[#1F2937]">{b.bdcReference}</span>
                          {b.clientNom && <span className="text-xs text-[#8592A3] ml-2">{b.clientNom}</span>}
                        </div>
                        {canWrite && (
                          <button onClick={() => handleUnlinkBdc(b.id, b.bdcReference)}
                            className="p-1.5 rounded text-[#8592A3] hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8592A3] text-center py-6">
                    Aucune commande liée
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document !== "undefined") return createPortal(content, document.body);
  return content;
}

// ─── Modale création arrivage ─────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (a: Arrivage) => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const { addToast } = useToast();
  const [reference, setReference] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  const [dateLivraison, setDateLivraison] = useState("");
  const [statut, setStatut] = useState("PREVU");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/achat/arrivages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, dateDepart: dateDepart || null, dateLivraisonEstimee: dateLivraison || null, statut, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
      addToast(`Arrivage ${data.reference} créé`, "success");
    } catch (e: any) {
      addToast(e.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1F2937]">Nouvel arrivage</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F6F7]">
            <X className="w-5 h-5 text-[#8592A3]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#8592A3] mb-1 block">Référence *</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="C04/2026"
              className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#8592A3] mb-1 block">Départ (port)</label>
              <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)}
                className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8592A3] mb-1 block">Arrivée estimée</label>
              <input type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)}
                className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8592A3] mb-1 block">Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}
              className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C] bg-white">
              {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABELS[s]?.label || s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8592A3] mb-1 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-[#E8EAED] rounded-lg px-3 py-2 text-sm text-[#32475C] resize-none" />
          </div>
          <button type="submit" disabled={saving || !reference.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#CBA1D4" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer l&apos;arrivage
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PrevisionnelAchatPage() {
  const { addToast } = useToast();
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArrivage, setSelectedArrivage] = useState<Arrivage | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatut, setFilterStatut] = useState("ALL");

  // We check role client-side only for show/hide write UI
  // The API enforces authorization server-side
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((s) => {
      const role = s?.user?.role;
      setCanWrite(["ADMIN", "DIRECTION", "ACHAT"].includes(role));
    });
  }, []);

  const fetchArrivages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/achat/arrivages");
      const data = await res.json();
      setArrivages(Array.isArray(data) ? data : []);
    } catch {
      addToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchArrivages(); }, [fetchArrivages]);

  const filtered = arrivages.filter((a) => filterStatut === "ALL" || a.statut === filterStatut);

  const handleUpdated = (updated: Arrivage) => {
    setArrivages((prev) => prev.map((a) => a.id === updated.id ? { ...a, ...updated } : a));
    setSelectedArrivage((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const handleDeleted = (id: string) => {
    setArrivages((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2.5">
            <Ship className="w-6 h-6" style={{ color: "#CBA1D4" }} />
            Prévisionnel Arrivages
          </h1>
          <p className="text-sm text-cockpit-secondary mt-1">
            Gestion des conteneurs et commandes associées
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: "#CBA1D4" }}
          >
            <Plus className="w-4 h-4" />
            Nouvel arrivage
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatut("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatut === "ALL" ? "text-white" : "bg-cockpit-input text-cockpit-secondary"}`}
          style={filterStatut === "ALL" ? { backgroundColor: "#CBA1D4" } : {}}
        >
          Tous ({arrivages.length})
        </button>
        {STATUTS.map((s) => {
          const count = arrivages.filter((a) => a.statut === s).length;
          const info = STATUT_LABELS[s];
          return (
            <button key={s} onClick={() => setFilterStatut(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={filterStatut === s
                ? { backgroundColor: info.color, color: "white" }
                : { backgroundColor: info.bg, color: info.color }
              }>
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#CBA1D4" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-cockpit-secondary">
          <Ship className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun arrivage{filterStatut !== "ALL" ? " pour ce statut" : ""}</p>
          {canWrite && filterStatut === "ALL" && (
            <button onClick={() => setShowCreate(true)}
              className="mt-3 text-sm font-medium hover:underline"
              style={{ color: "#CBA1D4" }}>
              + Créer le premier arrivage
            </button>
          )}
        </div>
      ) : (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">Conteneur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">Départ prévu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading hidden md:table-cell">Arrivée est.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading hidden sm:table-cell">Produits</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading hidden sm:table-cell">BDC liés</th>
                <th className="px-3 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => setSelectedArrivage(a)}
                  className="hover:bg-cockpit-dark transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm text-cockpit-heading">{a.reference}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-cockpit-secondary">{fmtDate(a.dateDepart)}</td>
                  <td className="px-4 py-3 text-sm text-cockpit-secondary hidden md:table-cell">
                    {fmtDate(a.dateLivraisonEstimee)}
                  </td>
                  <td className="px-4 py-3"><StatutBadge statut={a.statut} /></td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                      {a._count.lignes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {a._count.bdcLies}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <ChevronDown className="w-4 h-4 text-cockpit-secondary -rotate-90" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {selectedArrivage && (
        <ArrivageDrawer
          arrivage={selectedArrivage}
          canWrite={canWrite}
          onClose={() => setSelectedArrivage(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {/* Modale création */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(a) => { setArrivages((prev) => [a, ...prev]); setShowCreate(false); setSelectedArrivage(a); }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
