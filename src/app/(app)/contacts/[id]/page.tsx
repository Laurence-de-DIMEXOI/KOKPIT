"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, CheckCircle2, Circle, Mail, Phone, MapPin,
  FileText, ShoppingCart, Calendar, ExternalLink, Loader2,
  User, ShoppingBag, MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface ContactData {
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
  sellsyContactId: string | null;
  notes: string | null;
  demandesPrix: { id: string; meuble: string; message: string | null; dateDemande: string | null }[];
  devis: { id: string; sellsyQuoteId: string | null; montant: number; statut: string; dateEnvoi: string | null; createdAt: string }[];
  ventes: { id: string; sellsyInvoiceId: string | null; montant: number; dateVente: string; createdAt: string }[];
  _count: { demandesPrix: number; devis: number; ventes: number; leads: number };
}

interface SellsyDoc {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  date?: string;
  created?: string;
  company_name?: string;
  amounts?: Record<string, any>;
  pdf_link?: string;
}

interface SellsyHistory {
  estimates: SellsyDoc[];
  orders: SellsyDoc[];
  linked: boolean;
}

const stageConfig: Record<string, { label: string; bg: string; text: string }> = {
  PROSPECT: { label: "Prospect", bg: "bg-[#03C3EC]/10", text: "text-[#03C3EC]" },
  LEAD: { label: "Lead", bg: "bg-[#FFAB00]/10", text: "text-[#FFAB00]" },
  CLIENT: { label: "Client", bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
  INACTIF: { label: "Inactif", bg: "bg-[#8592A3]/10", text: "text-[#8592A3]" },
};

function formatEuro(amount: number) {
  if (amount === 0) return "0 €";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return dateStr; }
}

function getAmount(amounts?: Record<string, any>): number {
  if (!amounts) return 0;
  const val = amounts.total ?? amounts.total_excl_tax ?? 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    draft: "Brouillon", sent: "Envoyé", read: "Lu", accepted: "Accepté",
    advanced: "Acompte", refused: "Refusé", invoiced: "Facturé",
    partialinvoiced: "Fact. partielle", expired: "Expiré", cancelled: "Annulé",
  };
  return map[(status || "").toLowerCase()] || status || "—";
}

function statusColor(status?: string): string {
  const map: Record<string, string> = {
    draft: "text-[#8592A3]", sent: "text-[#03C3EC]", read: "text-cyan-500",
    accepted: "text-[#71DD37]", advanced: "text-blue-500", refused: "text-[#FF3E1D]",
    invoiced: "text-purple-500", partialinvoiced: "text-purple-400",
    expired: "text-orange-500", cancelled: "text-[#8592A3]",
  };
  return map[(status || "").toLowerCase()] || "text-[#8592A3]";
}

