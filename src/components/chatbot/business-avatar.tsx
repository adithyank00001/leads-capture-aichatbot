import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getBusinessInitial } from "@/lib/chat/format";
import { cn } from "@/lib/utils";

type BusinessAvatarProps = {
  name: string;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function BusinessAvatar({
  name,
  size = "default",
  className,
}: BusinessAvatarProps) {
  return (
    <Avatar
      size={size}
      className={cn(
        "after:border-0 bg-[var(--widget-accent)] text-[var(--widget-accent-text)]",
        className,
      )}
    >
      <AvatarFallback
        className="bg-[var(--widget-accent)] text-xs font-semibold text-[var(--widget-accent-text)]"
      >
        {getBusinessInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
}
