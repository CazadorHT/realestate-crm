"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Facebook, Instagram, Share2 } from "lucide-react";
import { toast } from "sonner";
import { generateSocialCaptionsAction } from "@/features/properties/actions/social";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PropertySocialGeneratorProps {
  propertyId: string;
}

interface SocialCaptions {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  raw?: string;
}

export function PropertySocialGenerator({ propertyId }: PropertySocialGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [captions, setCaptions] = useState<SocialCaptions | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateSocialCaptionsAction(propertyId, 'all');
      setCaptions(result);
      toast.success("AI ร่างแคปชั่นให้เรียบร้อยแล้วครับ!");
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเรียกใช้ AI");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกลง Clipboard แล้ว!");
  };

  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
          <Sparkles className="w-5 h-5" />
          AI Social Post Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!captions ? (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="text-sm text-gray-600 mb-4">
              ให้ AI ช่วยร่างแคปชั่นสำหรับ Facebook, IG และ TikTok จากข้อมูลทรัพย์ชิ้นนี้
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "AI กำลังคิด..." : "เริ่มสร้างแคปชั่นด้วย AI"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>
            
            {['facebook', 'instagram', 'tiktok'].map((platform) => (
              <TabsContent key={platform} value={platform} className="space-y-4">
                <div className="p-3 bg-white border rounded-md text-sm whitespace-pre-wrap min-h-[100px]">
                  {captions[platform as keyof SocialCaptions] || captions.raw || "ไม่มีข้อมูล"}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center gap-2"
                  onClick={() => copyToClipboard(captions[platform as keyof SocialCaptions] || captions.raw || "")}
                >
                  <Copy className="w-4 h-4" />
                  คัดลอกแคปชั่น
                </Button>
              </TabsContent>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-4 text-gray-500 text-xs"
              onClick={() => setCaptions(null)}
            >
              สร้างใหม่
            </Button>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
