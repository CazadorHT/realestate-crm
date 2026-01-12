// / 404 เฉพาะ property detail
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">ไม่พบทรัพย์นี้</h1>
      <p className="mt-3 text-slate-600">
        ลองกลับไปหน้ารวมทรัพย์เพื่อเลือกดูรายการอื่น
      </p>
      <div className="mt-6">
        <Link href="/properties" className="text-blue-600 hover:underline">
          ไปหน้ารวมทรัพย์
        </Link>
      </div>
    </main>
  );
}
