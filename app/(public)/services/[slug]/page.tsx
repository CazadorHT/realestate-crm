import { Suspense } from "react";
import { getServiceBySlug } from "@/features/services/actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  LineChart,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: { slug: string };
}

async function ServiceDetail({ params }: PageProps) {
  const service = await getServiceBySlug(params.slug);

  if (!service) {
    notFound();
  }

  // Gallery splitting
  const gallery = service.gallery_images || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        {service.cover_image ? (
          <img
            src={service.cover_image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Link
            href="/services"
            className="absolute top-8 left-4 md:left-8 text-white/80 hover:text-white flex items-center gap-2 transition-colors py-2 px-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg max-w-4xl leading-tight">
            {service.title}
          </h1>
          {service.price_range && (
            <div className="mt-4 px-6 py-2 rounded-full bg-yellow-400/90 text-yellow-950 font-bold text-lg shadow-lg backdrop-blur-sm">
              {service.price_range}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
              <div className="prose prose-lg max-w-none prose-slate prose-headings:font-bold prose-a:text-blue-600">
                <div
                  dangerouslySetInnerHTML={{
                    __html: service.content || service.description || "",
                  }}
                />
              </div>
            </div>

            {/* Gallery Grid */}
            {gallery.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-8 bg-blue-600 rounded-full" />
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-zoom-in group"
                    >
                      <img
                        src={img}
                        alt={`${service.title} gallery ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 h-fit sticky top-24 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Interested?
              </h3>
              <p className="text-slate-500">
                Contact us to book this service or get more information.
              </p>
            </div>

            <div className="space-y-3">
              {service.contact_link ? (
                <a
                  href={service.contact_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full h-12 text-lg bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg shadow-green-500/20">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact via Line
                  </Button>
                </a>
              ) : (
                <Link href="/contact" className="block w-full">
                  <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Us
                  </Button>
                </Link>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-4">
                Why choose this service?
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">Verified & Trusted Partner</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">Quality Guaranteed</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">Premium Service Standards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service Not Found" };

  return {
    title: `${service.title} | Premium Services`,
    description: service.description || `Explore our ${service.title} service.`,
    openGraph: {
      images: service.cover_image ? [service.cover_image] : [],
    },
  };
}

export default function ServiceDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ServiceDetail {...props} />
    </Suspense>
  );
}
