import React from "react";
import { ExternalLink } from "lucide-react";
import type { Product, LinkPreset } from "../../types";
import {
  detectStoreWithPresets,
  getCachedLinkPresets,
} from "../../utils/linkPresets";
import { IconifyIcon } from "./IconifyIcon";

interface ProductCardLinkButtonProps {
  product: Product;
  onUpdate?: () => void;
  className?: string;
}

export const ProductCardLinkButton: React.FC<ProductCardLinkButtonProps> = ({
  product,
  className = "",
}) => {
  const presets: LinkPreset[] = getCachedLinkPresets();
  const validLinks = (product.links || [])
    .map((l) => (typeof l === "string" ? l.trim() : ""))
    .filter(Boolean);

  if (validLinks.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-1.5 ${
        validLinks.length === 1
          ? "grid-cols-1"
          : validLinks.length === 2
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3"
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {validLinks.map((link, idx) => {
        const storeInfo = detectStoreWithPresets(link, presets);
        const displayLabel =
          product.linkButtonLabels?.[idx]?.trim() ||
          (idx === 0 && product.linkButtonLabel?.trim()
            ? product.linkButtonLabel.trim()
            : "") ||
          storeInfo.label ||
          "Buka Tautan";

        const handleOpenLink = (e: React.MouseEvent) => {
          e.stopPropagation();
          const targetUrl =
            link.startsWith("http://") || link.startsWith("https://")
              ? link
              : `https://${link}`;
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        };

        return (
          <button
            key={idx}
            type="button"
            onClick={handleOpenLink}
            className="group/link flex items-center justify-between gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-200 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-all overflow-hidden"
            title={`Buka tautan ${idx + 1}: ${link}`}
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center transition-transform group-hover/link:scale-110"
                style={{ color: storeInfo.color }}
              >
                <IconifyIcon
                  icon={storeInfo.icon}
                  className="h-3.5 w-3.5"
                  color={storeInfo.color}
                  fallback={<ExternalLink className="h-3 w-3" />}
                />
              </div>
              <span className="truncate font-sans font-semibold text-[11px] tracking-tight">
                {displayLabel}
              </span>
            </div>
            <ExternalLink className="h-3 w-3 text-zinc-400 group-hover/link:text-zinc-900 dark:group-hover/link:text-white shrink-0" />
          </button>
        );
      })}
    </div>
  );
};
