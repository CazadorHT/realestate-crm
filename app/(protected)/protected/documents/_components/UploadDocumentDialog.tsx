"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/features/documents/components/DocumentUpload";
import { DocumentOwnerType } from "@/features/documents/schema";
import { Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";

interface UploadDocumentDialogProps {
  tenantId?: string | null;
}

export function UploadDocumentDialog({ tenantId }: UploadDocumentDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);
  const [ownerType, setOwnerType] = useState<DocumentOwnerType>("PROPERTY");
  const [ownerId, setOwnerId] = useState("");
  const [owners, setOwners] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load owners when type changes
  useEffect(() => {
    if (!open) return;

    const loadOwners = async () => {
      setLoading(true);
      setOwnerId("");
      setOwners([]);

      try {
        let endpoint = "";
        switch (ownerType) {
          case "PROPERTY":
            endpoint = "/api/properties";
            break;
          case "LEAD":
            endpoint = "/api/leads";
            break;
          case "DEAL":
            endpoint = "/api/deals";
            break;
          case "RENTAL_CONTRACT":
            endpoint = "/api/rental-contracts";
            break;
        }

        const queryParams = new URLSearchParams();
        if (tenantId && tenantId !== "ALL") {
          queryParams.set("tenantId", tenantId);
        }
        const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();

          // Format based on type
          const formatted = (data.data || data || []).map((item: any) => ({
            id: item.id,
            label:
              ownerType === "PROPERTY"
                ? item.title || item.id
                : ownerType === "LEAD"
                ? item.full_name || item.email || item.id
                : ownerType === "DEAL"
                ? `Deal: ${item.property?.title || item.id}`
                : `Contract: ${item.id}`,
          }));

          setOwners(formatted);
          if (formatted.length > 0) {
            setOwnerId(formatted[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load owners:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOwners();
  }, [ownerType, open, tenantId]);

  const handleUploadComplete = () => {
    setOpen(false);
    router.refresh();
  };

  const canUpload = ownerId && ownerType;

  const getOwnerLabel = () => {
    switch (ownerType) {
      case "PROPERTY":
        return isEn ? "Property" : "ทรัพย์สิน";
      case "LEAD":
        return isEn ? "Lead" : "ลีด";
      case "DEAL":
        return isEn ? "Deal" : "ดีล";
      case "RENTAL_CONTRACT":
        return isEn ? "Rental Contract" : "สัญญาเช่า";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 rounded-2xl font-semibold h-12 shadow-sm border-slate-200 hover:bg-slate-50! hover:text-blue-500 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          {isEn ? "Upload Document" : "อัปโหลดเอกสาร"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEn ? "Upload Document" : "อัปโหลดเอกสาร"}</DialogTitle>
          <DialogDescription>
            {isEn
              ? "Select document owner and upload files (PDFs are compressed automatically)"
              : "เลือกเจ้าของเอกสารและอัปโหลดไฟล์ (PDF จะถูกบีบอัดอัตโนมัติ)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Owner Type Selection */}
          <div className="space-y-2">
            <Label>{isEn ? "Owner Type" : "ประเภทเจ้าของ"}</Label>
            <Select
              value={ownerType}
              onValueChange={(v) => setOwnerType(v as DocumentOwnerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPERTY">{isEn ? "Property" : "ทรัพย์สิน"}</SelectItem>
                <SelectItem value="LEAD">{isEn ? "Lead" : "ลีด"}</SelectItem>
                <SelectItem value="DEAL">{isEn ? "Deal" : "ดีล"}</SelectItem>
                <SelectItem value="RENTAL_CONTRACT">{isEn ? "Rental Contract" : "สัญญาเช่า"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner ID Selection */}
          <div className="space-y-2">
            <Label>
              {isEn ? `Select ${getOwnerLabel()}` : `เลือก${getOwnerLabel()}`}
            </Label>
            <Select
              value={ownerId}
              onValueChange={setOwnerId}
              disabled={loading || owners.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? (isEn ? "Loading..." : "กำลังโหลด...")
                      : owners.length === 0
                      ? (isEn ? "No records found" : "ไม่พบข้อมูล")
                      : (isEn ? "Select..." : "เลือก...")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {owners.length === 0 && !loading && (
              <p className="text-xs text-slate-500">
                {isEn
                  ? `No records found. Please create a ${getOwnerLabel().toLowerCase()} first.`
                  : `ไม่พบรายการ กรุณาสร้าง${getOwnerLabel()}ก่อน`}
              </p>
            )}
          </div>

          {/* Document Upload */}
          {canUpload && (
            <div className="pt-4 border-t">
              <DocumentUpload
                ownerId={ownerId}
                ownerType={ownerType}
                tenantId={tenantId}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

