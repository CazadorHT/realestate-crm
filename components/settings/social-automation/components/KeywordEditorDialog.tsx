import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-3xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-slate-50/80 border-b border-slate-200 relative">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Zap className="h-5 w-5 text-white" />
            </div>
            ตั้งค่าระบบตอบกลับอัตโนมัติ
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            กำหนดคุณลักษณะและเงื่อนไขการทำงานสำหรับคำสำคัญชุดนี้
          </DialogDescription>

          <div className="absolute top-8 right-8 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:border-blue-200 transition-all cursor-pointer">
              <Label 
                htmlFor="keyword-enabled" 
                className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 cursor-pointer select-none"
              >
                {item.enabled !== false ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Label>
              <Switch
                id="keyword-enabled"
                checked={item.enabled !== false}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
                className="data-[state=checked]:bg-blue-600 scale-75"
              />
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
        </DialogHeader>

        <div className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative">
            <div className="md:col-span-12 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-600 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
                  IF (เงื่อนไข)
                </Badge>
                <span className="text-[13px] font-semibold text-slate-400 capitalize">
                  เมื่อลูกค้าคอมเมนต์ด้วยคำว่า...
                </span>
              </div>

              <Input
                placeholder="เช่น สนใจ, ขอรายละเอียด"
                value={item.keyword || ""}
                onChange={(e) => onUpdate({ keyword: e.target.value })}
                className={`h-12 font-medium text-lg border-slate-200 rounded-xl focus:ring-8 transition-all px-8 ${
                  !item.keyword?.trim() || isDuplicate
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100"
                    : "focus:border-blue-500 focus:ring-blue-50 bg-slate-50/50 focus:bg-white"
                }`}
              />
              {isDuplicate && (
                <p className="text-[12px] font-semibold text-red-500 mt-1 ml-4 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  พบชุดคำสั่งที่ใช้ Keyword นี้อยู่แล้ว
                </p>
              )}
              {!item.keyword?.trim() && (
                <p className="text-[12px] font-semibold text-red-400 mt-1 ml-4 italic">
                  * กรุณากรอก Keyword สำหรับการตรวจจับคอมเมนต์
                </p>
              )}
            </div>

            <div className="hidden md:flex absolute top-[110px] bottom-0 w-px bg-linear-to-b from-blue-200 to-transparent" />

            <div className="md:col-span-12 space-y-2 pl-0 md:pl-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
                  THEN (ผลลัพธ์)
                </Badge>
                <span className="text-[13px] font-semibold text-slate-400 capitalize">
                  ให้ระบบทำงานอัตโนมัติดังนี้:
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <Reply className="h-4 w-4 text-amber-600 -scale-x-100" />
                      </div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                        1. ส่งข้อความส่วนตัว (DM)
                      </label>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] font-semibold text-blue-600 hover:text-white hover:bg-blue-600 gap-2 px-3 rounded-full border border-blue-100 transition-all shadow-xs"
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
                    className={`min-h-[120px] border-slate-200 rounded-2xl focus:ring-8 transition-all resize-none p-4 pb-12 leading-relaxed ${
                      !item.dm_content?.trim()
                        ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100"
                        : "focus:border-blue-500 focus:ring-blue-50 bg-slate-50/10 focus:bg-white"
                    }`}
                  />
                  {!item.dm_content?.trim() && (
                    <p className="text-[11px] font-semibold text-red-400 mt-1 italic">
                      * กรุณากรอกข้อความสำหรับส่งให้ลูกค้าทาง Inbox
                    </p>
                  )}
                  
                  {item.dm_content?.trim() && (
                    <div className="mt-4 p-5 bg-linear-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-inner-sm overflow-hidden group">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                            Live Preview (ตัวอย่างข้อความจริง)
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold border-blue-100 text-blue-500 bg-blue-50/50">
                          Simulated Data
                        </Badge>
                      </div>
                      <div className="text-[14px] text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">
                        {renderTemplate(item.dm_content)}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium italic">
                    <Sparkles className="h-3 w-3" />
                    * สามารถใช้ Smart Tags ได้ตามความเหมาะสม ระบบจะดึงข้อมูลจริงมาใส่แทนคำที่อยู่ในปีกกา
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                      2. คอมเมนต์ตอบกลับสาธารณะ
                    </label>
                  </div>
                  <Input
                    placeholder="เช่น ส่งข้อมูลให้ทางแชทเรียบร้อยแล้วนะครับ! 🙏"
                    value={item.public_reply || ""}
                    onChange={(e) => onUpdate({ public_reply: e.target.value })}
                    className="h-14 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-8 focus:ring-blue-50 shadow-sm bg-slate-50/10 focus:bg-white transition-all px-6 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest hidden sm:block">
            ทุกการเปลี่ยนแปลงจะต้องถูกบันทึกไว้ในแดชบอร์ด |
          </p>
          <Button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl px-12 h-12 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            เสร็จสิ้น
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
