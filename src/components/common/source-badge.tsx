import { Badge } from "@/components/ui/badge";
import { Facebook, Search, Globe, Award, Phone } from "lucide-react";

type LeadSource = "META" | "GOOGLE" | "SITE" | "SALON" | "TELEPHONE" | "AUTRE";

interface SourceBadgeProps {
  source: LeadSource;
}

const sourceConfig: Record<
  LeadSource,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  META: {
    label: "Meta",
    variant: "info",
    icon: Facebook,
  },
  GOOGLE: {
    label: "Google",
    variant: "success",
    icon: Search,
  },
  SITE: {
    label: "Site Web",
    variant: "info",
    icon: Globe,
  },
  SALON: {
    label: "Salon",
    variant: "warning",
    icon: Award,
  },
  TELEPHONE: {
    label: "Téléphone",
    variant: "default",
    icon: Phone,
  },
  AUTRE: {
    label: "Autre",
    variant: "default",
    icon: Globe,
  },
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const config = sourceConfig[source] || sourceConfig.AUTRE;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
