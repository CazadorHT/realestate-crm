"use client";

import { useState } from "react";
import { DocumentOwnerType } from "../schema";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">Documents</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Upload
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

      <DocumentList ownerId={ownerId} ownerType={ownerType} refreshTrigger={refreshKey} />
    </div>
  );
}
