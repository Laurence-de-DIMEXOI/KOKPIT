"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Hash,
  MessageCircle,
  Send,
  Paperclip,
  Plus,
  ArrowLeft,
  Loader2,
  X,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { Smile } from "lucide-react";
import { useMessagerie, type Canal, type Message, type Reaction } from "@/hooks/use-messagerie";

/* ─── Emoji picker rapide ─── */

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onToggle,
}: {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Grouper les réactions par emoji
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; users: string[]; hasMe: boolean }>();
    for (const r of reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(r.user.prenom);
        if (r.userId === currentUserId) existing.hasMe = true;
      } else {
        map.set(r.emoji, {
          count: 1,
          users: [r.user.prenom],
          hasMe: r.userId === currentUserId,
        });
      }
    }
    return map;
  }, [reactions, currentUserId]);

  return (
    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
      {/* Réactions existantes */}
      {Array.from(grouped.entries()).map(([emoji, { count, users, hasMe }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          title={users.join(", ")}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
            hasMe
              ? "bg-[var(--color-active)]/15 border border-[var(--color-active)]/30"
              : "bg-cockpit-dark border border-transparent hover:border-cockpit"
          }`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px] font-medium text-cockpit-secondary">{count}</span>}
        </button>
      ))}

      {/* Bouton + pour ajouter */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-cockpit-dark transition-colors text-cockpit-secondary hover:text-cockpit-primary"
          title="Réagir"
        >
          <Smile size={14} />
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-white border border-cockpit rounded-xl shadow-lg p-1.5 flex gap-0.5 z-50">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onToggle(emoji);
                  setShowPicker(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cockpit-dark text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── helpers ─── */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return "Aujourd\u2019hui";
  if (msgDate.getTime() === yesterday.getTime()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function getDMName(
  canal: Canal,
  currentUserId: string | undefined
): string {
  if (!canal.membres || canal.membres.length === 0) return canal.nom;
  if (!currentUserId) return canal.membres[0] ? `${canal.membres[0].prenom || ""} ${canal.membres[0].nom || ""}`.trim() || canal.nom : canal.nom;
  const other = canal.membres.find((m) => m.id !== currentUserId);
  if (!other) return canal.membres[0] ? `${canal.membres[0].prenom || ""} ${canal.membres[0].nom || ""}`.trim() || canal.nom : canal.nom;
  return `${other.prenom || ""} ${other.nom || ""}`.trim() || canal.nom;
}

/* ─── grouping messages by date ─── */

function groupByDate(msgs: Message[] | undefined | null): { label: string; messages: Message[] }[] {
  if (!msgs || !Array.isArray(msgs)) return [];
  const groups: { label: string; messages: Message[] }[] = [];
  let currentLabel = "";

  for (const msg of msgs) {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

/* ═══════════════════════════════════════════
   User Picker Modal
   ═══════════════════════════════════════════ */

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

function UserPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/messagerie/utilisateurs")
      .then((r) => r.json())
      .then((data: Utilisateur[]) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = search.toLowerCase();
        return (
          u.prenom.toLowerCase().includes(q) ||
          u.nom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }),
    [users, search]
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg w-full max-w-md mx-4 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cockpit">
          <h3 className="text-cockpit-primary font-semibold text-base">
            Nouveau message privé
          </h3>
          <button
            onClick={onClose}
            className="text-cockpit-secondary hover:text-cockpit-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-cockpit">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cockpit-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg pl-9 pr-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:border-[var(--color-active)] transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-cockpit-secondary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-cockpit-secondary text-center py-10">
              Aucun utilisateur trouvé
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cockpit-dark transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-active)]/20 text-[var(--color-active)] flex items-center justify-center text-xs font-semibold shrink-0">
                  {getInitials(u.prenom, u.nom)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cockpit-primary truncate">
                    {u.prenom} {u.nom}
                  </p>
                  <p className="text-xs text-cockpit-secondary truncate">
                    {u.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════
   Create Channel Modal (ADMIN only)
   ═══════════════════════════════════════════ */

function CreateChannelModal({
  onCreated,
  onClose,
}: {
  onCreated: (nom: string, description: string, membreIds: string[]) => Promise<unknown>;
  onClose: () => void;
}) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<Utilisateur[]>([]);

  useEffect(() => {
    fetch("/api/messagerie/utilisateurs")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!nom.trim()) return;
    setSubmitting(true);
    try {
      await onCreated(
        nom.trim(),
        description.trim(),
        users.map((u) => u.id)
      );
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cockpit">
          <h3 className="text-cockpit-primary font-semibold text-base">
            Créer un canal
          </h3>
          <button
            onClick={onClose}
            className="text-cockpit-secondary hover:text-cockpit-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Nom du canal
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: marketing, support..."
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:border-[var(--color-active)] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Description (optionnelle)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif du canal..."
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:border-[var(--color-active)] transition-colors"
            />
          </div>
          <p className="text-xs text-cockpit-secondary">
            <Users size={12} className="inline mr-1" />
            Tous les utilisateurs actifs seront ajoutés automatiquement.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-cockpit">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-cockpit-secondary hover:text-cockpit-primary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nom.trim() || submitting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-active)] text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Créer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════
   Main Messagerie Page
   ═══════════════════════════════════════════ */

export default function MessageriePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  const {
    canaux,
    canalActif,
    messages,
    unreadCounts,
    loading,
    loadingMessages,
    envoyerMessage,
    changerCanal,
    creerDM,
    creerCanal,
    refreshMessages,
  } = useMessagerie();
  const userId = (session?.user as any)?.id || "";

  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; nom: string; prenom: string; role: string }[]>([]);

  // Charger tous les utilisateurs pour la section Messages privés
  useEffect(() => {
    fetch("/api/messagerie/utilisateurs")
      .then((r) => r.json())
      .then((data) => setAllUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when channel changes
  useEffect(() => {
    if (canalActif) inputRef.current?.focus();
  }, [canalActif]);

  // Separate channels by type
  const publicChannels = useMemo(
    () => canaux.filter((c) => c.type === "PUBLIC"),
    [canaux]
  );
  const dmChannels = useMemo(
    () => canaux.filter((c) => c.type === "DM"),
    [canaux]
  );

  // Active canal object
  const activeCanalObj = useMemo(
    () => canaux.find((c) => c.id === canalActif) ?? null,
    [canaux, canalActif]
  );

  // Channel display name
  const canalDisplayName = useMemo(() => {
    if (!activeCanalObj) return "";
    if (activeCanalObj.type === "DM") return getDMName(activeCanalObj, currentUserId);
    return activeCanalObj.nom;
  }, [activeCanalObj, currentUserId]);

  // Grouped messages
  const groupedMessages = useMemo(() => groupByDate(messages), [messages]);

  // Send handler
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !canalActif || sending) return;
    setInputValue("");
    setSending(true);
    try {
      await envoyerMessage(text);
    } catch {
      // restore input on error
      setInputValue(text);
    } finally {
      setSending(false);
    }
  }, [inputValue, canalActif, sending, envoyerMessage]);

  // Key handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Select channel (mobile aware)
  const handleSelectCanal = useCallback(
    (id: string) => {
      changerCanal(id);
      setMobileShowMessages(true);
    },
    [changerCanal]
  );

  // DM creation
  const handleCreateDM = useCallback(
    async (userId: string) => {
      setShowUserPicker(false);
      await creerDM(userId);
      setMobileShowMessages(true);
    },
    [creerDM]
  );

  // Channel creation
  const handleCreateChannel = useCallback(
    async (nom: string, description: string, membreIds: string[]) => {
      await creerCanal(nom, description, membreIds);
      setMobileShowMessages(true);
    },
    [creerCanal]
  );

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 48px)" }}
      >
        <Loader2 size={28} className="animate-spin text-cockpit-secondary" />
      </div>
    );
  }

  /* ─── Sidebar ─── */
  const sidebar = (
    <div className="flex flex-col h-full bg-cockpit-card border-r border-cockpit">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-cockpit flex items-center justify-between">
        <h1 className="text-cockpit-primary font-semibold text-base">
          Messagerie
        </h1>
        <button
          onClick={() => setShowUserPicker(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cockpit-dark text-cockpit-secondary hover:text-[var(--color-active)] transition-colors"
          title="Nouveau message privé"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Public Channels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-semibold tracking-wider text-cockpit-secondary uppercase">
              Canaux
            </span>
            {isAdmin && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="text-cockpit-secondary hover:text-[var(--color-active)] transition-colors"
                title="Créer un canal"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
          {publicChannels.map((canal) => {
            const isActive = canal.id === canalActif;
            const unread = unreadCounts[canal.id] || 0;
            return (
              <button
                key={canal.id}
                onClick={() => handleSelectCanal(canal.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-active)]/10 text-[var(--color-active)]"
                    : "text-cockpit-secondary hover:bg-cockpit-dark hover:text-cockpit-primary"
                }`}
              >
                <Hash size={14} className="shrink-0 opacity-60" />
                <span className="truncate flex-1 font-medium">{canal.nom}</span>
                {unread > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Messages privés — tous les utilisateurs */}
        <div>
          <span className="block px-2 mb-1 text-[10px] font-semibold tracking-wider text-cockpit-secondary uppercase">
            Messages privés
          </span>
          {(() => {
            // Map des DM existants par userId de l'autre personne
            const dmByUserId = new Map<string, typeof dmChannels[0]>();
            for (const dm of dmChannels) {
              const other = dm.membres.find((m) => m.id !== currentUserId);
              if (other) dmByUserId.set(other.id, dm);
            }

            // Tous les users : ceux avec conversation d'abord, puis les autres
            const usersWithDM = allUsers.filter((u) => dmByUserId.has(u.id));
            const usersWithoutDM = allUsers.filter((u) => !dmByUserId.has(u.id));
            const sortedUsers = [...usersWithDM, ...usersWithoutDM];

            return sortedUsers.map((user) => {
              const existingDM = dmByUserId.get(user.id);
              const isActive = existingDM ? existingDM.id === canalActif : false;
              const unread = existingDM ? (unreadCounts[existingDM.id] || 0) : 0;
              const name = `${user.prenom} ${user.nom}`;

              return (
                <button
                  key={user.id}
                  onClick={async () => {
                    if (existingDM) {
                      handleSelectCanal(existingDM.id);
                    } else {
                      await creerDM(user.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--color-active)]/10 text-[var(--color-active)]"
                      : existingDM
                        ? "text-cockpit-primary hover:bg-cockpit-dark"
                        : "text-cockpit-secondary/60 hover:bg-cockpit-dark hover:text-cockpit-primary"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ backgroundColor: existingDM ? "var(--color-active)" : "#D1D5DB" }}
                  >
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </div>
                  <span className="truncate flex-1 font-medium">{name}</span>
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );

  /* ─── Message Thread ─── */
  const messageThread = (
    <div className="flex flex-col h-full bg-cockpit-dark">
      {!canalActif ? (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle
              size={48}
              className="mx-auto mb-3 text-cockpit-secondary/30"
            />
            <p className="text-cockpit-secondary text-sm">
              Sélectionnez un canal pour commencer
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="px-4 py-3 border-b border-cockpit bg-cockpit-card flex items-center gap-3">
            {/* Back button (mobile) */}
            <button
              onClick={() => setMobileShowMessages(false)}
              className="md:hidden text-cockpit-secondary hover:text-cockpit-primary transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            {activeCanalObj?.type === "PUBLIC" ? (
              <Hash size={16} className="text-cockpit-secondary shrink-0" />
            ) : (
              <MessageCircle
                size={16}
                className="text-cockpit-secondary shrink-0"
              />
            )}
            <h2 className="text-cockpit-primary font-semibold text-sm truncate">
              {canalDisplayName}
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2
                  size={22}
                  className="animate-spin text-cockpit-secondary"
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-cockpit-secondary text-sm">
                  Aucun message pour le moment. Commencez la conversation !
                </p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div key={group.label}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-cockpit" />
                    <span className="text-[11px] font-medium text-cockpit-secondary px-2">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-cockpit" />
                  </div>

                  {/* Messages in group */}
                  {group.messages.map((msg) => {
                    const isOwn = msg.expediteurId === currentUserId;
                    const bgColor =
                      msg.expediteur.couleur || "var(--color-active)";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 mb-3 ${
                          isOwn ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ backgroundColor: bgColor }}
                        >
                          {getInitials(
                            msg.expediteur.prenom,
                            msg.expediteur.nom
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className={`max-w-[70%] ${
                            isOwn ? "text-right" : ""
                          }`}
                        >
                          <div
                            className={`flex items-baseline gap-2 mb-0.5 ${
                              isOwn
                                ? "flex-row-reverse"
                                : ""
                            }`}
                          >
                            <span className="text-xs font-semibold text-cockpit-primary">
                              {msg.expediteur.prenom} {msg.expediteur.nom}
                            </span>
                            <span className="text-[10px] text-cockpit-secondary">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`inline-block rounded-card px-3 py-2 text-sm text-cockpit-primary ${
                              isOwn
                                ? "bg-[var(--color-active)]/10 border border-[var(--color-active)]/20"
                                : "bg-cockpit-card border border-cockpit"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-left">
                              {msg.contenu}
                            </p>
                            {/* File attachment */}
                            {msg.fichierUrl && (
                              <a
                                href={msg.fichierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-active)] hover:underline"
                              >
                                <FileText size={12} />
                                {msg.fichierNom || "Fichier joint"}
                              </a>
                            )}
                          </div>
                          {/* Réactions */}
                          <MessageReactions
                            messageId={msg.id}
                            reactions={msg.reactions || []}
                            currentUserId={userId}
                            onToggle={async (emoji) => {
                              const res = await fetch("/api/messagerie/reactions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ messageId: msg.id, emoji }),
                              });
                              if (res.ok) refreshMessages();
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-cockpit bg-cockpit-card">
            <div className="flex items-center gap-2">
              <button
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-cockpit-secondary hover:text-[var(--color-active)] hover:bg-cockpit-dark transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip size={16} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre message..."
                className="flex-1 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:border-[var(--color-active)] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-active)] text-white hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div
        className="flex overflow-hidden"
        style={{ height: "calc(100vh - 48px)" }}
      >
        {/* Sidebar: hidden on mobile when viewing messages */}
        <div
          className={`w-full md:w-[280px] md:min-w-[280px] shrink-0 h-full ${
            mobileShowMessages ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          {sidebar}
        </div>

        {/* Message thread: hidden on mobile when viewing channel list */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileShowMessages ? "flex flex-col" : "hidden md:flex md:flex-col"
          }`}
        >
          {messageThread}
        </div>
      </div>

      {/* Modals */}
      {showUserPicker && (
        <UserPickerModal
          onSelect={handleCreateDM}
          onClose={() => setShowUserPicker(false)}
        />
      )}
      {showCreateChannel && (
        <CreateChannelModal
          onCreated={handleCreateChannel}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
    </>
  );
}
