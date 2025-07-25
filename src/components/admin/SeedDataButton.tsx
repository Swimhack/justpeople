import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export function SeedDataButton() {
  return (
    <Badge variant="secondary" className="gap-2">
      <CheckCircle className="h-3 w-3" />
      Production Ready
    </Badge>
  );
}