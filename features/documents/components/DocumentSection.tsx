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
import { Upload } from "lucide-react";

type Props = {
  ownerId: string;
  ownerType: DocumentOwnerType;
};

export function DocumentSection({ ownerId, ownerType }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base flex items-center gap-2">
          📄 เอกสาร
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Upload className="mr-2 h-4 w-4" /> อัปโหลด
            </Button>
          </DialogTrigger>
          <DialogContent>
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
      <p className="text-xs text-muted-foreground mb-4">
        เอกสารที่เกี่ยวข้อง เช่น สัญญา, บัตรประชาชน, หนังสือเดินทาง ฯลฯ
      </p>

      <div className="flex-1 overflow-auto">
        <DocumentList
          ownerId={ownerId}
          ownerType={ownerType}
          refreshTrigger={refreshKey}
        />
      </div>
    </div>
  );
}
