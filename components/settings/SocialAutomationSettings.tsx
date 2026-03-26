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
  Languages,
  Globe,
  ThumbsUp,
  MessageCircle,
  Share2,
  ChevronDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSetting,
  generateSocialAutomationTemplatesAction,
} from "@/features/site-settings/actions";
import { SocialKeyword } from "@/features/site-settings/schema";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";

const MOCK_PROPERTY_DATA = {
  title: "Baan Sook Jai (สุขใจ) - Luxury House with Pool",
  price: "฿12,500,000",
  original_price: "฿13,900,000",
  sale_price: "฿12,500,000",
  rental_price: "65,000 บาท/เดือน",
  original_sale_price: "฿13,900,000",
  original_rental_price: "75,000 บาท/เดือน",
  bedrooms: "4",
  bathrooms: "5",
  size_sqm: "320",
  floor: "2",
  property_type: "House",
  listing_type: "Sale",
  popular_area: "ห้วยขวาง (Huai Khwang)",
  amenities: "สระว่ายน้ำ, ฟิตเนส, รปภ. 24 ชม.",
  nearby_places: "MRT ห้วยขวาง, เซ็นทรัล พระราม 9",
  near_transit: "MRT ห้วยขวาง, MRT ศูนย์วัฒนธรรม",
  transit: "MRT ห้วยขวาง (300ม.)",
  google_maps: "https://maps.google.com/?q=Huai+Khwang",
  verified: "✅ ตรวจสอบแล้ว",
  exclusive: "🌟 Exclusive",
  agent_name: "John Doe",
  agent_phone: "081-234-5678",
  agent_line: "@realestate_john",
  link: "https://your-crm.com/properties/123",
  description: "บ้านเดี่ยวสุดหรู 2 ชั้น พร้อมสระว่ายน้ำส่วนตัว ทำเลทองย่านห้วยขวาง พื้นที่ใช้สอยกว้างขวาง ตกแต่งครบครัน...",
};

function FacebookPostPreview({ 
  template, 
  language = "th" 
}: { 
  template: string; 
  language?: "th" | "en" | "cn" 
}) {
  const renderContent = (text: string) => {
    if (!text) return <span className="text-slate-300 italic">กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง...</span>;
    
    let rendered = text;
    Object.entries(MOCK_PROPERTY_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });

    return rendered.split('\n').map((line, i) => (
      <span key={i} className="block min-h-[1em]">{line}</span>
    ));
  };

  return (
    <div className="bg-white border rounded-xl border-slate-200 shadow-sm overflow-hidden max-w-md mx-auto sticky top-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            VC
          </div>
          <div>
            <div className="font-bold text-[15px] flex items-center gap-1">
              VC Connect Asset
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <Badge className="h-2 w-2 p-0 border-0 bg-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-slate-500">
              Just now · <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 text-[15px] leading-relaxed text-slate-900 whitespace-pre-wrap">
        {renderContent(template)}
      </div>

      {/* Media Placeholder */}
      <div className="aspect-video bg-slate-100 relative group overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" 
          alt="Mock Property"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-white/90 text-slate-900 border-0 shadow-sm backdrop-blur-xs font-bold">
            {MOCK_PROPERTY_DATA.listing_type === "Sale" ? "FOR SALE" : "FOR RENT"}
          </Badge>
          <Badge className="bg-blue-600/90 text-white border-0 shadow-sm backdrop-blur-xs font-bold">
            {MOCK_PROPERTY_DATA.price}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 text-[13px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
              <ThumbsUp className="h-2.5 w-2.5 text-white fill-current" />
            </div>
          </div>
          42
        </div>
        <div className="flex gap-3">
          <span>8 comments</span>
          <span>5 shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex justify-between text-slate-500 font-bold text-[14px]">
        <Button variant="ghost" className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10">
          <ThumbsUp className="h-5 w-5" /> Like
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10">
          <MessageCircle className="h-5 w-5" /> Comment
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10">
          <Share2 className="h-5 w-5" /> Share
        </Button>
      </div>
    </div>
  );
}

