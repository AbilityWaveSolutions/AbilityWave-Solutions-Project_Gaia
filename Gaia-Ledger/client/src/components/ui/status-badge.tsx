import { cn } from "@/lib/utils";
import { HealthStatusType } from "@shared/schema";

interface StatusBadgeProps {
  status?: HealthStatusType | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200",
        className
      )}>
        Unknown
      </span>
    );
  }

  // Determine styles based on status name or color if provided
  let styles = "bg-gray-100 text-gray-800 border-gray-200";
  
  // Try to use backend color if it's a valid hex/rgb
  const styleObj = status.color ? { backgroundColor: `${status.color}20`, color: status.color, borderColor: `${status.color}40` } : {};

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        className
      )}
      style={styleObj}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: status.color || 'gray' }}></span>
      {status.displayName}
    </span>
  );
}
