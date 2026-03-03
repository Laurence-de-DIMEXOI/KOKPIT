"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  Check,
  X,
  Filter,
  CalendarPlus,
  User,
} from "lucide-react";
import clsx from "clsx";

type LeaveStatus = "pending" | "approved" | "rejected";
type LeaveType = "congé_payé" | "rtt" | "sans_solde" | "maladie";

interface LeaveRequest {
  id: string;
  collaborator: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  status: LeaveStatus;
  requestDate: string;
}

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "1",
    collaborator: "Michelle Perrot",
    type: "congé_payé",
    startDate: "2026-03-03",
    endDate: "2026-03-16",
    duration: 10,
    status: "approved",
    requestDate: "2026-02-15",
  },
  {
    id: "2",
    collaborator: "Laurent Batisse",
    type: "rtt",
    startDate: "2026-03-20",
    endDate: "2026-03-20",
    duration: 1,
    status: "pending",
    requestDate: "2026-03-01",
  },
  {
    id: "3",
    collaborator: "Daniella Folio",
    type: "congé_payé",
    startDate: "2026-03-25",
    endDate: "2026-03-28",
    duration: 4,
    status: "pending",
    requestDate: "2026-02-28",
  },
  {
    id: "4",
    collaborator: "Georget Morel",
    type: "maladie",
    startDate: "2026-02-26",
    endDate: "2026-02-28",
    duration: 3,
    status: "approved",
    requestDate: "2026-02-26",
  },
  {
    id: "5",
    collaborator: "Laurence Payet",
    type: "congé_payé",
    startDate: "2026-04-06",
    endDate: "2026-04-10",
    duration: 5,
    status: "pending",
    requestDate: "2026-03-02",
  },
];

const getLeaveTypeLabel = (type: LeaveType): string => {
  const labels: Record<LeaveType, string> = {
    congé_payé: "Congé payé",
    rtt: "RTT",
    sans_solde: "Sans solde",
    maladie: "Maladie",
  };
  return labels[type];
};

const getStatusLabel = (status: LeaveStatus): string => {
  const labels: Record<LeaveStatus, string> = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Refusé",
  };
  return labels[status];
};

const getStatusClasses = (status: LeaveStatus): string => {
  switch (status) {
    case "pending":
      return "bg-cockpit-yellow/15 text-cockpit-yellow";
    case "approved":
      return "bg-cockpit-success/15 text-cockpit-success";
    case "rejected":
      return "bg-cockpit-error/15 text-cockpit-error";
    default:
      return "";
  }
};

