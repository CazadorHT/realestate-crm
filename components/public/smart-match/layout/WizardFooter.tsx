"use client";

import { ShieldCheck } from "lucide-react";

interface WizardFooterProps {
  pdpaText: string;
}

export function WizardFooter({ pdpaText }: WizardFooterProps) {
  return (
    <div className="mt-4 text-xs text-slate-500 text-center ">
      <p className="flex items-center justify-center">
        <ShieldCheck className=" w-4 h-4 text-blue-600  mr-2" />
        {pdpaText}
      </p>
    </div>
  );
}
