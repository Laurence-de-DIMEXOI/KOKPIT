"use client";

import { useState, useEffect } from "react";
import {
  Instagram,
  Facebook,
  MapPin,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Clock,
  Image,
  Video,
  Layers,
} from "lucide-react";

interface InstaPost {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  permalink: string;
}

interface TokenStatus {
  valide: boolean;
  expiresAt: string | null;
  joursRestants: number;
  error?: string;
}

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://www.instagram.com/dimexoi.re/",
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-gradient-to-r from-purple-50 to-pink-50",
    borderColor: "border-purple-200",
  },
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://www.facebook.com/dimexoi.re",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-gradient-to-r from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
  },
  {
    name: "Google Business",
    icon: MapPin,
    url: "https://g.page/dimexoi",
    color: "from-green-500 to-emerald-500",
    bgLight: "bg-gradient-to-r from-green-50 to-emerald-50",
    borderColor: "border-green-200",
  },
];

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function MediaTypeBadge({ type }: { type: string }) {
  if (type === "VIDEO")
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 bg-blue-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
        <Video className="w-3 h-3" />
        Vidéo
      </span>
    );
  if (type === "CAROUSEL_ALBUM")
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 bg-purple-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
        <Layers className="w-3 h-3" />
        Carrousel
      </span>
    );
  return null;
}

export default function NosReseauxPage() {
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheDate, setCacheDate] = useState<string | null>(null);

  const fetchData = async (fresh = false) => {
    if (fresh) setRefreshing(true);
    try {
      const [feedRes, tokenRes] = await Promise.all([
        fetch(
          `/api/marketing/instagram/feed${fresh ? "?fresh=true" : ""}`
        ),
        fetch("/api/marketing/instagram/token-status"),
      ]);
      const feedData = await feedRes.json();
      const tokenData = await tokenRes.json();

      setPosts(feedData.posts || []);
      setCacheDate(feedData._cache?.generatedAt || null);
      setTokenStatus(tokenData);
    } catch (err) {
      console.error("Erreur chargement réseaux:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Nos Réseaux
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Présence social media DIMEXOI
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </button>
      </div>

      {/* Token alert */}
      {tokenStatus && tokenStatus.joursRestants > 0 && tokenStatus.joursRestants < 10 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-400 mb-1">
              Token Meta expire bientôt
            </h3>
            <p className="text-sm text-orange-300">
              Le token expire dans {tokenStatus.joursRestants} jour
              {tokenStatus.joursRestants > 1 ? "s" : ""}. Renouvelez-le
              dans les paramètres Meta pour conserver l&apos;accès au feed
              Instagram.
            </p>
          </div>
        </div>
      )}

      {tokenStatus && !tokenStatus.valide && tokenStatus.error !== "META_ACCESS_TOKEN manquant" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">
              Token Meta expiré
            </h3>
            <p className="text-sm text-red-300">
              Le token d&apos;accès Meta est invalide ou expiré. Le feed
              Instagram ne peut pas être chargé.
            </p>
          </div>
        </div>
      )}

      {/* Social links cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SOCIAL_LINKS.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${social.bgLight} border ${social.borderColor} rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all group`}
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1F2937]">
                  {social.name}
                </p>
                <p className="text-[10px] text-[#8592A3] truncate">
                  {social.url.replace("https://", "")}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-[#8592A3] group-hover:text-[#1F2937] transition-colors flex-shrink-0" />
            </a>
          );
        })}
      </div>

      {/* Instagram Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-cockpit-heading flex items-center gap-2">
            <Instagram className="w-5 h-5 text-purple-500" />
            Feed Instagram
          </h2>
          {cacheDate && (
            <div className="flex items-center gap-1.5 text-xs text-cockpit-secondary">
              <Clock className="w-3.5 h-3.5" />
              Mis à jour {timeAgo(cacheDate)}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
            <Image className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-secondary text-sm">
              {tokenStatus?.error
                ? "Impossible de charger le feed Instagram"
                : "Aucun post Instagram"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:shadow-lg transition-all"
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    post.mediaType === "VIDEO"
                      ? post.thumbnailUrl
                      : post.mediaUrl
                  }
                  alt={post.caption.slice(0, 60) || "Post Instagram"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Media type badge */}
                <MediaTypeBadge type={post.mediaType} />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end">
                  <div className="p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-white text-xs line-clamp-2 leading-relaxed">
                      {post.caption.slice(0, 100) ||
                        "Post Instagram"}
                      {post.caption.length > 100 ? "…" : ""}
                    </p>
                    <p className="text-white/60 text-[10px] mt-1">
                      {new Date(post.timestamp).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </p>
                  </div>
                </div>

                {/* External link */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4 text-white drop-shadow" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
