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

export function UploadDocumentDialog() {
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

        const res = await fetch(endpoint);
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
  }, [ownerType, open]);

  const handleUploadComplete = () => {
    setOpen(false);
    router.refresh();
  };

  const canUpload = ownerId && ownerType;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          อัพโหลดเอกสาร
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>อัพโหลดเอกสาร</DialogTitle>
          <DialogDescription>
            เลือกเจ้าของเอกสารและอัพโหลดไฟล์ (PDF จะถูกบีบอัดอัตโนมัติ)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Owner Type Selection */}
          <div className="space-y-2">
            <Label>ประเภทเจ้าของ</Label>
            <Select
              value={ownerType}
              onValueChange={(v) => setOwnerType(v as DocumentOwnerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPERTY">ทรัพย์สิน</SelectItem>
                <SelectItem value="LEAD">ลีด</SelectItem>
                <SelectItem value="DEAL">ดีล</SelectItem>
                <SelectItem value="RENTAL_CONTRACT">สัญญาเช่า</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner ID Selection */}
          <div className="space-y-2">
            <Label>
              เลือก
              {ownerType === "PROPERTY"
                ? "ทรัพย์"
                : ownerType === "LEAD"
                ? "ลีด"
                : ownerType === "DEAL"
                ? "ดีล"
                : "สัญญา"}
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
                      ? "กำลังโหลด..."
                      : owners.length === 0
                      ? "ไม่พบข้อมูล"
                      : "เลือก..."
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
                ไม่พบรายการ กรุณาสร้าง
                {ownerType === "PROPERTY"
                  ? "ทรัพย์"
                  : ownerType === "LEAD"
                  ? "ลีด"
                  : ownerType === "DEAL"
                  ? "ดีล"
                  : "สัญญา"}
                ก่อน
              </p>
            )}
          </div>

          {/* Document Upload */}
          {canUpload && (
            <div className="pt-4 border-t">
              <DocumentUpload
                ownerId={ownerId}
                ownerType={ownerType}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
