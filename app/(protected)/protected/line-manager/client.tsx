"use client";

import { useState } from "react";
import { LineTemplate } from "@/features/line/types";
import { updateLineTemplate } from "@/features/line/actions";
import {
  Home,
  MessageCircle,
  Mail,
  UserPlus,
  LogIn,
  TrendingDown,
  CheckCircle,
  Tag,
} from "lucide-react";

export function LineManagerClient({
  initialTemplates,
}: {
  initialTemplates: LineTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState<string | null>(null);

  const getIcon = (key: string) => {
    switch (key) {
      case "DEPOSIT":
        return <Home className="w-5 h-5 text-white" />;
      case "INQUIRY":
        return <MessageCircle className="w-5 h-5 text-white" />;
      case "CONTACT":
        return <Mail className="w-5 h-5 text-white" />;
      case "SIGNUP":
        return <UserPlus className="w-5 h-5 text-white" />;
      case "LOGIN":
        return <LogIn className="w-5 h-5 text-white" />;
      case "PRICE_DROP":
        return <TrendingDown className="w-5 h-5 text-white" />;
      case "DEAL_SOLO":
        return <CheckCircle className="w-5 h-5 text-white" />;
      case "DEAL_RENT":
        return <Tag className="w-5 h-5 text-white" />;
      default:
        return <MessageCircle className="w-5 h-5 text-white" />;
    }
  };

  const handleUpdate = async (key: string, field: string, value: any) => {
    setLoading(key);

    const updatedTemplates = templates.map((t) => {
      if (t.key === key) {
        if (field === "is_active") return { ...t, is_active: value };
        if (field === "config.headerColor")
          return { ...t, config: { ...t.config, headerColor: value } };
        if (field === "config.headerText")
          return { ...t, config: { ...t.config, headerText: value } };
      }
      return t;
    });

    setTemplates(updatedTemplates);

    const templateToUpdate = updatedTemplates.find((t) => t.key === key);
    if (!templateToUpdate) return;

    try {
      await updateLineTemplate(key, {
        is_active: templateToUpdate.is_active,
        config: templateToUpdate.config,
      });
    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6 grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.key}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{template.label}</h3>
            <label className="flex items-center cursor-pointer">
              <span className="mr-3 text-sm text-gray-500">Active</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={template.is_active}
                  onChange={(e) =>
                    handleUpdate(template.key, "is_active", e.target.checked)
                  }
                />
                <div
                  className={`block w-10 h-6 rounded-full ${template.is_active ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${template.is_active ? "transform translate-x-4" : ""}`}
                ></div>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Text
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded-md"
                value={template.config.headerText}
                onChange={(e) =>
                  handleUpdate(
                    template.key,
                    "config.headerText",
                    e.target.value,
                  )
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-20 p-1 border border-gray-200 rounded-md cursor-pointer"
                  value={template.config.headerColor}
                  onChange={(e) =>
                    handleUpdate(
                      template.key,
                      "config.headerColor",
                      e.target.value,
                    )
                  }
                />
                <span className="text-sm text-gray-500">
                  {template.config.headerColor}
                </span>
              </div>
            </div>
          </div>

          {loading === template.key && (
            <p className="text-xs text-blue-500 mt-2">Saving...</p>
          )}

          {/* Preview Mockup */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="max-w-xs bg-white rounded-xl overflow-hidden shadow-sm font-sans mx-auto border border-gray-200">
              {/* Header */}
              <div
                style={{ backgroundColor: template.config.headerColor }}
                className="p-4 flex items-center gap-3"
              >
                {getIcon(template.key)}
                <p className="text-white font-bold">
                  {template.config.headerText}
                </p>
              </div>

              {/* Body Preview based on Type */}
              <div className="p-0">
                {template.key === "INQUIRY" ||
                template.key === "DEPOSIT" ||
                template.key === "PRICE_DROP" ||
                template.key === "DEAL_SOLO" ||
                template.key === "DEAL_RENT" ? (
                  <div className="bg-white">
                    {/* Property Image Mock */}
                    <div className="h-32 bg-gray-300 w-full object-cover relative">
                      <img
                        src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=60"
                        alt="Property"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-gray-700">
                        FOR SALE
                      </div>
                    </div>

                    <div className="p-3">
                      {/* Property Title */}
                      <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                        The Luxury Residence Sukhumvit
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        📍 Sukhumvit 39, Bangkok
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1">🛏️ 2</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="flex items-center gap-1">🚿 2</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="flex items-center gap-1">
                          📏 85 sq.m
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-gray-400 line-through">
                            ฿12,900,000
                          </p>
                          <p className="text-sm font-bold text-red-600">
                            ฿11,500,000
                          </p>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          -11%
                        </span>
                      </div>

                      <div className="h-px bg-gray-100 my-3"></div>

                      {/* Contact Info Mock */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">ติดต่อ:</span>
                          <span className="text-gray-900 font-medium">
                            คุณลูกค้าใจดี
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">เบอร์:</span>
                          <span className="text-gray-900">089-999-9999</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Button Mock */}
                    <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                      <a
                        href="#"
                        className="text-xs text-blue-600 font-bold block w-full"
                      >
                        ดูรายละเอียดทรัพย์
                      </a>
                    </div>
                  </div>
                ) : (
                  // Generic Layout for others
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-3 w-3/4 bg-gray-100 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-gray-100 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 w-full bg-gray-100 rounded"></div>
                          <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          No templates found. Run the seed/migration first.
        </div>
      )}
    </div>
  );
}
