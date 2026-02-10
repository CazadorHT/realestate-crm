"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI } from "@/features/chatbot/actions";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  properties?: Array<{
    id: string;
    title: string;
    image: string | null;
    price: number | null;
    rental_price: number | null;
    original_price: number | null;
    original_rental_price: number | null;
    slug: string;
  }>;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize welcome message when language changes or component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          role: "bot",
          content: t("chat.welcome_message"),
          timestamp: new Date(),
        },
      ]);
    }
  }, [t]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep track of history for the server action
  const historyRef = useRef<
    { role: "user" | "model"; parts: { text: string }[] }[]
  >([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Server Action
      const response = await chatWithAI(historyRef.current, userText);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: response.text,
        timestamp: new Date(),
        properties: response.properties,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update history
      historyRef.current.push(
        { role: "user", parts: [{ text: userText }] },
        { role: "model", parts: [{ text: response.text }] },
      );
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: t("chat.error_message"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in bg-white shadow-2xl",
        // Mobile styles: Floating widget
        "fixed bottom-20 right-4 left-4 h-[600px] max-h-[70vh] rounded-2xl border border-slate-200 shadow-2xl w-auto",
        // Desktop styles: Fixed size widget
        "md:w-[380px] md:h-[600px] md:max-h-[80vh] md:rounded-2xl md:bottom-24 md:right-4 md:inset-auto md:border md:border-slate-200",
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-10 pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">
              {t("chat.assistant_name")}
            </h3>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-100 text-xs">
                {t("chat.online_status")}
              </span>
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
        ref={scrollRef}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full items-start gap-2",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-blue-100" : "bg-indigo-100",
              )}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4 text-blue-600" />
              ) : (
                <Bot className="h-4 w-4 text-indigo-600" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-tl-none w-full",
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Property Cards */}
              {msg.properties && msg.properties.length > 0 && (
                <div className="mt-3 flex gap-3 overflow-x-auto py-2 -mx-2 px-2 snap-x scrollbar-hide">
                  {msg.properties.map((prop) => (
                    <a
                      key={prop.id}
                      href={`/properties/${prop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="snap-center shrink-0 w-[200px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-video bg-slate-200 relative">
                        {prop.image ? (
                          <img
                            src={prop.image}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No Image
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-slate-900 text-xs truncate mb-1">
                          {prop.title}
                        </div>
                        <div className="flex flex-col">
                          {prop.original_price &&
                            prop.price &&
                            prop.original_price > prop.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ฿{prop.original_price.toLocaleString()}
                              </span>
                            )}
                          {prop.original_rental_price &&
                            prop.rental_price &&
                            prop.original_rental_price > prop.rental_price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ฿{prop.original_rental_price.toLocaleString()}
                                /ด.
                              </span>
                            )}
                          <div className="text-blue-600 font-bold text-sm">
                            {prop.price
                              ? `฿${prop.price.toLocaleString()}`
                              : prop.rental_price
                                ? `฿${prop.rental_price.toLocaleString()}/ด.`
                                : "ราคาโทรสอบถาม"}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <div
                className={cn(
                  "text-[10px] mt-1 opacity-70",
                  msg.role === "user" ? "text-blue-100" : "text-slate-400",
                )}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.input_placeholder")}
            className="rounded-full border-slate-200 focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
