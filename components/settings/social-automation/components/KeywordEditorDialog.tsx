import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Zap, Trash2, AlertCircle, Reply, Sparkles, Loader2, Eye, MessageCircle 
} from "lucide-react";
import { SocialKeyword } from "@/features/site-settings/schema";

interface KeywordEditorDialogProps {
  open: boolean;
  onClose: () => void;
  editingIndex: number | null;
  item: SocialKeyword | undefined;
  isDuplicate: boolean;
  isGenerating: boolean;
  onUpdate: (data: Partial<SocialKeyword>) => void;
  onRemove: () => void;
  onAiGenerate: () => void;
  renderTemplate: (content: string) => string;
}

export function KeywordEditorDialog({
  open,
  onClose,
  editingIndex,
  item,
  isDuplicate,
  isGenerating,
  onUpdate,
  onRemove,
  onAiGenerate,
  renderTemplate,
}: KeywordEditorDialogProps) {
  if (!item || editingIndex === null) return null;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val: boolean) => !val && onClose()}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold">ตั้งค่าระบบตอบกลับอัตโนมัติ</span>
        </div>
      }
      description="กำหนดคุณลักษณะและเงื่อนไขการทำงานสำหรับคำสำคัญชุดนี้"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest hidden sm:block">
            ทุกการเปลี่ยนแปลงจะต้องถูกบันทึกไว้ในแดชบอร์ด
          </p>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl px-12 h-12 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            เสร็จสิ้น
          </Button>
        </div>
      }
    >
      <div className="py-4 space-y-8 pb-10">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะการทำงาน</Label>
            <p className="text-[11px] text-slate-400">เปิดหรือปิดการตรวจจับ Keyword นี้</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">{item.enabled !== false ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
            <Switch
              id="keyword-enabled"
              checked={item.enabled !== false}
              onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
                IF (เงื่อนไข)
              </Badge>
              <span className="text-[13px] font-bold text-slate-700">
                เมื่อลูกค้าคอมเมนต์คำว่า...
              </span>
            </div>
            
            <ConfirmDialog
              title="ลบชุดคำสั่ง"
              description={`คุณแน่ใจหรือไม่ที่จะลบชุดคำสั่งสำหรับ Keyword "${item.keyword || "ว่าง"}"?`}
              onConfirm={onRemove}
              variant="destructive"
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              }
            />
          </div>

          <Input
            placeholder="เช่น สนใจ, ขอรายละเอียด"
            value={item.keyword || ""}
            onChange={(e) => onUpdate({ keyword: e.target.value })}
            className={`h-12 font-bold text-lg border-slate-200 rounded-xl focus:ring-8 transition-all px-6 ${
              !item.keyword?.trim() || isDuplicate
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100"
                : "focus:border-blue-500 focus:ring-blue-50 bg-slate-50/50 focus:bg-white"
            }`}
          />
          {isDuplicate && (
            <p className="text-[12px] font-semibold text-red-500 mt-1 ml-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              พบชุดคำสั่งที่ใช้ Keyword นี้อยู่แล้ว
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
              THEN (ผลลัพธ์)
            </Badge>
            <span className="text-[13px] font-bold text-slate-700">
              ให้ระบบทำงานดังนี้:
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-amber-600 -scale-x-100" />
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    1. ส่งข้อความส่วนตัว (DM)
                  </label>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-bold text-blue-600 hover:bg-blue-50 gap-2 px-3 rounded-xl border border-blue-100 transition-all"
                  onClick={onAiGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  AI ช่วยเขียน
                </Button>
              </div>
              <Textarea
                placeholder="ร่างข้อความที่น่าประทับใจส่งหาลูกค้าทาง Inbox..."
                value={item.dm_content || ""}
                onChange={(e) => onUpdate({ dm_content: e.target.value })}
                className={`min-h-[120px] border-slate-200 rounded-2xl focus:ring-8 transition-all resize-none p-4 leading-relaxed ${
                  !item.dm_content?.trim()
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100"
                    : "focus:border-blue-500 focus:ring-blue-50 bg-slate-50/10 focus:bg-white"
                }`}
              />
              
              {item.dm_content?.trim() && (
                <div className="mt-4 p-5 bg-linear-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-inner-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        LIVE PREVIEW
                      </span>
                    </div>
                  </div>
                  <div className="text-[14px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                    {renderTemplate(item.dm_content)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-indigo-600" />
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  2. คอมเมนต์ตอบกลับสาธารณะ
                </label>
              </div>
              <Input
                placeholder="เช่น ส่งข้อมูลให้ทางแชทเรียบร้อยแล้วนะครับ! 🙏"
                value={item.public_reply || ""}
                onChange={(e) => onUpdate({ public_reply: e.target.value })}
                className="h-12 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-8 focus:ring-blue-50 bg-slate-50/10 focus:bg-white transition-all px-4 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