export default function CongesPage() {
  const [activeTab, setActiveTab] = useState<LeaveStatus | "all">("all");
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);

  const filteredLeaves =
    activeTab === "all"
      ? leaves
      : leaves.filter((leave) => leave.status === activeTab);

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    monthDays: leaves
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + l.duration, 0),
  };

  const handleApprove = (id: string) => {
    setLeaves(
      leaves.map((leave) =>
        leave.id === id ? { ...leave, status: "approved" } : leave
      )
    );
  };

  const handleReject = (id: string) => {
    setLeaves(
      leaves.map((leave) =>
        leave.id === id ? { ...leave, status: "rejected" } : leave
      )
    );
  };

  // Calendar for March 2026
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const year = 2026;
  const month = 2; // March (0-indexed)
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendarDays = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const isDateInRange = (day: number, leave: LeaveRequest): boolean => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const checkDate = new Date(year, month, day);
    return checkDate >= leaveStart && checkDate <= leaveEnd;
  };

  const getDaysWithAbsences = (): number[] => {
    const daysWithAbsences = new Set<number>();
    const approvedLeaves = leaves.filter((l) => l.status === "approved");
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (approvedLeaves.some((leave) => isDateInRange(day, leave))) {
        daysWithAbsences.add(day);
      }
    }
    return Array.from(daysWithAbsences);
  };

  const daysWithAbsences = getDaysWithAbsences();

  return (
    <div className="min-h-screen bg-cockpit-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cockpit-heading">
              Congés & Absences
            </h1>
            <p className="text-cockpit-secondary mt-1">
              Gestion des demandes de congés et absences
            </p>
          </div>
          <button className="flex items-center gap-2 bg-cockpit-success hover:bg-cockpit-success/90 text-white px-4 py-2 rounded-lg font-medium transition">
            <Plus size={20} />
            Nouvelle demande
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cockpit-secondary text-sm mb-1">
                  Total demandes
                </p>
                <p className="text-2xl font-bold text-cockpit-heading">
                  {stats.total}
                </p>
              </div>
              <CalendarPlus
                size={32}
                className="text-cockpit-success opacity-80"
              />
            </div>
          </div>

          <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cockpit-secondary text-sm mb-1">En attente</p>
                <p className="text-2xl font-bold text-cockpit-heading">
                  {stats.pending}
                </p>
              </div>
              <Clock size={32} className="text-cockpit-yellow opacity-80" />
            </div>
          </div>

          <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cockpit-secondary text-sm mb-1">
                  Jours posés ce mois
                </p>
                <p className="text-2xl font-bold text-cockpit-heading">
                  {stats.monthDays}
                </p>
              </div>
              <CalendarDays
                size={32}
                className="text-cockpit-primary opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-cockpit">
          {[
            { id: "pending" as const, label: "En attente" },
            { id: "approved" as const, label: "Approuvés" },
            { id: "rejected" as const, label: "Refusés" },
            { id: "all" as const, label: "Tous" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-3 font-medium text-sm transition border-b-2",
                activeTab === tab.id
                  ? "text-cockpit-success border-cockpit-success"
                  : "text-cockpit-secondary border-transparent hover:text-cockpit-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Requests Table */}
          <div className="lg:col-span-2">
            <div className="bg-cockpit-dark border border-cockpit rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cockpit border-b border-cockpit">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cockpit-heading">
                        Collaborateur
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cockpit-heading">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cockpit-heading">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-cockpit-heading">
                        Jours
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-cockpit-heading">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-cockpit-heading">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cockpit">
                    {filteredLeaves.map((leave) => (
                      <tr
                        key={leave.id}
                        className="hover:bg-cockpit/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cockpit-success/20 flex items-center justify-center">
                              <User size={16} className="text-cockpit-success" />
                            </div>
                            <span className="text-cockpit-heading font-medium">
                              {leave.collaborator}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-cockpit-primary">
                            {getLeaveTypeLabel(leave.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-cockpit-primary text-sm">
                            <div>
                              {new Date(leave.startDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                            <div className="text-cockpit-secondary">
                              {new Date(leave.endDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-cockpit-heading font-semibold">
                            {leave.duration}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span
                              className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                getStatusClasses(leave.status)
                              )}
                            >
                              {getStatusLabel(leave.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {leave.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(leave.id)}
                                  className="p-2 bg-cockpit-success/10 hover:bg-cockpit-success/20 rounded-lg text-cockpit-success transition"
                                  title="Approuver"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id)}
                                  className="p-2 bg-cockpit-error/10 hover:bg-cockpit-error/20 rounded-lg text-cockpit-error transition"
                                  title="Refuser"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <span className="text-cockpit-secondary text-sm">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-cockpit-dark border border-cockpit rounded-xl p-6">
            <h2 className="text-lg font-bold text-cockpit-heading mb-4 flex items-center gap-2">
              <CalendarDays size={20} className="text-cockpit-success" />
              Mars 2026
            </h2>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                (day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-cockpit-secondary py-2"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={clsx(
                    "aspect-square flex items-center justify-center text-sm rounded-lg font-medium",
                    day === null
                      ? "bg-transparent"
                      : daysWithAbsences.includes(day)
                        ? "bg-cockpit-success/30 text-cockpit-success border border-cockpit-success"
                        : "bg-cockpit text-cockpit-primary border border-cockpit/50"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cockpit-success/30 border border-cockpit-success" />
                <span className="text-cockpit-secondary">Jours en absence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cockpit border border-cockpit/50" />
                <span className="text-cockpit-secondary">Jours normaux</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
