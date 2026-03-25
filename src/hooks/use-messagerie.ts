"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface Canal {
  id: string;
  nom: string;
  description: string | null;
  type: "PUBLIC" | "DM";
  lastMessage: {
    contenu: string;
    expediteur: { prenom: string };
    createdAt: string;
  } | null;
  membres: { id: string; nom: string; prenom: string }[];
}

export interface Message {
  id: string;
  canalId: string;
  expediteurId: string;
  contenu: string;
  fichierUrl: string | null;
  fichierNom: string | null;
  createdAt: string;
  expediteur: {
    id: string;
    nom: string;
    prenom: string;
    couleur: string | null;
  };
}

export function useMessagerie() {
  const [canaux, setCanaux] = useState<Canal[]>([]);
  const [canalActif, setCanalActif] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const lastTimestamp = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const unreadPollRef = useRef<NodeJS.Timeout | null>(null);
  const canalActifRef = useRef<string | null>(null);

  // Keep ref in sync so poll callbacks see latest value
  useEffect(() => {
    canalActifRef.current = canalActif;
  }, [canalActif]);

  // Fetch channels
  const fetchCanaux = useCallback(async () => {
    try {
      const res = await fetch("/api/messagerie/canaux");
      if (!res.ok) throw new Error("Erreur chargement canaux");
      const data: Canal[] = await res.json();
      setCanaux(data);
      return data;
    } catch (err) {
      console.error("[messagerie] fetchCanaux:", err);
      return [];
    }
  }, []);

  // Fetch messages for active channel (initial load or polling)
  const fetchMessages = useCallback(
    async (canalId: string, after?: string) => {
      try {
        const params = new URLSearchParams({ canalId });
        if (after) params.set("after", after);

        const res = await fetch(`/api/messagerie/messages?${params}`);
        if (!res.ok) throw new Error("Erreur chargement messages");
        const json = await res.json();
        const data: Message[] = json.messages || json || [];

        if (data.length === 0 && after) return;

        if (after) {
          // Polling: append new messages
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.filter((m) => !existingIds.has(m.id));
            if (newMsgs.length === 0) return prev;
            return [...prev, ...newMsgs];
          });
        } else {
          // Initial load: replace all messages
          setMessages(data);
        }

        // Update last timestamp from latest message
        if (data.length > 0) {
          const latest = data[data.length - 1];
          lastTimestamp.current = latest.createdAt;
        }
      } catch (err) {
        console.error("[messagerie] fetchMessages:", err);
      }
    },
    []
  );

  // Fetch unread counts
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/messagerie/unread");
      if (!res.ok) throw new Error("Erreur chargement non-lus");
      const data: Record<string, number> = await res.json();
      setUnreadCounts(data);
    } catch (err) {
      console.error("[messagerie] fetchUnread:", err);
    }
  }, []);

  // Send message
  const envoyerMessage = useCallback(
    async (contenu: string, fichierUrl?: string, fichierNom?: string) => {
      if (!canalActifRef.current) return;
      try {
        const res = await fetch("/api/messagerie/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canalId: canalActifRef.current,
            contenu,
            fichierUrl: fichierUrl || null,
            fichierNom: fichierNom || null,
          }),
        });
        if (!res.ok) throw new Error("Erreur envoi message");
        const msg: Message = await res.json();

        // Optimistic append
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        lastTimestamp.current = msg.createdAt;

        // Update channel last message in sidebar
        setCanaux((prev) =>
          prev.map((c) =>
            c.id === msg.canalId
              ? {
                  ...c,
                  lastMessage: {
                    contenu: msg.contenu,
                    expediteur: {
                      prenom: msg.expediteur.prenom,
                    },
                    createdAt: msg.createdAt,
                  },
                }
              : c
          )
        );
      } catch (err) {
        console.error("[messagerie] envoyerMessage:", err);
        throw err;
      }
    },
    []
  );

  // Mark as read
  const marquerLu = useCallback(async (canalId: string) => {
    try {
      await fetch("/api/messagerie/lu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canalId }),
      });
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[canalId];
        return next;
      });
    } catch (err) {
      console.error("[messagerie] marquerLu:", err);
    }
  }, []);

  // Change active channel
  const changerCanal = useCallback((id: string) => {
    setCanalActif(id);
    setMessages([]);
    lastTimestamp.current = null;
  }, []);

  // Create DM
  const creerDM = useCallback(
    async (destinataireId: string) => {
      try {
        const res = await fetch("/api/messagerie/canaux", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "DM", destinataireId }),
        });
        if (!res.ok) throw new Error("Erreur création DM");
        const canal: Canal = await res.json();

        // Add to list if not present
        setCanaux((prev) => {
          if (prev.some((c) => c.id === canal.id)) return prev;
          return [...prev, canal];
        });

        // Switch to this channel
        changerCanal(canal.id);
        return canal;
      } catch (err) {
        console.error("[messagerie] creerDM:", err);
        throw err;
      }
    },
    [changerCanal]
  );

  // Create public channel
  const creerCanal = useCallback(
    async (nom: string, description: string, membreIds: string[]) => {
      try {
        const res = await fetch("/api/messagerie/canaux", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "PUBLIC", nom, description, membreIds }),
        });
        if (!res.ok) throw new Error("Erreur création canal");
        const canal: Canal = await res.json();

        setCanaux((prev) => {
          if (prev.some((c) => c.id === canal.id)) return prev;
          return [...prev, canal];
        });

        changerCanal(canal.id);
        return canal;
      } catch (err) {
        console.error("[messagerie] creerCanal:", err);
        throw err;
      }
    },
    [changerCanal]
  );

  // Initial load
  useEffect(() => {
    fetchCanaux().then(() => setLoading(false));
    fetchUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (canalActif) {
      setLoadingMessages(true);
      fetchMessages(canalActif).then(() => setLoadingMessages(false));
      marquerLu(canalActif);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canalActif]);

  // Polling messages every 3s
  useEffect(() => {
    if (!canalActif) return;
    pollRef.current = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        lastTimestamp.current &&
        canalActifRef.current
      ) {
        fetchMessages(canalActifRef.current, lastTimestamp.current);
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [canalActif, fetchMessages]);

  // Polling unread every 10s
  useEffect(() => {
    unreadPollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchUnread();
    }, 10000);
    return () => {
      if (unreadPollRef.current) clearInterval(unreadPollRef.current);
    };
  }, [fetchUnread]);

  return {
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
    fetchCanaux,
  };
}
