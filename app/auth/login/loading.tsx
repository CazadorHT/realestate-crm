import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617]">
      {/* Skeleton Background - Matches PremiumAuthLayout */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-white/5" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-white/5" />
      </div>

      {/* Loading Dialog Skeleton */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col items-center justify-center space-y-6">
        <div className="h-12 w-12 rounded-full border-2 border-slate-100 border-t-blue-600 animate-spin" />
        <div className="space-y-2 text-center">
          <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-3 w-48 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
        
        {/* Form Field Skeletons */}
        <div className="w-full space-y-4 pt-4">
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-100 rounded ml-1" />
            <div className="h-12 w-full bg-slate-50/50 rounded-xl border border-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-100 rounded ml-1" />
            <div className="h-12 w-full bg-slate-50/50 rounded-xl border border-slate-100" />
          </div>
          <div className="h-14 w-full bg-slate-200 rounded-xl animate-pulse mt-6" />
        </div>
      </div>
    </div>
  );
}
