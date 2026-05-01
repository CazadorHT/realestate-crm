import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isPending?: boolean;
}

export function QuickSearch({ value, onChange, onSearch, isPending }: QuickSearchProps) {
  const isInitialMount = useRef(true);

  // [INSTANT SEARCH] Debounce search execution
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only search if the local value actually differs from the URL state 
    // to prevent infinite loops during state sync.
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrlQ = urlParams.get('q') || "";
    
    if (value === currentUrlQ) return;

    const timer = setTimeout(() => {
      onSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative flex-1 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        )}
      </div>
      <Input
        placeholder="ค้นหาทรัพย์..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        className="pl-9 w-full h-9 rounded-full bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm"
      />
    </div>
  );
}