export function SocialAutomationSettings() {
  const [keywords, setKeywords] = useState<SocialKeyword[]>([]);
  const [socialPostTemplate, setSocialPostTemplate] = useState<string>("");
  const [socialPostTemplateEn, setSocialPostTemplateEn] = useState<string>("");
  const [socialPostTemplateCn, setSocialPostTemplateCn] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"th" | "en" | "cn">("th");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const templateSectionRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTemplate = () => {
    templateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const settings = await getSiteSettings();
        setKeywords(settings.social_automation_keywords || []);
        setSocialPostTemplate(settings.social_post_template || "");
        setSocialPostTemplateEn(settings.social_post_template_en || "");
        setSocialPostTemplateCn(settings.social_post_template_cn || "");
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

      const templateEnRes = await updateSiteSetting(
        "social_post_template_en",
        socialPostTemplateEn,
      );

      const templateCnRes = await updateSiteSetting(
        "social_post_template_cn",
        socialPostTemplateCn,
      );

      if (res.success && templateRes.success && templateEnRes.success && templateCnRes.success) {
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
      const res = await generateSocialAutomationTemplatesAction(type, keyword, activeTab);
      if (res.success && res.data) {
        if (type === "SOCIAL_POST") {
          if (activeTab === "th") setSocialPostTemplate(res.data);
          else if (activeTab === "en") setSocialPostTemplateEn(res.data);
          else if (activeTab === "cn") setSocialPostTemplateCn(res.data);
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
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTemplate}
              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full px-4"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              จัดการ Template โพสต์
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
      <div ref={templateSectionRef} className="scroll-mt-6">
        <Card className="mt-8 border-slate-200 shadow-sm relative overflow-hidden">
          {/* Decorative Backgound */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <CardHeader className="bg-linear-to-r from-slate-50 to-amber-50 border-b relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Languages className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    Social Post Template (Auto-Post)
                  </CardTitle>
                  <CardDescription>
                    กำหนดรูปแบบข้อความสำหรับการแชร์ลง Facebook / Instagram ตามภาษาที่เลือก
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-200! bg-amber-50 text-amber-700 hover:text-amber-100! hover:bg-amber-600! gap-2 font-medium"
                  onClick={() => handleAiGenerate("SOCIAL_POST")}
                  disabled={!!isGenerating}
                >
                  {isGenerating === "social-post" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500 hover:text-amber-100" />
                  ) : (
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500 hover:text-amber-100" />
                  )}
                  AI ช่วยสร้างรูปแบบ ({activeTab.toUpperCase()})
                </Button>
              </div>
            </div>
          </CardHeader>

        <CardContent className="p-0">
          <Tabs
            defaultValue="th"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1">
                <TabsTrigger value="th" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">ภาษาไทย (TH)</TabsTrigger>
                <TabsTrigger value="en" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">English (EN)</TabsTrigger>
                <TabsTrigger value="cn" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Chinese (CN)</TabsTrigger>
              </TabsList>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-slate-100">
              {/* Left Column: Editor */}
              <div>
                <TabsContent value="th" className="m-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template Editor (TH)</label>
                      <Badge className="bg-blue-50 text-blue-600 hover:text-white border-blue-100 font-normal">Auto-Saving...</Badge>
                    </div>
                    <Textarea
                      placeholder="🏠 {{title}}\n💰 {{price}}\n..."
                      value={socialPostTemplate}
                      onChange={(e) => setSocialPostTemplate(e.target.value)}
                      className="min-h-[350px] font-mono text-sm border-slate-200 focus:border-amber-500 focus:ring-amber-200 placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="en" className="m-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template Editor (EN)</label>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-normal">Auto-Saving...</Badge>
                    </div>
                    <Textarea
                      placeholder="🏠 {{title}}\n💰 {{price}}\n..."
                      value={socialPostTemplateEn}
                      onChange={(e) => setSocialPostTemplateEn(e.target.value)}
                      className="min-h-[350px] font-mono text-sm border-slate-200 focus:border-amber-500 focus:ring-amber-200 placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="cn" className="m-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template Editor (CN)</label>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-normal">Auto-Saving...</Badge>
                    </div>
                    <Textarea
                      placeholder="🏠 {{title}}\n💰 {{price}}\n..."
                      value={socialPostTemplateCn}
                      onChange={(e) => setSocialPostTemplateCn(e.target.value)}
                      className="min-h-[350px] font-mono text-sm border-slate-200 focus:border-amber-500 focus:ring-amber-200 placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </TabsContent>
              </div>

              {/* Right Column: Premium Preview */}
              <div className="bg-slate-50/50 p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facebook Post Preview</label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-medium">Real-time Preview</span>
                  </div>
                </div>
                
                <FacebookPostPreview 
                  template={
                    activeTab === "th" ? socialPostTemplate :
                    activeTab === "en" ? socialPostTemplateEn :
                    socialPostTemplateCn
                  }
                  language={activeTab}
                />
                
                <p className="mt-8 text-[11px] text-slate-400 text-center max-w-[280px]">
                  💡 <b>Pro Tip:</b> ใช้ตัวแปร {"{{...}}"} เพื่อดึงข้อมูลทรัพย์สินมาแสดงโดยอัตโนมัติในตอนที่กดโพสต์จริง
                </p>
              </div>
            </div>
          </Tabs>

          <div className="px-6 pb-6 pt-0 space-y-4">

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
        </CardContent>
      </Card>
    </div>
  </>
);
}
