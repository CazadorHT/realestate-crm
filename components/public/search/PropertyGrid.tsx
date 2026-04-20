"use client";

import { m, AnimatePresence } from "framer-motion";
import { PropertyCard, PropertyCardProps } from "../PropertyCard";

type ApiProperty = PropertyCardProps;

interface PropertyGridProps {
  properties: ApiProperty[];
  currentPage: number;
}

export function PropertyGrid({ properties, currentPage }: PropertyGridProps) {
  return (
    <m.div
      layout
      className="grid gap-6 md:gap-y-8 lg:gap-x-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12"
    >
      <AnimatePresence mode="popLayout">
        {properties.map((item, i) => (
          <m.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              ease: "easeOut",
            }}
          >
            <PropertyCard
              property={item}
              priority={currentPage === 1 && i < 4}
            />
          </m.div>
        ))}
      </AnimatePresence>
    </m.div>
  );
}
