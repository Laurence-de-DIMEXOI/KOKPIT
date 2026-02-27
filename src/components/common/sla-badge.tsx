import { Badge } from "@/components/ui/badge";
import { calculateSlaDeadline, getSlaStatus, formatTimeRemaining } from "@/lib/sla";

interface SlaBadgeProps {
  deadline: Date;
  showRemaining?: boolean;
}

export function SlaBadge({ deadline, showRemaining = true }: SlaBadgeProps) {
  const status = getSlaStatus(deadline);
  const remaining = formatTimeRemaining(deadline);

  const variantMap = {
    OK: "default" as const,
    ATTENTION: "warning" as const,
    URGENT: "danger" as const,
  };

  const labelMap = {
    OK: "OK",
    ATTENTION: "Attention",
    URGENT: "Urgent",
  };

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
      {showRemaining && remaining !== "Dépassé" && ` - ${remaining}`}
    </Badge>
  );
}
