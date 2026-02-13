"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { CardSearchPreview } from "@/lib/scrydex/useCardSearch";

type CardItemProps = {
  card: CardSearchPreview;
  showCardInfo?: boolean;
  imageSize?: "default" | "extraSmall";
  children?: ReactNode;
};

export default function CardItem({
  card,
  showCardInfo = true,
  imageSize = "default",
  children,
}: CardItemProps) {
  const isExtraSmallSize = imageSize === "extraSmall";

  return (
    <div className={isExtraSmallSize ? "flex items-start gap-2" : ""}>
      <div
        className={
          isExtraSmallSize
            ? "relative h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800"
            : "relative aspect-[63/88] w-full bg-zinc-100 dark:bg-zinc-800"
        }>
        {card.image?.small || card.image?.large ? (
          <Image
            src={card.image?.small ?? card.image?.large ?? ""}
            alt={card.name}
            className="h-full w-full object-cover"
            loading="lazy"
            fill
            sizes={
              isExtraSmallSize
                ? "50px"
                : "(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            }
            quality={90}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-y-1">
        {showCardInfo ? (
          <div className={isExtraSmallSize ? "min-w-0" : "space-y-0.5 p-1.5"}>
            <div className="truncate text-xs font-medium text-zinc-900 dark:text-white">
              {card.name}
            </div>
            <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-300">
              {card.expansion?.name ?? "Unknown set"}
              {card.number ? ` • #${card.number}` : ""}
            </div>
          </div>
        ) : null}

        {children ? (
          <div className={isExtraSmallSize ? "shrink-0" : "p-1"}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
