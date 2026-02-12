"use client";

import { useState } from "react";
import { DocumentOwnerType } from "../schema";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

type Props = {
  ownerId: string;
  ownerType: DocumentOwnerType;
};

export function DocumentSection({ ownerId, ownerType }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800">
              เอกสาร
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              เอกสารที่เกี่ยวข้อง
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto h-9 sm:h-8 font-bold sm:font-semibold"
            >
              <Upload className="mr-2 h-4 w-4 shrink-0" /> อัปโหลด
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1.5rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <DocumentUpload
              ownerId={ownerId}
              ownerType={ownerType}
              onUploadComplete={() => {
                setRefreshKey((k) => k + 1);
                // close dialog after success
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 sm:p-5 h-full overflow-y-auto">
          <DocumentList
            ownerId={ownerId}
            ownerType={ownerType}
            refreshTrigger={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
