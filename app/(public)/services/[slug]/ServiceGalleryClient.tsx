"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/public/ImageLightbox";

interface ServiceGalleryClientProps {
  images: string[];
  title: string;
  galleryLabel: string;
}

export function ServiceGalleryClient({
  images,
  title,
  galleryLabel,
}: ServiceGalleryClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <span className="w-1 h-8 bg-blue-600 rounded-full" />
        {galleryLabel}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-zoom-in group"
            onClick={() => handleImageClick(idx)}
          >
            <img
              src={img}
              alt={`${title} gallery ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ))}
      </div>

      <ImageLightbox
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        images={images}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        title={title}
      />
    </div>
  );
}
