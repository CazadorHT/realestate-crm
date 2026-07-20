"use client";

import { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  ArrowLeft, 
  Phone, 
  Video, 
  Info,
  ChevronRight,
  Smile,
  Mic,
  Image as ImageIcon,
  Heart as HeartIcon,
  CheckCircle,
  Lock,
  UserCheck,
  Instagram
} from "lucide-react";
import { MOCK_PROPERTY_DATA } from "./constants";

export interface PhoneSimulatorProps {
  activeTab: "post" | "comments" | "dm";
  setActiveTab: (tab: "post" | "comments" | "dm") => void;
  instagramTemplate: string;
  keywords: Array<{
    keyword: string;
    dm_content: string;
    public_reply?: string;
    public_replies?: string[];
    enabled?: boolean;
  }>;
  followGateEnabled?: boolean;
  leadCaptureGateEnabled?: boolean;
  instagramStoryReplyEnabled?: boolean;
  directDmReplyEnabled?: boolean;
}

export function PhoneSimulator({
  activeTab,
  setActiveTab,
  instagramTemplate,
  keywords,
  followGateEnabled = false,
  leadCaptureGateEnabled = false,
  instagramStoryReplyEnabled = false,
  directDmReplyEnabled = false,
}: PhoneSimulatorProps) {
  const renderTemplateText = (text: string) => {
    if (!text) return "กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง...";
    let rendered = text;
    Object.entries(MOCK_PROPERTY_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });
    return rendered;
  };

  const activeKeyword = keywords[0] || {
    keyword: "สนใจ",
    dm_content: "ขอบคุณที่สนใจค่ะ นี่คือข้อมูลทรัพย์สินสำหรับคุณ {{title}} ราคา {{price}} บาท สามารถดูได้ที่ {{link}}",
    public_replies: ["สนใจติดต่อสอบถามเพิ่มเติมได้เลยนะครับ", "เช็คอินบ็อกซ์ได้เลยจ้า ส่งข้อมูลให้แล้วครับ"],
  };

  const getDisplayPublicReply = () => {
    if (activeKeyword.public_replies && activeKeyword.public_replies.length > 0) {
      return activeKeyword.public_replies[0];
    }
    return activeKeyword.public_reply || "ส่งรายละเอียดให้ทาง inbox แล้วครับ";
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 lg:sticky lg:top-24">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full max-w-[320px] shadow-inner">
        <button
          onClick={() => setActiveTab("post")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "post"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Post Feed
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "comments"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab("dm")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "dm"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Direct DM
        </button>
      </div>

      {/* iPhone Device Wrapper */}
      <div className="relative mx-auto border-[12px] border-slate-900 rounded-[40px] h-[640px] w-[310px] bg-slate-900 shadow-2xl overflow-hidden ring-4 ring-slate-800">
        {/* Dynamic Island / Speaker */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 h-[22px] w-[110px] bg-slate-900 rounded-full z-50 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80"></div>
          <div className="w-10 h-1 bg-slate-800/40 rounded-full"></div>
          <div className="w-3.5 h-1 bg-blue-600/30 rounded-full"></div>
        </div>

        {/* Screen Status Bar */}
        <div className="absolute top-0 inset-x-0 h-10 bg-slate-900 flex items-end justify-between px-6 pb-1 text-[11px] font-medium text-white z-40 select-none">
          <span>14:30</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 bg-white rounded-xs"></span>
          </div>
        </div>

        {/* Screen Content Area */}
        <div className="h-full pt-10 pb-5 overflow-y-auto bg-slate-900 text-slate-100 flex flex-col scrollbar-thin">
          
          {/* POST TAB PREVIEW */}
          {activeTab === "post" && (
            <div className="flex-1 flex flex-col bg-slate-900">
              {/* Insta Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-900 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">VC</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold flex items-center gap-1">
                      vcconnect.asset
                      <CheckCircle className="h-3 w-3 fill-blue-500 text-slate-900" />
                    </div>
                    <div className="text-[9px] text-slate-400">Sponsored</div>
                  </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </div>

              {/* Post Media */}
              <div className="aspect-square bg-slate-900 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600"
                  alt="Property"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="p-3 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Heart className="h-5 w-5 text-slate-200" />
                  <MessageCircle className="h-5 w-5 text-slate-200" />
                  <Send className="h-5 w-5 text-slate-200" />
                </div>
                <Bookmark className="h-5 w-5 text-slate-200" />
              </div>

              {/* Caption & Content */}
              <div className="px-3 pb-4 text-[12px] leading-relaxed text-slate-200 flex-1">
                <div className="font-semibold mb-1">vcconnect.asset</div>
                <div className="whitespace-pre-wrap text-slate-300 max-h-[220px] overflow-y-auto pr-1">
                  {renderTemplateText(instagramTemplate)}
                </div>
              </div>
            </div>
          )}

          {/* COMMENTS TAB PREVIEW */}
          {activeTab === "comments" && (
            <div className="flex-1 flex flex-col bg-slate-900">
              <div className="flex items-center gap-3 p-3 border-b border-slate-800">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-semibold">Comments</span>
              </div>

              <div className="flex-1 p-3 space-y-4 text-[12px] overflow-y-auto">
                

                {/* Customer Comment */}
                <div className="flex gap-2 mt-4 pl-2 border-l border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-pink-600 flex-shrink-0 flex items-center justify-center text-[9px] font-bold">U</div>
                  <div>
                    <span className="font-semibold mr-1.5">customer_name</span>
                    <span className="text-slate-200">
                      {activeKeyword.keyword ? `${activeKeyword.keyword}` : "สนใจรายละเอียด"}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                      <span>2m</span>
                      <span className="font-semibold">Reply</span>
                    </div>
                  </div>
                </div>

                {/* Auto Reply Comment */}
                <div className="flex gap-2 pl-8">
                  <div className="w-5 h-5 rounded-full bg-slate-850 border border-slate-800 flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-blue-400">VC</div>
                  <div>
                    <span className="font-semibold mr-1.5">vcconnect.asset</span>
                    <span className="text-slate-300 bg-slate-800 px-2 py-1.5 rounded-lg inline-block mt-0.5">
                      {renderTemplateText(getDisplayPublicReply())}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                      <span>Just now</span>
                      <span className="text-slate-400 flex items-center gap-0.5"><CheckCircle className="h-2 w-2 fill-green-500 text-slate-900" /> Automated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Send Box */}
              <div className="p-2 border-t border-slate-800 flex items-center gap-2 bg-slate-900">
                <div className="flex-1 bg-slate-800 rounded-full px-3 py-1.5 flex items-center text-[11px] text-slate-500">
                  Add a comment...
                </div>
              </div>
            </div>
          )}

          {/* DM TAB PREVIEW */}
          {activeTab === "dm" && (
            <div className="flex-1 flex flex-col bg-slate-900">
              {/* DM Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 text-slate-300" />
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white">VC</div>
                  <div>
                    <div className="text-[12px] font-semibold flex items-center gap-0.5">
                      vcconnect.asset
                      <CheckCircle className="h-2.5 w-2.5 fill-blue-500 text-slate-900" />
                    </div>
                    <div className="text-[8px] text-slate-400">Active now</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="h-4 w-4" />
                  <Video className="h-4 w-4" />
                  <Info className="h-4 w-4" />
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-[11px] flex flex-col justify-end">
                {/* Story/DM Trigger simulation note */}
                {(instagramStoryReplyEnabled || directDmReplyEnabled) && (
                  <div className="self-center bg-slate-800/60 px-3 py-1.5 rounded-full text-[9px] text-slate-400 mb-2 border border-slate-800/40 flex items-center gap-1">
                    <Instagram className="h-3 w-3 text-pink-500" />
                    Triggered via {instagramStoryReplyEnabled ? "Story Comment" : "Direct DM"}
                  </div>
                )}

                {/* Follow Gate Restriction Mock */}
                {followGateEnabled && (
                  <div className="self-center w-full max-w-[220px] bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center mb-2">
                    <UserCheck className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] text-amber-300 font-semibold block">Follow Gate Enabled</span>
                    <span className="text-[8.5px] text-slate-400">บอทจะตรวจสอบสถานะการกดติดตาม ก่อนอนุญาตให้รับข้อมูลทรัพย์สิน</span>
                  </div>
                )}

                {/* Lead Capture Gate Option */}
                {leadCaptureGateEnabled ? (
                  <>
                    <div className="bg-slate-850 text-slate-200 px-3 py-2 rounded-2xl rounded-bl-sm self-start max-w-[210px] shadow-sm border border-slate-800/40 mt-1">
                      กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ของคุณเพื่อรับสิทธิ์ดูรายละเอียดโครงการค่ะ 😊
                    </div>
                    
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-br-sm self-end max-w-[190px] shadow-sm mt-1">
                      customer@email.com
                    </div>

                    <div className="bg-slate-850 text-slate-200 px-3 py-2 rounded-2xl rounded-bl-sm self-start max-w-[210px] shadow-sm border border-slate-800/40 mt-1 flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>บันทึกข้อมูลเรียบร้อยแล้วค่ะ!</span>
                    </div>
                  </>
                ) : null}

                {/* DM Keyword Auto reply message with Smart Tags substituted */}
                <div className="bg-slate-850 text-slate-200 px-3 py-2 rounded-2xl rounded-bl-sm  max-w-[250px] shadow-sm border border-slate-800/40 mt-1 whitespace-pre-wrap">
                  {renderTemplateText(activeKeyword.dm_content)}
                {/* Quick Reply button simulation at the bottom of the chat */}
                <div className="self-center flex gap-2 mt-2 ">
                  <div className="bg-slate-800 w-full   hover:bg-slate-700 border border-slate-700 text-blue-400 font-semibold text-[10px] px-4 py-2 rounded-full cursor-pointer transition-colors shadow-xs flex items-center gap-1">
                    ดูรายละเอียดทรัพย์ <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
                </div>

              </div>

              {/* Message Input Area */}
              <div className="p-2 border-t border-slate-800 bg-slate-900 flex items-center gap-2 text-slate-400">
                <Smile className="h-4 w-4" />
                <div className="flex-1 bg-slate-800 rounded-full px-3 py-1 flex items-center text-[10px] text-slate-500">
                  Message...
                </div>
                <Mic className="h-4 w-4" />
                <ImageIcon className="h-4 w-4" />
                <HeartIcon className="h-4 w-4" />
              </div>
            </div>
          )}

        </div>

        {/* Home Indicator line at the bottom */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 h-1 w-28 bg-white rounded-full z-50"></div>
      </div>
    </div>
  );
}
