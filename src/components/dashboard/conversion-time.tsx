"use client";

import { Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import clsx from "clsx";

interface EstimateRow {
  id: number;
  contact_id?: number;
  date?: string;
  created?: string;
  status?: string;
}

interface OrderRow {
  id: number;
  contact_id?: number;
  date?: string;
  created?: string;
  status?: string;
}

function isCancelled(status?: string): boolean {
  const s = (status || "").toLowerCase();
  return s === "cancelled" || s.includes("annul");
}

function calculateAvgConversionDays(
  estimates: EstimateRow[],
  orders: OrderRow[]
): number | null {
  const activeEstimates = estimates.filter((e) => !isCancelled(e.status));
  const activeOrders = orders.filter((o) => !isCancelled(o.status));

  if (activeOrders.length === 0 || activeEstimates.length === 0) return null;

  // Grouper les devis par contact_id
  const estimatesByContact = new Map<number, EstimateRow[]>();
  for (const est of activeEstimates) {
    if (!est.contact_id) continue;
    if (!estimatesByContact.has(est.contact_id)) {
      estimatesByContact.set(est.contact_id, []);
    }
    estimatesByContact.get(est.contact_id)!.push(est);
  }

  const conversionDays: number[] = [];

  for (const order of activeOrders) {
    if (!order.contact_id) continue;
    const contactEstimates = estimatesByContact.get(order.contact_id);
    if (!contactEstimates || contactEstimates.length === 0) continue;

    const orderDate = new Date(order.date || order.created || "").getTime();
    if (isNaN(orderDate)) continue;

    // Trouver le devis le plus récent AVANT la commande
    const prior = contactEstimates
      .map((e) => ({
        est: e,
        time: new Date(e.date || e.created || "").getTime(),
      }))
      .filter((e) => !isNaN(e.time) && e.time <= orderDate)
      .sort((a, b) => b.time - a.time);

    if (prior.length > 0) {
      const days = Math.floor(
        (orderDate - prior[0].time) / (1000 * 60 * 60 * 24)
      );
      if (days >= 0 && days < 365) {
        // Ignorer les aberrations > 1 an
        conversionDays.push(days);
      }
    }
  }

  if (conversionDays.length === 0) return null;

  return Math.round(
    conversionDays.reduce((a, b) => a + b, 0) / conversionDays.length
  );
}

interface ConversionTimeProps {
  estimates: EstimateRow[];
  orders: OrderRow[];
  previousEstimates?: EstimateRow[];
  previousOrders?: OrderRow[];
}

export function ConversionTime({
  estimates,
  orders,
  previousEstimates,
  previousOrders,
}: ConversionTimeProps) {
  const avgDays = calculateAvgConversionDays(estimates, orders);
  const prevAvgDays =
    previousEstimates && previousOrders
      ? calculateAvgConversionDays(previousEstimates, previousOrders)
      : null;

  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm font-semibold text-cockpit-secondary">
          Temps conversion
        </p>
        <Clock className="w-5 h-5 text-cockpit-info" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
        {avgDays !== null ? `${avgDays}j` : "—"}
      </p>
      {avgDays !== null && prevAvgDays !== null ? (
        <VariationBadge current={avgDays} previous={prevAvgDays} inverted />
      ) : (
        <span className="text-xs text-cockpit-secondary">
          {avgDays !== null ? "Moy. devis → commande" : "Pas assez de données"}
        </span>
      )}
    </div>
  );
}

// Pour le temps de conversion, "moins" est mieux → inverted
function VariationBadge({
  current,
  previous,
  inverted,
}: {
  current: number;
  previous: number;
  inverted?: boolean;
}) {
  if (previous === 0 && current === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-cockpit-secondary">
        <Minus className="w-3 h-3" />—
      </span>
    );
  }

  const pct =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : Math.round(((current - previous) / previous) * 100);

  const isUp = pct > 0;
  const isNeutral = pct === 0;
  // Pour le temps de conversion, une baisse est positive
  const isGood = inverted ? !isUp : isUp;

  return (
    <span
      className={clsx(
        "flex items-center gap-0.5 text-xs font-semibold",
        isNeutral && "text-cockpit-secondary",
        !isNeutral && isGood && "text-cockpit-success",
        !isNeutral && !isGood && "text-red-400"
      )}
    >
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isUp ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {isNeutral
        ? "—"
        : `${pct > 0 ? "+" : ""}${pct}% vs période préc.`}
    </span>
  );
}
