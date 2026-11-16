
interface UserAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({
  name,
  size = "md",
}: UserAvatarProps) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-full 
      border border-[#0C8C5E]/50 bg-[#083D33] 
      font-semibold tracking-wide text-white
      transition-colors duration-200 hover:bg-[#0C8C5E]`}
      title={name || "User"}
      aria-label={name || "User"}
    >
      {initials || "U"}
    </div>
  );
}
