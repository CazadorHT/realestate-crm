"use client";

import { Home, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readFavoriteIds } from "@/lib/favorite-store";

export function PublicNav() {
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    // Initial load
    updateFavoriteCount();

    // Listen for favorite updates
    const handleFavoriteUpdate = () => {
      updateFavoriteCount();
    };

    window.addEventListener("favorite-updated", handleFavoriteUpdate);
    return () =>
      window.removeEventListener("favorite-updated", handleFavoriteUpdate);
  }, []);

  function updateFavoriteCount() {
    const ids = readFavoriteIds();
    setFavoriteCount(ids.length);
  }

  return (
    <div className="backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-50 bg-white">
      <nav className="">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="">
              <Link
                href="/"
                className="text-xl flex items-center gap-2  font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                <Home className="h-6 w-6 text-blue-600" />
                SABAICAZA
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="/properties"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                ทรัพย์สิน
              </a>
              <a
                href="#how-it-works"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                วิธีการทำงาน
              </a>
              <a
                href="#trust"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                เกี่ยวกับเรา
              </a>
              <Link
                href="/blog"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                บทความ
              </Link>

              {/* Favorites Button */}
              <Link
                href="/favorites"
                className="relative group"
                aria-label="รายการโปรด"
              >
                <div className="flex items-center gap-2 text-slate-600 hover:text-pink-600 transition-colors">
                  <Heart className="h-5 w-5 group-hover:fill-pink-600 transition-all" />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                      {favoriteCount > 99 ? "99+" : favoriteCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
