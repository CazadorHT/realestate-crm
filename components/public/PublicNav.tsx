import { Home } from "lucide-react";
import Link from "next/link";
export function PublicNav() {
  return (
    <div className="backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-50 bg-white">
    <nav className="">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="">
            <Link href="/" className="text-xl flex items-center gap-2  font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Home className="h-6 w-6 text-blue-600" />
              PropertyHub
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
          </div>
        </div>
      </div>
    </nav>
    </div>
  );
}
