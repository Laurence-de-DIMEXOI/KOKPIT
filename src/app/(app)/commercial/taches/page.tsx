"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  Pencil,
  AlertTriangle,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import { TaskForm } from "@/components/commercial/task-form";

type TaskStatut = "A_FAIRE" | "EN_COURS" | "TERMINEE";
type FilterStatut = "ALL" | TaskStatut;
type Period = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
  all: "Tout",
};

function getPeriodStart(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // year
  return new Date(now.getFullYear(), 0, 1);
}

interface TaskData {
  id: string;
  titre: string;
  description: string | null;
  echeance: string | null;
  statut: TaskStatut;
  contactId: string | null;
  assigneAId: string;
  createdById: string;
  createdAt: string;
  contact?: { id: string; nom: string; prenom: string; email: string } | null;
  assigneA?: { id: string; nom: string; prenom: string } | null;
  createdBy?: { id: string; nom: string; prenom: string } | null;
}

const STATUT_CONFIG: Record<TaskStatut, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  A_FAIRE: { label: "À faire", icon: <Circle className="w-4 h-4" />, bg: "bg-gray-100", text: "text-gray-600" },
  EN_COURS: { label: "En cours", icon: <Clock className="w-4 h-4" />, bg: "bg-[#F4B400]/10", text: "text-[#F4B400]" },
  TERMINEE: { label: "Terminée", icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
};

function isOverdue(echeance: string | null): boolean {
  if (!echeance) return false;
  return new Date(echeance) < new Date();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TachesPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatut>("ALL");
  const [period, setPeriod] = useState<Period>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async (data: { titre: string; description: string; echeance: string; contactId: string; assigneAId: string }) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: data.titre,
        description: data.description || undefined,
        echeance: data.echeance ? new Date(data.echeance).toISOString() : undefined,
        contactId: data.contactId || undefined,
        assigneAId: data.assigneAId || undefined,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
    }
  };

  const handleUpdate = async (data: { titre: string; description: string; echeance: string; contactId: string; assigneAId: string; statut?: string }) => {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: data.titre,
        description: data.description || null,
        echeance: data.echeance ? new Date(data.echeance).toISOString() : null,
        statut: data.statut || editingTask.statut,
        contactId: data.contactId || null,
        assigneAId: data.assigneAId || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
    }
  };

  const handleToggleStatut = async (task: TaskData) => {
    const nextStatut: TaskStatut = task.statut === "A_FAIRE" ? "EN_COURS" : task.statut === "EN_COURS" ? "TERMINEE" : "A_FAIRE";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nextStatut }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  const handleDelete = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  // Filtrage par période (sur createdAt)
  const periodStart = getPeriodStart(period);
  const periodFiltered = periodStart
    ? tasks.filter((t) => new Date(t.createdAt) >= periodStart)
    : tasks;

  const filtered = filter === "ALL" ? periodFiltered : periodFiltered.filter((t) => t.statut === filter);
  const counts = {
    ALL: periodFiltered.length,
    A_FAIRE: periodFiltered.filter((t) => t.statut === "A_FAIRE").length,
    EN_COURS: periodFiltered.filter((t) => t.statut === "EN_COURS").length,
    TERMINEE: periodFiltered.filter((t) => t.statut === "TERMINEE").length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <ClipboardList className="w-5 sm:w-6 h-5 sm:h-6 text-[#F4B400]" />
            Mes Tâches
          </h1>
          <p className="text-xs sm:text-sm text-[#8592A3] mt-1">
            {counts.A_FAIRE} à faire &middot; {counts.EN_COURS} en cours &middot; {counts.TERMINEE} terminée{counts.TERMINEE > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity w-full sm:w-auto"
          style={{ backgroundColor: 'var(--color-active)' }}
        >
          <Plus className="w-4 h-4" /> Nouvelle tâche
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "A_FAIRE", "EN_COURS", "TERMINEE"] as FilterStatut[]).map((s) => {
          const label = s === "ALL" ? "Toutes" : STATUT_CONFIG[s as TaskStatut].label;
          const count = counts[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx(
                "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                filter === s
                  ? "bg-[#F4B400] text-white"
                  : "bg-white border border-[#E8EAED] text-[#32475C] hover:border-[#F4B400]/30"
              )}
            >
              {label} ({count})
            </button>
          );
        })}
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-[#8592A3]" />
          {(["week", "month", "year", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === p
                  ? "bg-[#1F2937] text-white"
                  : "text-[#8592A3] hover:bg-gray-100"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F4B400]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8EAED]">
          <ClipboardList className="w-12 h-12 text-[#E8EAED] mx-auto mb-3" />
          <p className="text-[#8592A3] text-sm">
            {filter === "ALL" ? "Aucune tâche pour le moment" : "Aucune tâche avec ce statut"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const cfg = STATUT_CONFIG[task.statut];
            const overdue = task.statut !== "TERMINEE" && isOverdue(task.echeance);

            return (
              <div
                key={task.id}
                className={clsx(
                  "bg-white rounded-xl border px-4 sm:px-5 py-3 sm:py-4 hover:shadow-sm transition-shadow group",
                  overdue ? "border-red-200" : "border-[#E8EAED]"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Statut toggle */}
                  <button
                    onClick={() => handleToggleStatut(task)}
                    className={clsx("mt-0.5 p-1 rounded-full transition-colors", cfg.bg, cfg.text, "hover:opacity-70")}
                    title={`Passer à ${task.statut === "A_FAIRE" ? "En cours" : task.statut === "EN_COURS" ? "Terminée" : "À faire"}`}
                  >
                    {cfg.icon}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={clsx(
                        "text-sm font-semibold",
                        task.statut === "TERMINEE" ? "text-[#8592A3] line-through" : "text-[#1F2937]"
                      )}>
                        {task.titre}
                      </h3>
                      {overdue && (
                        <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                          <AlertTriangle className="w-3 h-3" /> En retard
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#8592A3] line-clamp-1 mb-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#8592A3]">
                      {task.echeance && (
                        <span className={clsx("flex items-center gap-1", overdue && "text-red-500")}>
                          <Clock className="w-3 h-3" /> {formatDate(task.echeance)}
                        </span>
                      )}
                      {task.contact && (
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> {task.contact.prenom} {task.contact.nom}
                        </span>
                      )}
                      {task.assigneA && (
                        <span className="text-[#8592A3]">→ {task.assigneA.prenom} {task.assigneA.nom}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingTask(task); setShowForm(true); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#8592A3]" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        initialData={editingTask ? {
          titre: editingTask.titre,
          description: editingTask.description || "",
          echeance: editingTask.echeance || "",
          contactId: editingTask.contactId || "",
          assigneAId: editingTask.assigneAId,
          statut: editingTask.statut,
        } : undefined}
        title={editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
      />
    </div>
  );
}
