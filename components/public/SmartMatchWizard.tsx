"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  MapPin,
  Home,
  TrendingUp,
  Phone,
  Mail,
  User,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  searchPropertiesAction,
  createLeadFromMatchAction,
} from "@/features/smart-match/actions";
import {
  PropertyMatch,
  SearchPurpose,
  PropertyType,
} from "@/features/smart-match/types";

type QuizStep = 1 | 1.5 | 2 | 2.5 | 3 | 4 | 9;

export function SmartMatchWizard() {
  const [step, setStep] = useState<QuizStep>(1);
  const [purpose, setPurpose] = useState<SearchPurpose>("BUY");
  const [budgetRange, setBudgetRange] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [popularAreas, setPopularAreas] = useState<string[]>([]);
  const [nearTransit, setNearTransit] = useState<boolean>(false);
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");

  useEffect(() => {
    async function loadAreas() {
      try {
        const { getPopularAreasAction } = await import(
          "@/features/properties/actions"
        );
        const data = await getPopularAreasAction();
        if (data.length > 0) {
          setPopularAreas(data);
        } else {
          // Fallback to defaults
          setPopularAreas(["อ่อนนุช", "บางนา", "ลาดพร้าว", "พระราม 9"]);
        }
      } catch (e) {
        setPopularAreas(["อ่อนนุช", "บางนา", "ลาดพร้าว", "พระราม 9"]);
      }
    }
    loadAreas();
  }, []);

  const handleBack = () => {
    if (step === 1.5) setStep(1);
    else if (step === 2) setStep(1.5);
    else if (step === 2.5) setStep(2);
    else if (step === 3) setStep(2.5);
  };

  const currentStepIndex =
    step === 1
      ? 0
      : step === 1.5
      ? 1
      : step === 2
      ? 2
      : step === 2.5
      ? 3
      : step === 3
      ? 4
      : 5;
  const totalSteps = 5;

  const handleSearch = async () => {
    setStep(4);

    // Parse budget
    let min = 0;
    let max = 1000000000;

    if (purpose === "RENT") {
      if (budgetRange === "< 1.5 หมื่น") max = 15000;
      else if (budgetRange === "1.5-3 หมื่น") {
        min = 15000;
        max = 30000;
      } else if (budgetRange === "3-7 หมื่น") {
        min = 30000;
        max = 70000;
      } else if (budgetRange === "> 7 หมื่น") {
        min = 70000;
      }
    } else {
      if (budgetRange === "< 3 ล้าน") max = 3000000;
      else if (budgetRange === "3-5 ล้าน") {
        min = 3000000;
        max = 5000000;
      } else if (budgetRange === "5-10 ล้าน") {
        min = 5000000;
        max = 10000000;
      } else if (budgetRange === "> 10 ล้าน") {
        min = 10000000;
      }
    }

    try {
      const results = await searchPropertiesAction({
        purpose,
        budgetMin: min,
        budgetMax: max,
        area,
        nearTransit,
        propertyType: propertyType || undefined,
      });

      setSessionId(results.sessionId || "");
      setMatches(results.matches);

      // Artificial delay for UX
      setTimeout(() => {
        setStep(9);
      }, 1500);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่");
      setStep(1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 min-h-[350px] flex flex-col">
      {step < 9 ? (
        <>
          <div className="flex justify-between items-center relative ">
            <div className="flex items-center gap-3">
              {step > 1 && step < 4 && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all group"
                  title="ย้อนกลับ"
                >
                  <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Smart Match Wizard
              </div>
            </div>

            {/* PROGRESS DOTS */}
            <div className="flex gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all duration-500 ${
                    i <= currentStepIndex ? "bg-blue-600 w-4" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative  flex-1 flex flex-col pt-5 max-h-[350px]">
            {step === 1 && (
              <QuizQuestion
                title="คุณต้องการ ?"
                options={["ซื้อ", "เช่า", "ลงทุน"]}
                onSelect={(val) => {
                  setPurpose(
                    val === "ซื้อ" ? "BUY" : val === "เช่า" ? "RENT" : "INVEST"
                  );
                  setStep(1.5);
                }}
              />
            )}
            {step === 1.5 && (
              <QuizQuestion
                title="ประเภทอสังหาฯ ที่คุณต้องการ ?"
                options={["บ้าน", "คอนโด", "อาคารสำนักงาน", "โฮมออฟฟิศ"]}
                onSelect={(val) => {
                  const map: Record<string, PropertyType> = {
                    บ้าน: "HOUSE",
                    คอนโด: "CONDO",
                    อาคารสำนักงาน: "OFFICE_BUILDING",
                    โฮมออฟฟิศ: "TOWNHOME", // Or specific mapping
                  };
                  setPropertyType(map[val] || "OTHER");
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <QuizQuestion
                title={
                  purpose === "RENT"
                    ? "งบเช่าต่อเดือนเท่าไหร่ ?"
                    : "งบประมาณประมาณเท่าไหร่ ?"
                }
                options={
                  purpose === "RENT"
                    ? ["< 1.5 หมื่น", "1.5-3 หมื่น", "3-7 หมื่น", "> 7 หมื่น"]
                    : ["< 3 ล้าน", "3-5 ล้าน", "5-10 ล้าน", "> 10 ล้าน"]
                }
                onSelect={(val) => {
                  setBudgetRange(val);
                  setStep(2.5);
                }}
              />
            )}
            {step === 2.5 && (
              <QuizQuestion
                title="ต้องการเน้นใกล้รถไฟฟ้าไหม ?"
                options={["ใกล้รถไฟฟ้า BTS/MRT", "ไม่เน้นทำเลรถไฟฟ้า"]}
                onSelect={(val) => {
                  setNearTransit(val.includes("ใกล้รถไฟฟ้า"));
                  setStep(3);
                }}
              />
            )}
            {step === 3 && (
              <QuizQuestion
                title="ทำงานแถวไหน ?"
                options={popularAreas}
                onSelect={(val) => {
                  setArea(val);
                  handleSearch();
                }}
              />
            )}
            {step === 4 && <LoadingState />}
          </div>
        </>
      ) : (
        <ResultsContainer
          matches={matches}
          sessionId={sessionId}
          onReset={() => setStep(1)}
        />
      )}
    </div>
  );
}

interface QuizQuestionProps {
  title: string;
  options: string[];
  onSelect: (val: string) => void;
}

function QuizQuestion({ title, options, onSelect }: QuizQuestionProps) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex flex-col h-full max-h-[350px]">
      <h2 className="text-3xl font-medium md:text-2xl mb-6 text-slate-900">{title}</h2>
      <div className="overflow-y-auto pr-2 max-h-[200px] custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium text-slate-700 hover:text-blue-600 h-full"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12 animate-pulse flex-1 flex flex-col justify-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-blue-600 text-lg font-medium">
        กำลังวิเคราะห์ข้อมูล...
      </div>
      <p className="text-sm text-slate-500 mt-2">
        ระบบกำลังค้นหาทรัพย์สินจากฐานข้อมูลจริง
      </p>
    </div>
  );
}

function ResultsContainer({
  matches,
  sessionId,
  onReset,
}: {
  matches: PropertyMatch[];
  sessionId: string;
  onReset: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PropertyMatch | null>(
    null
  );

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 flex-1 flex flex-col justify-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          ไม่พบทรัพย์สินที่ตรงเป๊ะ
        </h3>
        <p className="text-slate-600 mb-6">
          ลองปรับงบประมาณหรือทำเลใหม่อีกครั้ง
        </p>
        <Button onClick={onReset} variant="outline">
          ค้นหาใหม่
        </Button>
      </div>
    );
  }

  if (showForm && selectedMatch) {
    return (
      <LeadForm
        match={selectedMatch}
        sessionId={sessionId}
        onBack={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex-1">
      <div className="bg-green-50 text-green-700 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-green-200">
        <span className="text-lg">🏆</span>
        พบ {matches.length} ทรัพย์สินที่เหมาะกับคุณ
      </div>

      <div className="overflow-y-auto pr-2 max-h-[480px] custom-scrollbar mb-4">
        <div className="space-y-6 pb-2">
          {matches.map((match) => (
            <ResultCard
              key={match.id}
              match={match}
              onSelect={() => {
                setSelectedMatch(match);
                setShowForm(true);
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-8 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        ← ค้นหาใหม่อีกครั้ง
      </button>
    </div>
  );
}

const PROPERTY_TYPE_NAMES: Record<string, string> = {
  CONDO: "คอนโด",
  HOUSE: "บ้าน",
  TOWNHOME: "โฮมออฟฟิศ/ทาวน์โฮม",
  OFFICE_BUILDING: "อาคารสำนักงาน",
  LAND: "ที่ดิน",
  WAREHOUSE: "โกดัง",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
};

function ResultCard({
  match,
  onSelect,
}: {
  match: PropertyMatch;
  onSelect: () => void;
}) {
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-slate-50/50 p-4">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
          <img
            src={match.image_url}
            alt={match.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-slate-900 truncate pr-2">
              {match.title}
            </h3>
            <div className="relative group/score">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-help transition-all hover:bg-blue-100 whitespace-nowrap">
                คะแนน
                {" " + match.match_score}
              </span>

              {/* Tooltip Breakdown */}
              {match.score_breakdown && match.score_breakdown.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50 opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-200 origin-top-right scale-95 group-hover/score:scale-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-1">
                    รายละเอียดคะแนน
                  </div>
                  <div className="space-y-1.5">
                    {match.score_breakdown.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-bold text-blue-600">
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1 mt-1 border-t border-slate-50 flex justify-between items-center font-bold text-xs text-slate-900 uppercase">
                      <span>รวมสุทธิ</span>
                      <span className="text-blue-600">
                        {match.match_score}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-sm font-bold text-blue-600">
              ฿
              {match.price >= 1000000
                ? `${(match.price / 1000000).toFixed(2)} ล้าน`
                : `${(match.price / 1000).toFixed(0)} พัน`}
            </div>
            {match.property_type && (
              <span className="text-[10px] text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                {PROPERTY_TYPE_NAMES[match.property_type] ||
                  match.property_type}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {(match.bedrooms || match.bathrooms) && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                <Home className="h-3 w-3" />
                {match.bedrooms || 0} นอน • {match.bathrooms || 0} น้ำ
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
              <MapPin className="h-3 w-3" />
              {match.commute_time} นาทีถึงที่ทำงาน
            </div>
            {match.near_transit && match.transit_station_name && (
              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                <TrendingUp className="h-3 w-3" />
                {match.transit_type || "BTS"} {match.transit_station_name}
                {match.transit_distance_meters
                  ? ` (${match.transit_distance_meters} ม.)`
                  : ""}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        {match.match_reasons.slice(0, 2).map((reason, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px] text-slate-600"
          >
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            {reason}
          </div>
        ))}
      </div>

      <Button
        onClick={onSelect}
        className="w-full mt-4 h-9 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        นัดชมทรัพย์นี้
      </Button>
    </div>
  );
}

function LeadForm({
  match,
  sessionId,
  onBack,
}: {
  match: PropertyMatch;
  sessionId: string;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      toast.error("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }

    setIsSubmitting(true);
    try {
      await createLeadFromMatchAction({
        sessionId,
        propertyId: match.id,
        ...formData,
      });
      setIsSuccess(true);
      toast.success("ส่งข้อมูลเรียบร้อยแล้ว! เจ้าหน้าที่จะติดต่อกลับ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12 flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          บันทึกข้อมูลแล้ว!
        </h3>
        <p className="text-slate-600 mb-8">
          เราได้รับความสนใจของคุณใน
          <br />
          <span className="font-bold text-slate-800">"{match.title}"</span>
          <br />
          เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชม.
        </p>
        <Button onClick={onBack} variant="outline">
          กลับไปดูทรัพย์อื่น
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500 flex-1">
      <button
        onClick={onBack}
        className="text-xs text-slate-500 mb-6 flex items-center gap-1 hover:text-blue-600"
      >
        ← กลับไปที่ผลการค้นหา
      </button>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">ระบุข้อมูลติดต่อ</h3>
        <p className="text-sm text-slate-500">
          เพื่อนัดชมทรัพย์และรับคำปรึกษาฟรี
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-6 flex gap-3 border border-slate-100">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
          <img
            src={match.image_url}
            className="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate">
            {match.title}
          </div>
          <div className="text-[10px] text-blue-600 font-bold">
            ฿{(match.price / 1000000).toFixed(2)} ล้าน
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 ml-1">
            ชื่อ-นามสกุล *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-10 border-slate-200 focus:border-blue-500"
              placeholder="กรอกชื่อของคุณ"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 ml-1">
            เบอร์โทรศัพท์ *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-10 border-slate-200 focus:border-blue-500"
              placeholder="08X-XXX-XXXX"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 ml-1">
            อีเมล (ถ้ามี)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-10 border-slate-200 focus:border-blue-500"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg mt-4"
        >
          {isSubmitting ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลและขอนัดชม"}
        </Button>
      </form>
    </div>
  );
}
