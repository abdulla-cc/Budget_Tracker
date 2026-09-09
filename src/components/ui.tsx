import { cn } from "../utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl p-4 shadow-sm border border-gray-100", className)}>
      {children}
    </div>
  );
}

export function ProgressBar({ progress, variant = "default" }: { progress: number; variant?: "default" | "warning" | "danger" | "success" }) {
  const boundedProgress = Math.min(Math.max(progress, 0), 100);
  
  let color = "bg-blue-500";
  if (variant === "warning") color = "bg-yellow-500";
  if (variant === "danger") color = "bg-red-500";
  if (variant === "success") color = "bg-green-500";

  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2">
      <div 
        className={cn("h-full transition-all duration-300 rounded-full", color)} 
        style={{ width: `${boundedProgress}%` }}
      />
    </div>
  );
}
