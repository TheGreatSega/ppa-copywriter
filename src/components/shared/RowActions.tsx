import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface RowActionsProps {
  onCopy: () => void;
  onDelete?: () => void;
}

export const RowActions: React.FC<RowActionsProps> = ({ onCopy, onDelete }) => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" onClick={onCopy} title="Copy to clipboard">
      <Copy className="h-4 w-4" />
    </Button>
    {onDelete && (
      <Button variant="ghost" size="icon" onClick={onDelete} title="Remove row">
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
);