export default function ContactDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [contact, setContact] = useState<ContactData | null>(null);
  const [sellsyHistory, setSellsyHistory] = useState<SellsyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string>("");

  useEffect(() => {
    params.then(p => setContactId(p.id));
  }, [params]);

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setContact(data);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  const fetchSellsyHistory = useCallback(async () => {
    if (!contactId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/sellsy-history`);
      if (res.ok) {
        setSellsyHistory(await res.json());
      }
    } catch {
      // Silently fail — synced data will still show
    } finally {
      setHistoryLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchSellsyHistory();
    }
  }, [contactId, fetchContact, fetchSellsyHistory]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/contacts" className="flex items-center gap-2 text-[#F4B400] hover:opacity-80 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux contacts
        </Link>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#03C3EC]" />
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <Link href="/contacts" className="flex items-center gap-2 text-[#F4B400] hover:opacity-80 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux contacts
        </Link>
        <div className="text-center py-12">
          <p className="text-[#8592A3]">{error || "Contact non trouvé"}</p>
        </div>
      </div>
    );
  }

  const stage = stageConfig[contact.lifecycleStage] || stageConfig.PROSPECT;
  const initials = contact.nom.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const devis = contact.devis || [];
  const ventes = contact.ventes || [];
  const demandes = contact.demandesPrix || [];
  const totalDevisHT = devis.reduce((s, d) => s + (d.montant || 0), 0);
  const totalVentesHT = ventes.reduce((s, v) => s + (v.montant || 0), 0);

  // Merge synced + live Sellsy data (dedup by ID)
  const liveEstimates = sellsyHistory?.estimates || [];
  const liveOrders = sellsyHistory?.orders || [];

  return (
    <div className="space-y-6">
      <Link href="/contacts" className="flex items-center gap-2 text-[#F4B400] hover:opacity-80 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour aux contacts
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F4B400] to-[#FFAB00] flex items-center justify-center text-lg font-bold text-white shadow-md flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
            {contact.prenom ? `${contact.prenom} ${contact.nom}` : contact.nom}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${stage.bg} ${stage.text}`}>
              {stage.label}
            </span>
            {contact.sellsyContactId && (
              <span className="inline-flex items-center gap-1 text-xs text-[#71DD37] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lié Sellsy
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Informations
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="text-sm text-[#F4B400] hover:underline truncate">{contact.email}</a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
              <span className="text-sm text-[#32475C]">{contact.telephone || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
              <span className="text-sm text-[#32475C]">{contact.showroom?.nom || "Non défini"}</span>
            </div>
          </div>
          {contact.notes && (
            <div className="mt-4 pt-4 border-t border-[#E8EAED]">
              <h3 className="text-xs font-semibold text-[#8592A3] mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Notes
              </h3>
              <p className="text-sm text-[#32475C]">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Consentements */}
        <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Consentements
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "consentOffre" as const, label: "Offres commerciales" },
              { key: "consentNewsletter" as const, label: "Newsletter" },
              { key: "consentInvitation" as const, label: "Invitations" },
              { key: "consentDevis" as const, label: "Demandes devis" },
            ]).map(({ key, label }) => {
              const value = contact[key];
              return (
                <div key={key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${
                  value ? "border-[#71DD37]/30 bg-[#71DD37]/5" : "border-[#E8EAED] bg-[#F5F6F7]"
                }`}>
                  {value ? <CheckCircle2 className="w-4 h-4 text-[#71DD37] flex-shrink-0" /> : <Circle className="w-4 h-4 text-[#8592A3] flex-shrink-0" />}
                  <span className={`text-sm ${value ? "text-[#32475C] font-medium" : "text-[#8592A3]"}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historique Sellsy — Devis */}
      <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Devis Sellsy
          {devis.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#03C3EC]/10 text-[#03C3EC]">{devis.length}</span>
          )}
          {totalDevisHT > 0 && (
            <span className="ml-1 text-xs font-normal text-[#32475C]">{formatEuro(totalDevisHT)} HT</span>
          )}
          {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-[#03C3EC] ml-2" />}
        </h2>

        {/* Synced devis from DB */}
        {devis.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-semibold text-[#8592A3] uppercase">Synchronisés</p>
            {devis.map((d) => (
              <div key={d.id} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#03C3EC]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {d.sellsyQuoteId ? (
                      <a href={`https://go.sellsy.com/doc/estimate/${d.sellsyQuoteId}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-[#03C3EC] hover:underline flex items-center gap-1">
                        #{d.sellsyQuoteId} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-[#32475C]">Devis</span>
                    )}
                    <span className="text-xs font-semibold text-[#8592A3]">{d.statut}</span>
                  </div>
                  <span className="text-sm font-bold text-[#32475C]">{formatEuro(d.montant)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8592A3]">
                  <Calendar className="w-3 h-3" />
                  {d.dateEnvoi ? formatDate(d.dateEnvoi) : formatDate(d.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Sellsy estimates */}
        {liveEstimates.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-[#8592A3] uppercase">Historique Sellsy complet</p>
            {liveEstimates.map((e) => (
              <div key={e.id} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#03C3EC]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a href={`https://go.sellsy.com/doc/estimate/${e.id}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-[#03C3EC] hover:underline flex items-center gap-1">
                      {e.number || `#${e.id}`} <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className={`text-xs font-semibold ${statusColor(e.status)}`}>{statusLabel(e.status)}</span>
                    {e.pdf_link && (
                      <a href={e.pdf_link} target="_blank" rel="noopener noreferrer" className="text-[#03C3EC] hover:text-[#03C3EC]/80" title="PDF">
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#32475C]">{formatEuro(getAmount(e.amounts))}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#8592A3]">
                  <span className="truncate">{e.subject || e.company_name || ""}</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(e.date || e.created || null)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {devis.length === 0 && liveEstimates.length === 0 && !historyLoading && (
          <p className="text-sm text-[#8592A3]">Aucun devis</p>
        )}
      </div>

      {/* Historique Sellsy — Bons de commande */}
      <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> Bons de commande
          {ventes.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#71DD37]/10 text-[#71DD37]">{ventes.length}</span>
          )}
          {totalVentesHT > 0 && (
            <span className="ml-1 text-xs font-normal text-[#32475C]">{formatEuro(totalVentesHT)} HT</span>
          )}
          {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-[#71DD37] ml-2" />}
        </h2>

        {/* Synced ventes from DB */}
        {ventes.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-semibold text-[#8592A3] uppercase">Synchronisés</p>
            {ventes.map((v) => (
              <div key={v.id} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#71DD37]/30 transition-colors">
                <div className="flex items-center justify-between">
                  {v.sellsyInvoiceId ? (
                    <a href={`https://go.sellsy.com/doc/order/${v.sellsyInvoiceId}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-[#71DD37] hover:underline flex items-center gap-1">
                      #{v.sellsyInvoiceId} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-[#32475C]">BDC</span>
                  )}
                  <span className="text-sm font-bold text-[#71DD37]">{formatEuro(v.montant)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8592A3]">
                  <Calendar className="w-3 h-3" />
                  {formatDate(v.dateVente)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Sellsy orders */}
        {liveOrders.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-[#8592A3] uppercase">Historique Sellsy complet</p>
            {liveOrders.map((o) => (
              <div key={o.id} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#71DD37]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a href={`https://go.sellsy.com/doc/order/${o.id}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-[#71DD37] hover:underline flex items-center gap-1">
                      {o.number || `#${o.id}`} <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className={`text-xs font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                    {o.pdf_link && (
                      <a href={o.pdf_link} target="_blank" rel="noopener noreferrer" className="text-[#71DD37] hover:text-[#71DD37]/80" title="PDF">
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#71DD37]">{formatEuro(getAmount(o.amounts))}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#8592A3]">
                  <span className="truncate">{o.subject || o.company_name || ""}</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(o.date || o.created || null)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {ventes.length === 0 && liveOrders.length === 0 && !historyLoading && (
          <p className="text-sm text-[#8592A3]">Aucun bon de commande</p>
        )}
      </div>

      {/* Demandes de prix */}
      {demandes.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#8592A3] uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Demandes de prix
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#F4B400]/10 text-[#F4B400]">{demandes.length}</span>
          </h2>
          <div className="space-y-2">
            {demandes.map((req) => (
              <div key={req.id} className="px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED] hover:border-[#F4B400]/30 transition-colors">
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
        </div>
      )}
    </div>
  );
}
