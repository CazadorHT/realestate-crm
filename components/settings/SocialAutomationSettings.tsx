"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Reply,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSetting,
  SocialKeyword,
  generateSocialAutomationTemplatesAction,
} from "@/features/site-settings/actions";
import { Badge } from "@/components/ui/badge";

export function SocialAutomationSettings() {
  const [keywords, setKeywords] = useState<SocialKeyword[]>([]);
  const [socialPostTemplate, setSocialPostTemplate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const settings = await getSiteSettings();
        setKeywords(settings.social_automation_keywords || []);
        setSocialPostTemplate(settings.social_post_template || "");
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addRow = () => {
    setKeywords([
      ...keywords,
      { keyword: "", dm_content: "", public_reply: "", enabled: true },
    ]);
  };

  const removeRow = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, data: Partial<SocialKeyword>) => {
    const newKeywords = [...keywords];
    newKeywords[index] = { ...newKeywords[index], ...data };
    setKeywords(newKeywords);
  };

  const handleSave = () => {
    // Basic validation
    if (keywords.some((k) => !k.keyword || !k.dm_content)) {
      toast.error("กรุณากรอก Keyword และข้อความ DM ให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      const res = await updateSiteSetting(
        "social_automation_keywords",
        keywords,
      );

      const templateRes = await updateSiteSetting(
        "social_post_template",
        socialPostTemplate,
      );

      if (res.success && templateRes.success) {
        toast.success("บันทึกการตั้งค่าเรียบร้อย");
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const handleAiGenerate = async (
    type: "SOCIAL_POST" | "KEYWORD_DM",
    index?: number,
  ) => {
    const keyword = index !== undefined ? keywords[index]?.keyword : undefined;
    const loadingId = index !== undefined ? `dm-${index}` : "social-post";

    setIsGenerating(loadingId);
    try {
      const res = await generateSocialAutomationTemplatesAction(type, keyword);
      if (res.success && res.data) {
        if (type === "SOCIAL_POST") {
          setSocialPostTemplate(res.data);
        } else if (index !== undefined) {
          updateRow(index, { dm_content: res.data });
        }
        toast.success("สร้างข้อความด้วย AI เรียบร้อย");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการสร้างข้อความ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setIsGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-linear-to-r from-slate-50 to-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Keyword Automation (Comment-to-DM)
                </CardTitle>
                <CardDescription>
                  ตั้งค่าข้อความตอบกลับอัตโนมัติเมื่อลูกค้าคอมเมนต์ด้วยคำที่กำหนด
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={addRow}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 rounded-full px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายการ
            </Button>
          </div>

          {/* Tags Help Box */}
          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-blue-800 mb-1">
                💡 เคล็ดลับ: ใช้ Tag เพื่อดึงข้อมูลทรัพย์อัตโนมัติ
              </p>
              <p className="text-blue-700 leading-relaxed">
                หากลูกค้าคอมเมนต์ใต้โพสต์ที่คุณกด "โพสต์ลง Facebook หรือ
                Instagram" จากหน้ารายละเอียดทรัพย์ คุณสามารถใช้ Tag
                เหล่านี้ในข้อความได้:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-600 font-bold">
                  {"{{title}}"}
                </code>{" "}
                <span className="text-blue-600">ชื่อทรัพย์</span>
                <code className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-600 font-bold">
                  {"{{price}}"}
                </code>{" "}
                <span className="text-blue-600">ราคาปัจจุบัน</span>
                <code className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-600 font-bold">
                  {"{{original}}"}
                </code>{" "}
                <span className="text-blue-600">ราคาเดิม (ก่อนลด)</span>
                <code className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-600 font-bold">
                  {"{{link}}"}
                </code>{" "}
                <span className="text-blue-600">ลิงก์ทรัพย์</span>
                <code className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-600 font-bold">
                  {"{{description}}"}
                </code>{" "}
                <span className="text-blue-600">รายละเอียดเต็ม</span>
              </div>
              <p className="text-sm text-blue-500 mt-4">
                ลูกค้าจะได้รับข้อความจริงๆ เป็น:
              </p>
              <p className="text-sm text-blue-400 italic">
                "สวัสดีครับ สนใจ Baan Sook Jai ราคา 5,000,000 ใช่ไหมครับ?
                ดูรายละเอียดได้ที่นี่เลย:
                **https://your-site.com/property/123**"
              </p>
              <p>
                ตัวแปร (Tags) ที่ใช้เรียกแสดง:
                {"{{title}}"}: ชื่อทรัพย์สิน
                {"{{sale_price}}"}: ราคาขาย
                {"{{rental_price}}"}: ราคาเช่า
                {"{{original_sale_price}}"}: ราคาขายเดิม
                {"{{original_rental_price}}"}: ราคาเช่าเดิม 
                {"{{amenities}}"}: สิ่งอำนวยความสะดวก
                {"{{location}}"}: ทำเล (เขต/จังหวัด)
                {"{{nearby_places}}"}: สถานที่ใกล้เคียง
                {"{{popular_area}}"}: ย่านยอดนิยม
                {"{{verified}}"}: ป้ายตรวจสอบแล้ว
                {"{{link}}"}: ลิงก์ไปยังหน้าเว็บ
              </p>
              <p className="text-[10px] text-blue-400/80 mt-1 italic leading-tight">
                * ระบบจะส่งอัลบั้มรูปภาพ (Carousel)
                ตามไปให้ลูกค้าโดยอัตโนมัติหากมีการแนบรูปในประกาศ
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {keywords.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                  <Info className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-lg">
                  ยังไม่มีการตั้งค่า Keyword
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มสร้างระบบตอบกลับอัตโนมัติ
                </p>
              </div>
            ) : (
              keywords.map((item, index) => (
                <div
                  key={index}
                  className="p-6 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1/3">
                          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Keyword (คำที่ลูกค้าพิมพ์)
                          </label>
                          <Input
                            placeholder="เช่น สนใจ, ขอรายละเอียด"
                            value={item.keyword}
                            onChange={(e) =>
                              updateRow(index, { keyword: e.target.value })
                            }
                            className="font-medium border-slate-200 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                              Private Message (ส่งเข้าแชทลูกค้า)
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1 px-1.5"
                              onClick={() =>
                                handleAiGenerate("KEYWORD_DM", index)
                              }
                              disabled={!!isGenerating}
                            >
                              {isGenerating === `dm-${index}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              AI ช่วยเขียน
                            </Button>
                          </div>
                          <Input
                            placeholder="ข้อความที่จะส่งเข้า Inbox..."
                            value={item.dm_content}
                            onChange={(e) =>
                              updateRow(index, { dm_content: e.target.value })
                            }
                            className="border-slate-200 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                          Public Reply (ตอบกลับใต้คอมเมนต์ - ไม่บังคับ)
                        </label>
                        <div className="relative">
                          <Reply className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="เช่น ส่งข้อมูลให้ทางแชทเรียบร้อยแล้วนะครับ! 🙏"
                            value={item.public_reply}
                            onChange={(e) =>
                              updateRow(index, { public_reply: e.target.value })
                            }
                            className="pl-10 border-slate-200 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      className="mt-6 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {keywords.length > 0 && (
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Badge
                  variant="outline"
                  className="bg-white border-slate-200 text-slate-600 font-normal"
                >
                  {keywords.length} รายการ
                </Badge>
                <span>ทุกการเปลี่ยนแปลงต้องกดบันทึกเพื่อใช้งาน</span>
              </div>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md shadow-blue-200"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                บันทึกการตั้งค่า
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Post Template Section */}
      <Card className="mt-8 border-none bg-transparent shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Plus className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-800">
                Social Post Template (Auto-Post)
              </h3>
              <p className="text-sm text-slate-500">
                กำหนดรูปแบบข้อความเริ่มต้นสำหรับปุ่ม "โพสต์ลง Facebook /
                Instagram"
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 gap-2 font-bold"
              onClick={() => handleAiGenerate("SOCIAL_POST")}
              disabled={!!isGenerating}
            >
              {isGenerating === "social-post" ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
              AI ช่วยสร้างรูปแบบโพสต์
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            <Textarea
              placeholder="🏠 {{title}}\n💰 {{price}}\n..."
              value={socialPostTemplate}
              onChange={(e) => setSocialPostTemplate(e.target.value)}
              className="min-h-[200px] font-mono text-sm border-slate-200 focus:border-blue-500 placeholder:text-slate-300"
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { tag: "{{title}}", label: "ชื่อทรัพย์" },
                { tag: "{{price}}", label: "ราคาสรุป" },
                { tag: "{{original_price}}", label: "เดิมสรุป" },
                { tag: "{{sale_price}}", label: "ราคาขาย" },
                { tag: "{{rental_price}}", label: "ราคาเช่า" },
                { tag: "{{original_sale_price}}", label: "ราคาขายเดิม" },
                { tag: "{{original_rental_price}}", label: "ราคาเช่าเดิม" },
                { tag: "{{bedrooms}}", label: "ห้องนอน" },
                { tag: "{{bathrooms}}", label: "ห้องน้ำ" },
                { tag: "{{size_sqm}}", label: "พื้นที่ (ตร.ม.)" },
                { tag: "{{floor}}", label: "ชั้น" },
                { tag: "{{property_type}}", label: "ประเภททรัพย์" },
                { tag: "{{listing_type}}", label: "ประเภทประกาศ" },
                { tag: "{{popular_area}}", label: "ย่านยอดนิยม" },
                { tag: "{{amenities}}", label: "สิ่งอำนวยความสะดวก" },
                { tag: "{{nearby_places}}", label: "สถานที่ใกล้เคียง" },
                { tag: "{{near_transit}}", label: "รถไฟฟ้าทั้งหมด" },
                { tag: "{{transit}}", label: "รถไฟฟ้าที่ใกล้สุด" },
                { tag: "{{google_maps}}", label: "ลิงก์แผนที่" },
                { tag: "{{verified}}", label: "ป้ายตรวจสอบแล้ว" },
                { tag: "{{exclusive}}", label: "ป้าย Exclusive" },
                { tag: "{{agent_name}}", label: "ชื่อคนดูแล" },
                { tag: "{{agent_phone}}", label: "เบอร์คนดูแล" },
                { tag: "{{agent_line}}", label: "LINE คนดูแล" },
                { tag: "{{link}}", label: "ลิงก์เว็บ" },
              ].map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] group/tag cursor-help"
                  title={item.label}
                >
                  <code className="text-blue-600 font-bold group-hover/tag:text-blue-700 transition-colors">
                    {item.tag}
                  </code>
                  <span className="text-slate-400 group-hover/tag:text-slate-500">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              บันทึกรูปแบบข้อความ
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
