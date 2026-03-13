"use client";

import {
  X, Mail, Phone, MapPin, CheckCircle2, Circle,
  ShoppingBag, Calendar, User, Pencil, Save,
  MessageSquare, Loader2, FileText, ShoppingCart,
  ExternalLink, Activity, Send, PhoneCall, RefreshCw,
} from "lucide-react";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import { traduireStatut } from "@/lib/sellsy-statuts";
import { useEffect, useState, useCallback } from "react";
import { ContactTimeline } from "./contact-timeline";
import { PriorityGauge } from "./priority-badge";
import { calculatePriority } from "@/lib/contact-priority";
import type { PriorityData } from "./priority-badge";

// Types pour les données API
interface DemandePrix {
  id: string;
  meuble: string;
  message: string | null;
  showroom: string | null;
  dateDemande: string | null;
}

interface DevisData {
  id: string;
  sellsyQuoteId: string | null;
  montant: number;
  statut: string;
  dateEnvoi: string | null;
  createdAt: string;
}

interface VenteData {
  id: string;
  sellsyInvoiceId: string | null;
  montant: number;
  dateVente: string;
  createdAt: string;
}

interface EvenementData {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  auteur?: { id: string; nom: string; prenom: string } | null;
}

interface ContactAPI {
  id: string;
  email: string;
  telephone: string | null;
  nom: string;
  prenom: string;
  showroomId: string | null;
  showroom: { id: string; nom: string } | null;
  lifecycleStage: string;
  consentOffre: boolean;
  consentNewsletter: boolean;
  consentInvitation: boolean;
  consentDevis: boolean;
  rgpdEmailConsent: boolean;
  rgpdSmsConsent: boolean;
  notes: string | null;
  sellsyContactId: string | null;
  demandesPrix: DemandePrix[];
  devis: DevisData[];
  ventes: VenteData[];
  evenements?: EvenementData[];
  _count: { demandesPrix: number; leads: number; devis: number; ventes: number };
}

type ContactData = ContactAPI;

interface ContactPreviewDrawerProps {
  contact: ContactData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (contact: ContactAPI) => void;
}

const stageConfig: Record<string, { label: string; bg: string; text: string }> = {
  PROSPECT: { label: "Prospect", bg: "bg-[#03C3EC]/10", text: "text-[#03C3EC]" },
  LEAD: { label: "Lead", bg: "bg-[#FFAB00]/10", text: "text-[#FFAB00]" },
  CLIENT: { label: "Client", bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
  INACTIF: { label: "Inactif", bg: "bg-[#8592A3]/10", text: "text-[#8592A3]" },
};

const devisStatutConfig: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "text-[#8592A3]" },
  ENVOYE: { label: "Envoyé", color: "text-[#03C3EC]" },
  ACCEPTE: { label: "Accepté", color: "text-[#71DD37]" },
  REFUSE: { label: "Refusé", color: "text-[#FF3E1D]" },
  EXPIRE: { label: "Expiré", color: "text-[#8592A3]" },
};

