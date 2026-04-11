"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2, GitMerge, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeftRight } from "lucide-react";

interface ContactSummary {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  lifecycleStage: string;
  sellsyContactId: string | null;
  _count: { leads: number; devis: number; ventes: number; demandesPrix: number };
}

interface MergeContactModalProps {
  primaryContact: ContactSummary;
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (primaryId: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect", LEAD: "Lead", CLIENT: "Client", INACTIF: "Inactif",
};

function ContactCard({ contact, badge }: { contact: ContactSummary; badge: "Principal" | "Secondaire" }) {
  const isPrimary = badge === "Principal";
  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${isPrimary ? "border-[#F4B400] bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPrimary ? "bg-[#F4B400] text-white" : "bg-gray-400 text-white"}`}>
          {badge}
        </span>
        {isPrimary && <span className="text-xs text-amber-700">← sera conservé</span>}
        {!isPrimary && <span className="text-xs text-gray-500">← sera supprimé</span>}
      </div>

      <div>
        <p className="font-bold text-gray-800 text-base">
          {contact.prenom ? `${contact.prenom} ${contact.nom}` : contact.nom}
        </p>
        <p className="text-sm text-gray-500">{contact.email || <em className="text-gray-400">Pas d'email</em>}</p>
        {contact.telephone && <p className="text-xs text-gray-400">{contact.telephone}</p>}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
          {STAGE_LABELS[contact.lifecycleStage] || contact.lifecycleStage}
        </span>
        {contact.sellsyContactId && (
          <span className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Sellsy
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 text-center text-xs">
        {[
          { label: "Dem.", val: contact._count?.demandesPrix ?? 0 },
          { label: "Devis", val: contact._count?.devis ?? 0 },
          { label: "BDC", val: contact._count?.ventes ?? 0 },
          { label: "Leads", val: contact._count?.leads ?? 0 },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-lg py-1.5 border border-gray-100">
            <div className="font-bold text-gray-800">{val}</div>
            <div className="text-gray-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MergeContactModal({
  primaryContact,
  isOpen,
  onClose,
  onMergeComplete,
}: MergeContactModalProps) {
  const [step, setStep] = useState<"search" | "preview" | "merging">("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ContactSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ContactSummary | null>(null);
  const [swapped, setSwapped] = useState(false); // true = selected est le principal
  const [mergeError, setMergeError] = useState("");

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep("search");
      setSearch("");
      setResults([]);
      setSelected(null);
      setSwapped(false);
      setMergeError("");
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.contacts) {
        // Exclure le contact courant
        setResults(data.contacts.filter((c: ContactSummary) => c.id !== primaryContact.id));
      }
    } catch { /* ignore */ }
    setSearching(false);
  }, [primaryContact.id]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const handleSelect = (contact: ContactSummary) => {
    setSelected(contact);
    setSwapped(false);
    setStep("preview");
  };

  const effectivePrimary = swapped ? selected! : primaryContact;
  const effectiveSecondary = swapped ? primaryContact : selected!;

  const handleMerge = async () => {
    if (!selected) return;
    setStep("merging");
    setMergeError("");
    try {
      const res = await fetch(`/api/contacts/${effectivePrimary.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secondaryContactId: effectiveSecondary.id }),
      });
      const data = await res.json();
      if (data.success) {
        onMergeComplete(effectivePrimary.id);
      } else {
        setMergeError(data.error || "Erreur lors de la fusion");
        setStep("preview");
      }
    } catch {
      setMergeError("Erreur réseau — réessaie dans quelques secondes");
      setStep("preview");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#F4B400]" />
            <h2 className="text-lg font-bold text-gray-800">Fusionner deux contacts</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Étape 1 : Recherche ── */}
          {step === "search" && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Recherche le contact à fusionner avec{" "}
                <strong>{primaryContact.prenom ? `${primaryContact.prenom} ${primaryContact.nom}` : primaryContact.nom}</strong>.
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, prénom ou email..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 focus:border-[#F4B400]"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
              </div>

              {results.length > 0 && (
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
                  {results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{c.email || "Pas d'email"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
                        {c.sellsyContactId && <span className="text-green-600">● Sellsy</span>}
                        <span>{c._count?.devis ?? 0} devis</span>
                        <ArrowRight className="w-4 h-4 text-[#F4B400]" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.trim().length >= 2 && !searching && results.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun résultat pour « {search} »</p>
              )}
            </div>
          )}

          {/* ── Étape 2 : Prévisualisation ── */}
          {step === "preview" && selected && (
            <div className="p-6 space-y-5">
              {/* Avertissement */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Action irréversible.</strong> Toutes les demandes, devis, ventes, leads et RDV du contact secondaire seront transférés vers le contact principal, puis le contact secondaire sera supprimé.
                </div>
              </div>

              {/* Cards côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                <ContactCard contact={effectivePrimary} badge="Principal" />
                <ContactCard contact={effectiveSecondary} badge="Secondaire" />
              </div>

              {/* Bouton inversion */}
              <button
                onClick={() => setSwapped((s) => !s)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Inverser principal / secondaire
              </button>

              {mergeError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {mergeError}
                </p>
              )}
            </div>
          )}

          {/* ── Étape 3 : Fusion en cours ── */}
          {step === "merging" && (
            <div className="p-12 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-[#F4B400] animate-spin" />
              <p className="text-gray-600 font-medium">Fusion en cours…</p>
              <p className="text-sm text-gray-400">Transfert de toutes les données vers le contact principal</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "merging" && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3 shrink-0">
            {step === "preview" ? (
              <>
                <button
                  onClick={() => setStep("search")}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleMerge}
                  className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                >
                  <GitMerge className="w-4 h-4" />
                  Confirmer la fusion
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="ml-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
