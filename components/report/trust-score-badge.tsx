import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TrustScoreBadge({ score }: { score: number }) {
  return (
    <Badge variant={score >= 80 ? "success" : score >= 55 ? "warning" : "danger"}>
      <ShieldCheck className="h-3.5 w-3.5" />
      Trust {score}
    </Badge>
  );
}
