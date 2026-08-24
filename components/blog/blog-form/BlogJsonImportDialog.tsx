"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileJson } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogJsonImportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  jsonInput: string;
  setJsonInput: (input: string) => void;
  onImport: () => void;
}

export function BlogJsonImportDialog({
  open,
  setOpen,
  jsonInput,
  setJsonInput,
  onImport,
}: BlogJsonImportDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex gap-2 h-10 md:h-12 cursor-pointer font-medium"
        >
          <FileJson className="h-4 w-4" />
          <span className="hidden md:inline">{isEn ? "Import JSON" : "นำเข้า JSON"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>{isEn ? "Import Data from JSON" : "นำเข้าข้อมูลจาก JSON"}</DialogTitle>
          <DialogDescription>
            {isEn
              ? "Paste a JSON object to autofill article fields."
              : "วาง JSON object เพื่อกรอกข้อมูลอัตโนมัติ"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder='{ "title": "...", "content": "..." }'
            className="font-mono min-h-[300px]"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button type="button" onClick={onImport} className="cursor-pointer">
              {isEn ? "Import" : "นำเข้า"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

