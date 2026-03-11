"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Users, ClipboardList, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ContactResult {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  lifecycleStage: string;
}

interface TaskResult {
  id: string;
  titre: string;
  statut: string;
  echeance: string | null;
}

interface SearchResults {
  contacts: ContactResult[];
  tasks: TaskResult[];
}

const stageColors: Record<string, string> = {
  PROSPECT: "text-[#03C3EC]",
  LEAD: "text-[#FFAB00]",
  CLIENT: "text-[#71DD37]",
  INACTIF: "text-[#8592A3]",
};

const statutLabels: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (type: "contact" | "task", id: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    if (type === "contact") {
      router.push(`/contacts/${id}`);
    } else {
      router.push("/commercial/taches");
    }
  };

  const totalResults = (results?.contacts?.length || 0) + (results?.tasks?.length || 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8EAED] bg-[#F5F6F7] hover:bg-white hover:border-[#F4B400]/30 transition-colors text-sm text-[#8592A3] w-52"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="text-[10px] text-[#8592A3] bg-white border border-[#E8EAED] rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-[#E8EAED] z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#E8EAED]">
            <Search className="w-4 h-4 text-[#8592A3] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Rechercher un contact, une tâche..."
              className="flex-1 text-sm outline-none placeholder:text-[#8592A3]/60"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults(null); }} className="p-0.5 hover:bg-gray-100 rounded">
                <X className="w-3.5 h-3.5 text-[#8592A3]" />
              </button>
            )}
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B400]" />}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-6 text-center text-sm text-[#8592A3]">
                Tapez au moins 2 caractères
              </div>
            ) : results && totalResults === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#8592A3]">
                Aucun résultat pour &quot;{query}&quot;
              </div>
            ) : results ? (
              <>
                {/* Contacts */}
                {results.contacts.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-[#F5F6F7] text-[11px] font-semibold text-[#8592A3] uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Contacts
                    </div>
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect("contact", c.id)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F4B400]/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1F2937]">
                            {c.prenom} {c.nom}
                          </span>
                          <span className={`text-[11px] font-semibold ${stageColors[c.lifecycleStage] || "text-[#8592A3]"}`}>
                            {c.lifecycleStage}
                          </span>
                        </div>
                        <p className="text-xs text-[#8592A3] truncate">{c.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-[#F5F6F7] text-[11px] font-semibold text-[#8592A3] uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3 h-3" /> Tâches
                    </div>
                    {results.tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect("task", t.id)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F4B400]/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1F2937] line-clamp-1">{t.titre}</span>
                          <span className="text-[11px] text-[#8592A3]">{statutLabels[t.statut] || t.statut}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
