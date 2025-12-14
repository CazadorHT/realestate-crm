"use client";

import { useEffect, useState } from "react";
import { Home, Building, Building2, Warehouse, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export function MorphingLoader() {
  const [index, setIndex] = useState(0);

  const icons = [
    { icon: Home,  },
    { icon: Building,  },
    { icon: Building2,  },
    { icon: Warehouse,  },
    { icon: Map,  },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % icons.length);
    }, 300); // Change every 800ms

    return () => clearInterval(interval);
  }, [icons.length]);

  const CurrentIcon = icons[index].icon;

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh] animate-in fade-in zoom-in duration-300">
      <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary/10">
        <CurrentIcon className="h-10 w-10 text-primary transition-all duration-300 animate-bounce" />
      </div>
      <div className="flex flex-col items-center gap-1">
         <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading...
         </p>

      </div>
    </div>
  );
}
