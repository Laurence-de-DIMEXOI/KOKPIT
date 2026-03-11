"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface TaskFormData {
  titre: string;
  description: string;
  echeance: string;
  contactId: string;
  assigneAId: string;
  statut?: string;
}

interface UserOption {
  id: string;
  nom: string;
  prenom: string;
}

interface ContactOption {
  id: string;
  nom: string;
  prenom: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: Partial<TaskFormData>;
  title?: string;
  users?: UserOption[];
  contacts?: ContactOption[];
}

export function TaskForm({ isOpen, onClose, onSubmit, initialData, title = "Nouvelle tâche", users = [], contacts = [] }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    titre: "",
    description: "",
    echeance: "",
    contactId: "",
    assigneAId: "",
    statut: undefined,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        description: initialData.description || "",
        echeance: initialData.echeance ? initialData.echeance.slice(0, 16) : "",
        contactId: initialData.contactId || "",
        assigneAId: initialData.assigneAId || "",
        statut: initialData.statut,
      });
    } else {
      setForm({ titre: "", description: "", echeance: "", contactId: "", assigneAId: "", statut: undefined });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      // handled by parent
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EAED]">
            <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#8592A3]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#32475C] mb-1">Titre *</label>
              <input
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                placeholder="Ex: Relancer M. Dupont pour le devis"
                className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4B400]/50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#32475C] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Détails supplémentaires..."
                rows={3}
                className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#F4B400]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#32475C] mb-1">Échéance</label>
                <input
                  type="datetime-local"
                  value={form.echeance}
                  onChange={(e) => setForm((f) => ({ ...f, echeance: e.target.value }))}
                  className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4B400]/50"
                />
              </div>

              {initialData?.statut && (
                <div>
                  <label className="block text-sm font-medium text-[#32475C] mb-1">Statut</label>
                  <select
                    value={form.statut || ""}
                    onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}
                    className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4B400]/50"
                  >
                    <option value="A_FAIRE">À faire</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINEE">Terminée</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#32475C] mb-1">Assigné à</label>
                  <select
                    value={form.assigneAId}
                    onChange={(e) => setForm((f) => ({ ...f, assigneAId: e.target.value }))}
                    className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4B400]/50"
                  >
                    <option value="">Moi-même</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {contacts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#32475C] mb-1">Contact lié</label>
                  <select
                    value={form.contactId}
                    onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
                    className="w-full border border-[#E8EAED] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4B400]/50"
                  >
                    <option value="">Aucun</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-center border border-[#E8EAED] text-[#32475C] px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !form.titre.trim()}
                className="flex-1 text-center bg-[#F4B400] text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {initialData?.titre ? "Enregistrer" : "Créer la tâche"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
