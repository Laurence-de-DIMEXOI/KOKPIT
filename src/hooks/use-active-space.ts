"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { canAccessModule } from "@/lib/auth-utils";
import type { Role } from "@/lib/auth-utils";
import {
  ESPACES,
  MENU_GENERAL,
  STORAGE_KEY,
  detectSpaceFromPath,
} from "@/lib/nav-config";
import type { Espace, NavItem } from "@/lib/nav-config";

export function useActiveSpace() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  // Espaces visibles : ceux autorisés par le rôle + les disabled (ex: Achat)
  const visibleSpaces = useMemo(() => {
    if (!userRole) return [];
    return ESPACES.filter(
      (e) => e.disabled || canAccessModule(userRole, e.requiredModule)
    );
  }, [userRole]);

  // Espaces actifs (non disabled) pour la logique
  const enabledSpaces = useMemo(
    () => visibleSpaces.filter((e) => !e.disabled),
    [visibleSpaces]
  );

  // Init : localStorage → sinon premier espace accessible
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
    if (typeof window === "undefined") return "commercial";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || "commercial";
  });

  // Vérifier que l'espace sauvegardé est accessible, sinon fallback
  useEffect(() => {
    if (enabledSpaces.length === 0) return;
    const isAccessible = enabledSpaces.some((e) => e.id === activeSpaceId);
    if (!isAccessible) {
      const fallback = enabledSpaces[0].id;
      setActiveSpaceId(fallback);
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [enabledSpaces, activeSpaceId]);

  // Sync avec l'URL : si la page est dans un espace spécifique, basculer
  useEffect(() => {
    const detected = detectSpaceFromPath(pathname);
    if (detected && detected !== activeSpaceId) {
      // Vérifier que l'utilisateur a accès à cet espace
      const isAccessible = enabledSpaces.some((e) => e.id === detected);
      if (isAccessible) {
        setActiveSpaceId(detected);
        localStorage.setItem(STORAGE_KEY, detected);
      }
    }
  }, [pathname, enabledSpaces, activeSpaceId]);

  // Switch d'espace : sauvegarder + naviguer vers la page par défaut
  const switchSpace = useCallback(
    (espaceId: string) => {
      const espace = ESPACES.find((e) => e.id === espaceId);
      if (!espace || espace.disabled) return;
      setActiveSpaceId(espaceId);
      localStorage.setItem(STORAGE_KEY, espaceId);
      router.push(espace.defaultHref);
    },
    [router]
  );

  // Espace courant
  const currentSpace: Espace | undefined = useMemo(
    () => ESPACES.find((e) => e.id === activeSpaceId) || ESPACES[0],
    [activeSpaceId]
  );

  // Menu items filtrés par rôle
  const menuItems: NavItem[] = useMemo(() => {
    if (!currentSpace || !userRole) return [];
    return currentSpace.menu.filter((item) =>
      canAccessModule(userRole, item.module)
    );
  }, [currentSpace, userRole]);

  // Menu général filtré par rôle
  const generalItems: NavItem[] = useMemo(() => {
    if (!userRole) return [];
    return MENU_GENERAL.filter((item) =>
      canAccessModule(userRole, item.module)
    );
  }, [userRole]);

  // Afficher les onglets seulement si > 1 espace actif accessible
  const showTabs = enabledSpaces.length > 1;

  return {
    activeSpaceId,
    currentSpace,
    visibleSpaces,
    enabledSpaces,
    menuItems,
    generalItems,
    showTabs,
    switchSpace,
  };
}