function formatEuro(amount: number) {
  if (amount === 0) return "0 €";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function ContactPreviewDrawer({ contact, isOpen, onClose, onUpdate }: ContactPreviewDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    lifecycleStage: "PROSPECT",
    consentOffre: false, consentNewsletter: false,
    consentInvitation: false, consentDevis: false,
    notes: "",
  });

  // Activity state
  const [activiteEvents, setActiviteEvents] = useState<EvenementData[]>([]);
  const [activitePage, setActivitePage] = useState(1);
  const [activiteHasMore, setActiviteHasMore] = useState(false);
  const [activiteLoading, setActiviteLoading] = useState(false);
  const [newEventType, setNewEventType] = useState<"APPEL" | "NOTE" | "RELANCE">("NOTE");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Sellsy history (live data)
  const [sellsyEstimates, setSellsyEstimates] = useState<any[]>([]);
  const [sellsyOrders, setSellsyOrders] = useState<any[]>([]);
  const [sellsyLoading, setSellsyLoading] = useState(false);
  const [sellsyLinked, setSellsyLinked] = useState(false);
  const [sellsyResolvedVia, setSellsyResolvedVia] = useState<string | null>(null);

  const fetchEvents = useCallback(async (contactId: string, page = 1, append = false) => {
    setActiviteLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/evenements?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setActiviteEvents(prev => append ? [...prev, ...data.evenements] : data.evenements);
        setActiviteHasMore(data.hasMore);
        setActivitePage(page);
      }
    } catch { /* silently fail */ }
    setActiviteLoading(false);
  }, []);

  const handleAddEvent = useCallback(async () => {
    if (!contact || !newEventDesc.trim()) return;
    setSubmittingEvent(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/evenements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newEventType, description: newEventDesc.trim() }),
      });
      if (res.ok) {
        const evt = await res.json();
        setActiviteEvents(prev => [evt, ...prev]);
        setNewEventDesc("");
      }
    } catch { /* silently fail */ }
    setSubmittingEvent(false);
  }, [contact, newEventType, newEventDesc]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!contact) return;
    try {
      const res = await fetch(`/api/contacts/${contact.id}/evenements?eventId=${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setActiviteEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch { /* silently fail */ }
  }, [contact]);

  const fetchSellsyHistory = useCallback(async (contactId: string) => {
    setSellsyLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/sellsy-history`);
      if (res.ok) {
        const data = await res.json();
        setSellsyEstimates(data.estimates || []);
        setSellsyOrders(data.orders || []);
        setSellsyLinked(data.linked || false);
        setSellsyResolvedVia(data.resolvedVia || null);
      }
    } catch { /* silently fail */ }
    setSellsyLoading(false);
  }, []);

  useEffect(() => {
    if (!contact) return;
    setForm({
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      telephone: contact.telephone || "",
      lifecycleStage: contact.lifecycleStage,
      consentOffre: contact.consentOffre,
      consentNewsletter: contact.consentNewsletter,
      consentInvitation: contact.consentInvitation,
      consentDevis: contact.consentDevis,
      notes: contact.notes || "",
    });
    setEditing(false);
    // Load events + Sellsy history
    fetchEvents(contact.id);
    fetchSellsyHistory(contact.id);
  }, [contact, fetchEvents, fetchSellsyHistory]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSave = useCallback(async () => {
    if (!contact) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setEditing(false);
        if (onUpdate) onUpdate(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }, [contact, form, onUpdate]);

  if (!isOpen || !contact) return null;

  const stage = stageConfig[form.lifecycleStage] || stageConfig.PROSPECT;
  const initials = form.nom.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const demandes = contact.demandesPrix || [];
  const devis = contact.devis || [];
  const ventes = contact.ventes || [];
  const nbDemandes = contact._count?.demandesPrix || 0;
  const nbDevis = contact._count?.devis || 0;
  const nbVentes = contact._count?.ventes || 0;
  const totalDevisHT = devis.reduce((sum, d) => sum + (d.montant || 0), 0);
  const totalVentesHT = ventes.reduce((sum, v) => sum + (v.montant || 0), 0);

  // Sellsy PDF URL (ouvre dans Sellsy web)
  const getSellsyEstimateUrl = (sellsyQuoteId: string | null) => {
    if (!sellsyQuoteId) return null;
    return getSellsyUrl('estimate', sellsyQuoteId);
  };

  const getSellsyOrderUrl = (sellsyInvoiceId: string | null) => {
    if (!sellsyInvoiceId) return null;
    return getSellsyUrl('order', sellsyInvoiceId);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] lg:w-[520px] bg-white z-50 flex flex-col shadow-2xl"
        style={{ animation: "slideIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 border-b border-[#E8EAED] bg-[#F5F6F7]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#F4B400] to-[#FFAB00] flex items-center justify-center text-base sm:text-lg font-bold text-white shadow-md flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="text-lg font-bold text-[#1F2937] bg-white border border-[#E8EAED] rounded-lg px-2 py-1 w-1/2" placeholder="Nom" />
                <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  className="text-lg font-bold text-[#1F2937] bg-white border border-[#E8EAED] rounded-lg px-2 py-1 w-1/2" placeholder="Prénom" />
              </div>
            ) : (
              <h2 className="text-xl font-bold text-[#1F2937] truncate">
                {form.prenom ? `${form.prenom} ${form.nom}` : form.nom}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {editing ? (
                <select value={form.lifecycleStage} onChange={e => setForm(f => ({ ...f, lifecycleStage: e.target.value }))}
                  className="text-xs font-semibold border border-[#E8EAED] rounded-full px-3 py-1 bg-white">
                  <option value="PROSPECT">Prospect</option>
                  <option value="LEAD">Lead</option>
                  <option value="CLIENT">Client</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${stage.bg} ${stage.text}`}>{stage.label}</span>
              )}
              <span className="text-xs text-[#8592A3]">{nbDemandes} dem.</span>
              {nbDevis > 0 && <span className="text-xs text-[#03C3EC]">{nbDevis} devis</span>}
              {nbVentes > 0 && <span className="text-xs text-[#71DD37]">{nbVentes} BDC</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {editing ? (
              <button onClick={handleSave} disabled={saving} className="p-2 bg-[#F4B400] text-white rounded-lg hover:opacity-90 transition-opacity">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="p-2 hover:bg-[#F4B400]/10 rounded-lg transition-colors">
                <Pencil className="w-5 h-5 text-[#8592A3]" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#8592A3]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Priority Gauge */}
          {(() => {
            const priority: PriorityData = calculatePriority(
              { lifecycleStage: contact.lifecycleStage, createdAt: contact.devis?.[0]?.createdAt || new Date().toISOString() },
              devis.map(d => ({ statut: d.statut, dateEnvoi: d.dateEnvoi, createdAt: d.createdAt })),
              ventes.map(v => ({ dateVente: v.dateVente, createdAt: v.createdAt }))
            );
            return priority.score > 0 ? (
              <div className="p-6 border-b border-[#E8EAED]">
                <PriorityGauge priority={priority} />
              </div>
            ) : null;
          })()}

          {/* Informations */}
          <div className="p-6 border-b border-[#E8EAED]">
            <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
              <User className="w-4 h-4 inline-block mr-2 -mt-0.5" />Informations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
                {editing ? (
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="flex-1 text-sm border border-[#E8EAED] rounded-lg px-3 py-2 bg-white" placeholder="Email" />
                ) : (
                  <a href={`mailto:${form.email}`} className="text-sm text-[#F4B400] hover:underline truncate">{form.email}</a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
                {editing ? (
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    className="flex-1 text-sm border border-[#E8EAED] rounded-lg px-3 py-2 bg-white" placeholder="Téléphone" />
                ) : (
                  <a href={`tel:${form.telephone}`} className="text-sm text-[#32475C] font-medium">{form.telephone || "—"}</a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
                <span className="text-sm text-[#32475C]">
                  {contact.showroom?.nom || "Non défini"}
                </span>
              </div>
              {contact.sellsyContactId && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#71DD37] flex-shrink-0" />
                  <span className="text-sm text-[#71DD37] font-medium">Lié à Sellsy (ID: {contact.sellsyContactId})</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents Sellsy (unifié) */}
          <div className="p-6 border-b border-[#E8EAED]">
            <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
              <FileText className="w-4 h-4 inline-block mr-2 -mt-0.5" />Documents Sellsy
              {sellsyLinked && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#71DD37]/10 text-[#71DD37]">
                  {sellsyResolvedVia === "email" ? "via email" : "lié"}
                </span>
              )}
            </h3>
            {sellsyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#8592A3]" />
              </div>
            ) : (() => {
              // Priorité : données live Sellsy > données DB
              const liveEstimates = sellsyLinked ? sellsyEstimates : [];
              const liveOrders = sellsyLinked ? sellsyOrders : [];
              const hasLive = liveEstimates.length > 0 || liveOrders.length > 0;
              const hasDb = devis.length > 0 || ventes.length > 0;

              if (!hasLive && !hasDb) {
                return (
                  <p className="text-sm text-[#8592A3]">
                    {sellsyLinked ? "Aucun document trouvé dans Sellsy" : "Contact non lié à Sellsy"}
                  </p>
                );
              }

              const showEstimates = hasLive ? liveEstimates : [];
              const showOrders = hasLive ? liveOrders : [];
              const dbDevis = !hasLive ? devis : [];
              const dbVentes = !hasLive ? ventes : [];

              return (
                <div className="space-y-4">
                  {/* Devis — live Sellsy */}
                  {showEstimates.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#03C3EC] mb-2">Devis ({showEstimates.length})</p>
                      <div className="space-y-1.5">
                        {showEstimates.slice(0, 5).map((est: any) => {
                          const montant = est.amounts?.total_excl_tax ?? est.amounts?.total ?? 0;
                          return (
                            <a key={est.id} href={getSellsyUrl('estimate', est.id)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#03C3EC]/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#03C3EC]" />
                                <span className="text-xs font-medium text-[#03C3EC]">{est.number || `#${est.id}`}</span>
                                {est.status && <span className="text-[10px] text-[#8592A3]">{traduireStatut(est.status)}</span>}
                                <ExternalLink className="w-2.5 h-2.5 text-[#8592A3]" />
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#32475C]">{typeof montant === "number" ? formatEuro(montant) : montant}</span>
                                {est.date && <span className="text-[10px] text-[#8592A3] ml-2">{formatDate(est.date)}</span>}
                              </div>
                            </a>
                          );
                        })}
                        {showEstimates.length > 5 && <p className="text-xs text-[#8592A3] text-center">+{showEstimates.length - 5} autres devis</p>}
                      </div>
                    </div>
                  )}

                  {/* Devis — fallback DB */}
                  {dbDevis.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#03C3EC] mb-2">Devis ({dbDevis.length})</p>
                      <div className="space-y-1.5">
                        {dbDevis.map((d) => {
                          const url = getSellsyEstimateUrl(d.sellsyQuoteId);
                          const statutCfg = devisStatutConfig[d.statut] || devisStatutConfig.EN_ATTENTE;
                          return (
                            <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#03C3EC]/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#03C3EC]" />
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#03C3EC] hover:underline flex items-center gap-1">
                                    {d.sellsyQuoteId ? `#${d.sellsyQuoteId}` : "Devis"} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-xs font-medium text-[#32475C]">Devis</span>
                                )}
                                <span className={`text-[10px] font-semibold ${statutCfg.color}`}>{statutCfg.label}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#32475C]">{formatEuro(d.montant)}</span>
                                <span className="text-[10px] text-[#8592A3] ml-2">{d.dateEnvoi ? formatDate(d.dateEnvoi) : formatDate(d.createdAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Commandes — live Sellsy */}
                  {showOrders.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#71DD37] mb-2">Commandes ({showOrders.length})</p>
                      <div className="space-y-1.5">
                        {showOrders.slice(0, 5).map((ord: any) => {
                          const montant = ord.amounts?.total_excl_tax ?? ord.amounts?.total ?? 0;
                          return (
                            <a key={ord.id} href={getSellsyUrl('order', ord.id)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#71DD37]/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5 text-[#71DD37]" />
                                <span className="text-xs font-medium text-[#71DD37]">{ord.number || `#${ord.id}`}</span>
                                {ord.status && <span className="text-[10px] text-[#8592A3]">{traduireStatut(ord.status)}</span>}
                                <ExternalLink className="w-2.5 h-2.5 text-[#8592A3]" />
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#32475C]">{typeof montant === "number" ? formatEuro(montant) : montant}</span>
                                {ord.date && <span className="text-[10px] text-[#8592A3] ml-2">{formatDate(ord.date)}</span>}
                              </div>
                            </a>
                          );
                        })}
                        {showOrders.length > 5 && <p className="text-xs text-[#8592A3] text-center">+{showOrders.length - 5} autres commandes</p>}
                      </div>
                    </div>
                  )}

                  {/* Commandes — fallback DB */}
                  {dbVentes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#71DD37] mb-2">Commandes ({dbVentes.length})</p>
                      <div className="space-y-1.5">
                        {dbVentes.map((v) => {
                          const url = getSellsyOrderUrl(v.sellsyInvoiceId);
                          return (
                            <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#71DD37]/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5 text-[#71DD37]" />
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#71DD37] hover:underline flex items-center gap-1">
                                    {v.sellsyInvoiceId ? `#${v.sellsyInvoiceId}` : "BDC"} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-xs font-medium text-[#32475C]">BDC</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#71DD37]">{formatEuro(v.montant)}</span>
                                <span className="text-[10px] text-[#8592A3] ml-2">{formatDate(v.dateVente)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Activité */}
          <div className="p-6 border-b border-[#E8EAED]">
            <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
              <Activity className="w-4 h-4 inline-block mr-2 -mt-0.5" />Activité
            </h3>

            {/* Formulaire inline */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2">
                {([
                  { value: "NOTE" as const, icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Note" },
                  { value: "APPEL" as const, icon: <PhoneCall className="w-3.5 h-3.5" />, label: "Appel" },
                  { value: "RELANCE" as const, icon: <RefreshCw className="w-3.5 h-3.5" />, label: "Relance" },
                ]).map(({ value, icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setNewEventType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      newEventType === value
                        ? "bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/30"
                        : "bg-[#F5F6F7] text-[#8592A3] border border-[#E8EAED] hover:border-[#F4B400]/30"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddEvent(); } }}
                  placeholder={newEventType === "APPEL" ? "Résumé de l'appel..." : newEventType === "RELANCE" ? "Détail de la relance..." : "Ajouter une note..."}
                  className="flex-1 text-sm border border-[#E8EAED] rounded-lg px-3 py-2 bg-white placeholder:text-[#8592A3]/60 focus:outline-none focus:border-[#F4B400]/50"
                />
                <button
                  onClick={handleAddEvent}
                  disabled={submittingEvent || !newEventDesc.trim()}
                  className="px-3 py-2 bg-[#F4B400] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submittingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Timeline */}
            {activiteLoading && activiteEvents.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#8592A3]" />
              </div>
            ) : (
              <ContactTimeline
                events={activiteEvents}
                hasMore={activiteHasMore}
                onLoadMore={() => fetchEvents(contact.id, activitePage + 1, true)}
                onDelete={handleDeleteEvent}
              />
            )}
          </div>

          {/* Consentements */}
          <div className="p-6 border-b border-[#E8EAED]">
            <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
              <CheckCircle2 className="w-4 h-4 inline-block mr-2 -mt-0.5" />Consentements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "consentOffre" as const, label: "Offres commerciales" },
                { key: "consentNewsletter" as const, label: "Newsletter" },
                { key: "consentInvitation" as const, label: "Invitations événements" },
                { key: "consentDevis" as const, label: "Demandes de devis" },
              ]).map(({ key, label }) => {
                const value = form[key];
                return (
                  <div key={key}
                    onClick={editing ? () => setForm(f => ({ ...f, [key]: !f[key] })) : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                      editing ? "cursor-pointer hover:border-[#F4B400]/50" : ""
                    } ${value ? "border-[#71DD37]/30 bg-[#71DD37]/5" : "border-[#E8EAED] bg-[#F5F6F7]"}`}
                  >
                    {value ? <CheckCircle2 className="w-4 h-4 text-[#71DD37] flex-shrink-0" /> : <Circle className="w-4 h-4 text-[#8592A3] flex-shrink-0" />}
                    <span className={`text-sm ${value ? "text-[#32475C] font-medium" : "text-[#8592A3]"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {(editing || form.notes) && (
            <div className="p-6 border-b border-[#E8EAED]">
              <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
                <MessageSquare className="w-4 h-4 inline-block mr-2 -mt-0.5" />Notes
              </h3>
              {editing ? (
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} className="w-full text-sm border border-[#E8EAED] rounded-lg px-3 py-2 bg-white resize-none" placeholder="Ajouter une note..." />
              ) : (
                <p className="text-sm text-[#32475C]">{form.notes}</p>
              )}
            </div>
          )}

          {/* Meubles demandés */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4">
              <ShoppingBag className="w-4 h-4 inline-block mr-2 -mt-0.5" />Demandes de prix
              {nbDemandes > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#F4B400]/10 text-[#F4B400]">{nbDemandes}</span>
              )}
            </h3>
            {demandes.length > 0 ? (
              <div className="space-y-2">
                {demandes.map((req, idx) => (
                  <div key={req.id || idx} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#F4B400]/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#32475C]">{req.meuble}</span>
                      {req.dateDemande && (
                        <div className="flex items-center gap-1.5 text-xs text-[#8592A3]">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(req.dateDemande)}
                        </div>
                      )}
                    </div>
                    {req.message && <p className="text-xs text-[#8592A3] mt-1 line-clamp-2">{req.message}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8592A3]">Aucune demande enregistrée</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8EAED] bg-[#F5F6F7]">
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)}
                className="flex-1 text-center border border-[#E8EAED] text-[#32475C] px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors text-sm">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 text-center bg-[#F4B400] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          ) : (
            <a href={`/contacts/${contact.id}`}
              className="block w-full text-center bg-[#F4B400] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm">
              Voir la fiche complète
            </a>
          )}
        </div>
      </div>
    </>
  );
}
