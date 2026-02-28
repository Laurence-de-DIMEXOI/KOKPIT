"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  RefreshCw,
  Loader2,
  Search,
  Euro,
  Calendar,
  Filter,
} from "lucide-react";

interface SellsyOrder {
  id: number;
  reference?: string;
  subject?: string;
  status?: string;
  total?: string;
  created?: string;
  contact?: { id: number; name?: string };
  company?: { id: number; name?: string };
}

function statusBadge(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s.includes("invoic") || s.includes("factur"))
    return {
      label: "Facturé",
      cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };
  if (s.includes("accept") || s.includes("valid") || s.includes("deliver"))
    return {
      label: "Validé",
      cls: "bg-cockpit-success/15 text-cockpit-success border-cockpit-success/30",
    };
  if (s.includes("draft") || s.includes("brouillon"))
    return {
      label: "Brouillon",
      cls: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    };
  if (s.includes("cancel") || s.includes("annul"))
    return {
      label: "Annulé",
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  return {
    label: status || "—",
    cls: "bg-cockpit-info/15 text-cockpit-info border-cockpit-info/30",
  };
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<SellsyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/sellsy/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          (o.subject || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.reference || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.company?.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const totalAmount = filteredOrders.reduce(
    (sum, o) => sum + (parseFloat(o.total || "0") || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Bons de Commande
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {total} commandes Sellsy • Total:{" "}
            {totalAmount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync Sellsy
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-4 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-info/40"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-8 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-cockpit-info/40 appearance-none"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="accepted">Accepté</option>
            <option value="invoiced">Facturé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cockpit">
              <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                Référence
              </th>
              <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                Client
              </th>
              <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                Statut
              </th>
              <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                Montant
              </th>
              <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cockpit">
            {filteredOrders.map((order) => {
              const badge = statusBadge(order.status);
              return (
                <tr
                  key={order.id}
                  className="hover:bg-cockpit-dark/50 transition-colors"
                >
                  <td className="p-4">
                    <p className="text-sm font-medium text-cockpit-primary">
                      {order.subject ||
                        order.reference ||
                        `Commande #${order.id}`}
                    </p>
                    {order.reference && order.subject && (
                      <p className="text-xs text-cockpit-secondary">
                        {order.reference}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-cockpit-primary">
                      {order.company?.name || order.contact?.name || "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-semibold text-cockpit-heading">
                      {parseFloat(order.total || "0").toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs text-cockpit-secondary">
                      {order.created
                        ? new Date(order.created).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => {
          const badge = statusBadge(order.status);
          return (
            <div
              key={order.id}
              className="bg-cockpit-card rounded-lg border border-cockpit p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cockpit-heading truncate">
                    {order.subject ||
                      order.reference ||
                      `Commande #${order.id}`}
                  </p>
                  <p className="text-xs text-cockpit-secondary">
                    {order.company?.name || order.contact?.name || "—"}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ml-2 ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-cockpit">
                <div className="flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5 text-cockpit-heading" />
                  <span className="text-sm font-bold text-cockpit-heading">
                    {parseFloat(order.total || "0").toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-cockpit-secondary">
                  <Calendar className="w-3 h-3" />
                  {order.created
                    ? new Date(order.created).toLocaleDateString("fr-FR")
                    : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-cockpit-secondary mx-auto mb-4" />
          <p className="text-cockpit-secondary">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
