"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, Info, ExternalLink } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { notifierDesktop } from "@/lib/notifications-desktop";

interface NotificationItem {
  type: string;
  message: string;
  severity: "danger" | "warning" | "info";
  href?: string;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        const newItems: NotificationItem[] = data.items || [];
        setItems(newItems);

        // Notifications desktop pour les alertes critiques
        const critical = newItems.filter(
          (i) => i.severity === "danger" || i.severity === "warning"
        );
        for (const item of critical) {
          notifierDesktop("KOKPIT", item.message);
        }
      } catch {
        // Silently fail
      }
    };
    fetchNotifs();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const severityConfig = {
    danger: {
      icon: AlertTriangle,
      dot: "bg-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      dot: "bg-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      iconColor: "text-orange-500",
    },
    info: {
      icon: Info,
      dot: "bg-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconColor: "text-blue-500",
    },
  };

  const hasNotifs = items.length > 0;
  const hasDanger = items.some((i) => i.severity === "danger");
  const hasWarning = items.some((i) => i.severity === "warning");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "relative p-2 rounded-lg transition-colors",
          "hover:bg-cockpit-dark/80",
          open && "bg-cockpit-dark/80"
        )}
      >
        <Bell
          className={clsx(
            "w-5 h-5",
            hasNotifs ? "text-cockpit-heading" : "text-cockpit-secondary"
          )}
        />
        {hasNotifs && (
          <span
            className={clsx(
              "absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-cockpit-card",
              hasDanger
                ? "bg-red-500"
                : hasWarning
                  ? "bg-orange-500"
                  : "bg-blue-500"
            )}
          />
        )}
      </button>

      {open && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-2 z-50",
            "w-80 bg-white rounded-xl shadow-2xl border border-gray-200",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1F2937]">
              Notifications
            </h3>
            {!hasNotifs && (
              <p className="text-xs text-gray-400 mt-0.5">
                Tout est en ordre !
              </p>
            )}
          </div>

          {/* Items */}
          {hasNotifs ? (
            <div className="max-h-64 overflow-y-auto">
              {items.map((item, i) => {
                const config = severityConfig[item.severity];
                const Icon = config.icon;
                return (
                  <div key={i}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        )}
                      >
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            config.bg
                          )}
                        >
                          <Icon className={clsx("w-4 h-4", config.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1F2937] leading-snug">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                            Voir <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            config.bg
                          )}
                        >
                          <Icon className={clsx("w-4 h-4", config.iconColor)} />
                        </div>
                        <p className="text-sm text-[#1F2937] leading-snug">
                          {item.message}
                        </p>
                      </div>
                    )}
                    {i < items.length - 1 && (
                      <div className="border-b border-gray-100 mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
