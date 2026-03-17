"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import type { Post } from "./types";
import { LABEL_CONFIG } from "./types";
import { CalendrierCell } from "./CalendrierCell";
import { LegendLabels } from "./LegendLabels";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface CalendrierViewProps {
  posts: Post[];
  loading: boolean;
  onCardClick: (post: Post) => void;
  onMonthChange: (year: number, month: number) => void;
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0 .. Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const grid: Array<{ day: number | null; isCurrentMonth: boolean }> = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    grid.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ day: d, isCurrentMonth: true });
  }

  // Next month leading days (fill to complete last week)
  const remaining = 7 - (grid.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      grid.push({ day: d, isCurrentMonth: false });
    }
  }

  return grid;
}

export function CalendrierView({
  posts,
  loading,
  onCardClick,
  onMonthChange,
}: CalendrierViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const grid = useMemo(
    () => getCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Group posts by day (using scheduledDate)
  const postsByDay = useMemo(() => {
    const map = new Map<number, Post[]>();
    for (const post of posts) {
      if (!post.scheduledDate) continue;
      const d = new Date(post.scheduledDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(post);
      }
    }
    return map;
  }, [posts, currentYear, currentMonth]);

  const goToMonth = useCallback(
    (delta: number) => {
      let newMonth = currentMonth + delta;
      let newYear = currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setCurrentYear(newYear);
      setCurrentMonth(newMonth);
      onMonthChange(newYear, newMonth);
    },
    [currentMonth, currentYear, onMonthChange]
  );

  const goToToday = useCallback(() => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    onMonthChange(t.getFullYear(), t.getMonth());
  }, [onMonthChange]);

  const handlePrintChecklist = useCallback(() => {
    const sorted = [...posts]
      .filter((p) => p.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

    if (sorted.length === 0) return;

    const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    const rows = sorted
      .map((post) => {
        const d = new Date(post.scheduledDate!);
        const dateStr = `${joursSemaine[d.getDay()]} ${d.getDate()}`;
        const label = post.labels[0] ? LABEL_CONFIG[post.labels[0]]?.name || "" : "";
        const title = post.title.length > 50 ? `${post.title.slice(0, 50)}…` : post.title;
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;width:24px"><div style="width:14px;height:14px;border:2px solid #9ca3af;border-radius:3px"></div></td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-weight:500;color:#374151">${dateStr}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:11px">${label}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#111827">${title}</td>
        </tr>`;
      })
      .join("");

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Checklist Planning — ${MOIS[currentMonth]} ${currentYear}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: -apple-system, sans-serif; font-size: 13px; color: #111827; padding: 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #6b7280; font-weight: normal; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>Checklist — ${MOIS[currentMonth]} ${currentYear}</h1>
  <h2>DIMEXOI · Planning Réseaux Sociaux · ${sorted.length} posts</h2>
  <table>${rows}</table>
  <script>setTimeout(function(){window.print()},300)<\/script>
</body></html>`);
    w.document.close();
  }, [posts, currentMonth, currentYear]);

  const isToday = (day: number, isCurrentMonth: boolean) =>
    isCurrentMonth &&
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-cockpit-dark rounded animate-pulse" />
          <div className="h-8 w-24 bg-cockpit-dark rounded animate-pulse" />
        </div>
        <div className="h-6 w-full bg-cockpit-dark rounded animate-pulse" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 bg-cockpit-dark rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-cockpit-card rounded-lg border border-cockpit animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h3 className="text-base font-bold text-cockpit-heading min-w-[140px] text-center">
            {MOIS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => goToMonth(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintChecklist}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Imprimer la checklist"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
          <button
            onClick={goToToday}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      {/* Légende */}
      <LegendLabels />

      {/* Header jours */}
      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((jour) => (
          <div
            key={jour}
            className="text-center text-xs font-semibold text-gray-500 py-1"
          >
            {jour}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, i) => (
          <CalendrierCell
            key={i}
            day={cell.day}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={isToday(cell.day ?? 0, cell.isCurrentMonth)}
            posts={
              cell.isCurrentMonth && cell.day
                ? postsByDay.get(cell.day) || []
                : []
            }
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
