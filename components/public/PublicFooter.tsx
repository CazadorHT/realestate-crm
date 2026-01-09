import { Home } from "lucide-react";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Home className="h-6 w-6" />
              <span className="text-xl font-bold">Real Estate CRM</span>
            </div>
            <p className="text-sm">แพลตฟอร์มอสังหาริมทรัพย์ที่คุณไว้วางใจ</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">บริการ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  ซื้อ-ขาย
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  เช่า
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  ประเมินราคา
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">เกี่ยวกับ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#trust" className="hover:text-white transition-colors">
                  เกี่ยวกับเรา
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  ทีมงาน
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  ติดต่อเรา
                </a>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition-colors"
                >
                  บทความ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">ติดตาม</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Line @
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 text-center text-sm">
          © 2025 Real Estate CRM. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
