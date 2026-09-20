import React from "react";
import { Icon } from "@iconify/react";
import { Globe } from "lucide-react";

interface IconifyIconProps {
  icon?: string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

export const IconifyIcon: React.FC<IconifyIconProps> = ({
  icon,
  className = "h-4 w-4",
  color,
  style,
  fallback,
}) => {
  if (!icon || !icon.trim()) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Globe className={className} style={{ color, ...style }} />
    );
  }

  // Handle standard lucide: or custom iconify string
  return (
    <Icon
      icon={icon}
      className={className}
      style={{
        color: color || undefined,
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
};
