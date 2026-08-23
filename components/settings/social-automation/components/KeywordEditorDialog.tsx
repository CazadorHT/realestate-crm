"use client";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Zap, Trash2, AlertCircle, Reply, Sparkles, Loader2, Eye, MessageCircle, Plus,
  Images, X, Target,
} from "lucide-react";
import { SocialKeyword } from "@/features/site-settings/schema";
import { PostPickerDialog, InstagramPost } from "./PostPickerDialog";
import { useLanguage } from "@/lib/i18n/language-context";

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
  const { language } = useLanguage();
  const isEn = language === "en";
  const [postPickerOpen, setPostPickerOpen] = useState(false);

  if (!item || editingIndex === null) return null;

  const handlePostSelect = (post: InstagramPost) => {
    onUpdate({
      linked_post_id: post.id,
      linked_post_preview: post.thumbnail_url || post.media_url,
    });
  };

  return (
    <>
      <PostPickerDialog
        open={postPickerOpen}
        onOpenChange={setPostPickerOpen}
        selectedPostId={item.linked_post_id}
        onSelect={handlePostSelect}
      />

      <ResponsiveDialog
        open={open}
        onOpenChange={(val: boolean) => !val && onClose()}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">
              {isEn ? "Configure Automation Rule" : "ตั้งค่าระบบตอบกลับอัตโนมัติ"}
            </span>
          </div>
        }
        description={isEn ? "Define trigger conditions and auto-reply actions for this keyword" : "กำหนดคุณลักษณะและเงื่อนไขการทำงานสำหรับคำสำคัญชุดนี้"}
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="w-full sm:w-auto flex justify-start">
              <ConfirmDialog
                title={isEn ? "Delete Keyword Rule" : "ลบชุดคำสั่งคีย์เวิร์ด"}
                description={
                  isEn 
                    ? `Are you sure you want to delete the automation rule for "${item.keyword || "empty"}"?` 
                    : `คุณแน่ใจหรือไม่ที่จะลบชุดคำสั่งสำหรับ Keyword "${item.keyword || "ว่าง"}"?`
                }
                onConfirm={onRemove}
                variant="destructive"
                trigger={
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2 rounded-2xl h-12 px-6 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isEn ? "Delete Keyword" : "ลบคีย์เวิร์ดนี้"}
                  </Button>
                }
              />
            </div>
            <div className="w-full sm:w-auto flex items-center justify-end gap-3">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest hidden lg:block mr-2">
                {isEn ? "Changes must be saved from main panel" : "ทุกการเปลี่ยนแปลงจะต้องถูกบันทึกไว้ในแดชบอร์ด"}
              </p>
              <Button
                onClick={onClose}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl px-12 h-12 shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                {isEn ? "Done" : "เสร็จสิ้น"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="py-4 space-y-8 pb-10">
          {/* Status Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isEn ? "Operational Status" : "สถานะการทำงาน"}
              </Label>
              <p className="text-[11px] text-slate-400">
                {isEn ? "Enable or disable detection for this keyword" : "เปิดหรือปิดการตรวจจับ Keyword นี้"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">
                {item.enabled !== false 
                  ? (isEn ? "Active" : "เปิดใช้งาน") 
                  : (isEn ? "Disabled" : "ปิดใช้งาน")}
              </span>
              <Switch
                id="keyword-enabled"
                checked={item.enabled !== false}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? "Rule Language" : "ภาษาของชุดคำสั่ง (Language)"}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {(["th", "en", "cn", "ru"] as const).map((lang) => {
                const labelMap = { 
                  th: isEn ? "Thai" : "ภาษาไทย", 
                  en: isEn ? "English" : "English", 
                  cn: isEn ? "Chinese" : "中文", 
                  ru: isEn ? "Russian" : "Русский" 
                };
                const isSelected = item.language === lang || (!item.language && lang === "th");
                return (
                  <Button
                    key={lang}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        : "text-slate-600! hover:bg-slate-50 border-slate-200"
                    }`}
                    onClick={() => onUpdate({ language: lang })}
                  >
                    {labelMap[lang]}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Post Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-600" />
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Post Filter" : "จำกัดโพสต์ (Post Filter)"}
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPostPickerOpen(true)}
                className="h-8 text-[11px] font-bold text-violet-600! border-violet-200 hover:bg-violet-50 rounded-xl gap-1.5 px-3"
              >
                <Images className="h-3 w-3" />
                {item.linked_post_id 
                  ? (isEn ? "Change Post" : "เปลี่ยนโพสต์") 
                  : (isEn ? "Select Post" : "เลือกโพสต์")}
              </Button>
            </div>

            {/* No post linked */}
            {!item.linked_post_id && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-xs text-slate-500 font-medium">
                  {isEn ? "Applies to all posts (Default)" : "ใช้กับทุกโพสต์ (ค่าเริ่มต้น)"}
                </span>
              </div>
            )}

            {/* Selected post preview */}
            {item.linked_post_id && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-2xl">
                {item.linked_post_preview ? (
                  <img
                    src={item.linked_post_preview}
                    alt="post"
                    className="w-14 h-14 rounded-xl object-cover border border-violet-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Images className="h-6 w-6 text-violet-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-violet-700">
                    {isEn ? "Selected post only ✓" : "เฉพาะโพสต์ที่เลือก ✓"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">ID: {item.linked_post_id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isEn ? "Keyword will trigger only for comments on this post" : "Keyword จะทำงานเฉพาะ Comment ในโพสต์นี้"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => onUpdate({ linked_post_id: undefined, linked_post_preview: undefined })}
                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full shrink-0"
                  title={isEn ? "Apply to all posts" : "ใช้กับทุกโพสต์"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* IF Condition */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
                  {isEn ? "IF (Condition)" : "IF (เงื่อนไข)"}
                </Badge>
                <span className="text-[13px] font-bold text-slate-700">
                  {isEn ? "When user comments..." : "เมื่อลูกค้าคอมเมนต์คำว่า..."}
                </span>
              </div>
              <ConfirmDialog
                title={isEn ? "Delete Rule" : "ลบชุดคำสั่ง"}
                description={
                  isEn 
                    ? `Are you sure you want to delete the automation rule for "${item.keyword || "empty"}"?` 
                    : `คุณแน่ใจหรือไม่ที่จะลบชุดคำสั่งสำหรับ Keyword "${item.keyword || "ว่าง"}"?`
                }
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
              placeholder={isEn ? "e.g. interested, details, price" : "เช่น สนใจ, ขอรายละเอียด"}
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
                {isEn ? "A rule with this keyword already exists" : "พบชุดคำสั่งที่ใช้ Keyword นี้อยู่แล้ว"}
              </p>
            )}
          </div>

          {/* THEN Results */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest">
                {isEn ? "THEN (Action)" : "THEN (ผลลัพธ์)"}
              </Badge>
              <span className="text-[13px] font-bold text-slate-700">
                {isEn ? "Execute the following actions:" : "ให้ระบบทำงานดังนี้:"}
              </span>
            </div>

            <div className="space-y-4">
              {/* DM Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-amber-600 -scale-x-100" />
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {isEn ? "1. Direct Message (DM)" : "1. ส่งข้อความส่วนตัว (DM)"}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] font-bold text-blue-600 hover:bg-blue-50 gap-2 px-3 rounded-xl border border-blue-100 transition-all"
                    onClick={onAiGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isEn ? "AI Writer" : "AI ช่วยเขียน"}
                  </Button>
                </div>
                <Textarea
                  placeholder={isEn ? "Draft a friendly, engaging DM response..." : "ร่างข้อความที่น่าประทับใจส่งหาลูกค้าทาง Inbox..."}
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LIVE PREVIEW</span>
                      </div>
                    </div>
                    <div className="text-[14px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                      {renderTemplate(item.dm_content)}
                    </div>
                  </div>
                )}
              </div>

              {/* DM Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {isEn ? "Quick Action Buttons (DM Buttons)" : "ปุ่มแบนเนอร์/แชทบอท (DM Buttons)"}
                    </label>
                  </div>
                  {(item.buttons?.length || 0) < 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        const currentButtons = item.buttons || [];
                        onUpdate({ buttons: [...currentButtons, { title: isEn ? "New Button" : "ปุ่มใหม่", type: "postback" }] });
                      }}
                      className="h-7 text-xs font-semibold text-blue-600! hover:bg-blue-50 px-2 rounded-lg transition-all"
                    >
                      + {isEn ? "Add Button" : "เพิ่มปุ่ม"}
                    </Button>
                  )}
                </div>
                {item.buttons && item.buttons.length > 0 ? (
                  <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                    {item.buttons.map((btn, idx) => (
                      <div key={idx} className="space-y-3 p-3 bg-white border border-slate-200/60 rounded-xl relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => {
                            const updated = item.buttons?.filter((_, i) => i !== idx) || [];
                            onUpdate({ buttons: updated });
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-full absolute top-2 right-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">
                              {isEn ? "Button Title (Max 20 chars)" : "ชื่อปุ่ม (สูงสุด 20 ตัวอักษร)"}
                            </Label>
                            <Input
                              placeholder={isEn ? "e.g. Talk to Agent" : "เช่น ปรึกษาแอดมิน"}
                              maxLength={20}
                              value={btn.title}
                              onChange={(e) => {
                                const updated = [...(item.buttons || [])];
                                updated[idx] = { ...btn, title: e.target.value };
                                onUpdate({ buttons: updated });
                              }}
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">
                              {isEn ? "Action Type" : "ประเภทการทำงาน"}
                            </Label>
                            <select
                              value={btn.type || "postback"}
                              onChange={(e) => {
                                const updated = [...(item.buttons || [])];
                                updated[idx] = {
                                  ...btn,
                                  type: e.target.value as any,
                                  url: e.target.value === "web_url" ? btn.url || "" : undefined,
                                };
                                onUpdate({ buttons: updated });
                              }}
                              className="w-full h-9 text-xs border border-slate-200 rounded-lg px-3 bg-white focus:outline-hidden focus:border-blue-500"
                            >
                              <option value="postback">{isEn ? "Text Response (Quick Reply)" : "พิมพ์ข้อความตอบกลับ (Quick Reply)"}</option>
                              <option value="web_url">{isEn ? "Open Website (Web URL)" : "เปิดลิงก์เว็บไซต์ (Web URL)"}</option>
                            </select>
                          </div>
                        </div>
                        {btn.type === "web_url" && (
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500">
                              {isEn ? "Destination URL Link" : "ลิงก์ URL ปลายทาง"}
                            </Label>
                            <Input
                              placeholder="https://example.com/..."
                              value={btn.url || ""}
                              onChange={(e) => {
                                const updated = [...(item.buttons || [])];
                                updated[idx] = { ...btn, url: e.target.value };
                                onUpdate({ buttons: updated });
                              }}
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50/30 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400">
                    {isEn ? "No action buttons added (Message will send as text only)" : "ยังไม่ได้เพิ่มปุ่มนำทาง (ข้อความจะส่งไปเฉพาะตัวอักษร)"}
                  </div>
                )}
              </div>

              {/* Public Replies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-indigo-600" />
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {isEn ? "2. Public Comment Reply (Random Spintax)" : "2. คอมเมนต์ตอบกลับสาธารณะ (สุ่ม Spintax)"}
                    </label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const currentReplies = item.public_replies || (item.public_reply ? [item.public_reply] : []);
                      onUpdate({ public_replies: [...currentReplies, ""] });
                    }}
                    className="h-8 text-[11px] font-bold gap-1 rounded-xl"
                  >
                    <Plus className="h-3 w-3" /> {isEn ? "Add Variant" : "เพิ่มตัวเลือก"}
                  </Button>
                </div>
                {(() => {
                  const currentReplies =
                    item.public_replies && item.public_replies.length > 0
                      ? item.public_replies
                      : item.public_reply
                      ? [item.public_reply]
                      : [""];
                  return (
                    <div className="space-y-2">
                      {currentReplies.map((reply, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-semibold text-slate-400 w-6">#{idx + 1}</span>
                          <Input
                            placeholder={isEn ? "e.g. Sent full details to your inbox! Check your DM 🙏" : "เช่น ส่งข้อมูลให้ทางแชทเรียบร้อยแล้วนะครับ! 🙏"}
                            value={reply}
                            onChange={(e) => {
                              const updated = [...currentReplies];
                              updated[idx] = e.target.value;
                              onUpdate({ public_replies: updated, public_reply: updated[0] || "" });
                            }}
                            className="flex-1 h-11 border-slate-200 rounded-xl focus:border-blue-500 bg-slate-50/10 focus:bg-white font-medium"
                          />
                          {currentReplies.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const updated = currentReplies.filter((_, i) => i !== idx);
                                onUpdate({ public_replies: updated, public_reply: updated[0] || "" });
                              }}
                              className="h-9 w-9 text-slate-400 hover:text-red-500 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

