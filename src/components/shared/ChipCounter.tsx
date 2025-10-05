import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChipCounterProps {
  value: string;
  limit: number;
}

export const ChipCounter: React.FC<ChipCounterProps> = ({ value, limit }) => {
  const len = value.length;
  const within = len <= limit;
  const near = len > Math.floor(limit * 0.9) && len <= limit;
  return (
    <Badge
      variant={within ? (near ? "secondary" : "default") : "destructive"}
      className={cn("text-xs", !within && "animate-pulse")}
      title={`Characters: ${len}/${limit}`}
    >
      {len}/{limit}
    </Badge>
  );
};
