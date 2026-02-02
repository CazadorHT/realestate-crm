import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { RiHome4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";

interface DealPropertyCardProps {
  property: any; // Using any for simplicity as strictly typing property relations can be verbose, but ideally should be typed
  isRent: boolean;
}

export function DealPropertyCard({ property, isRent }: DealPropertyCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden   ">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-200">
        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
          <RiHome4Line className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">
            ทรัพย์ที่เกี่ยวข้อง
          </h3>
          <p className="text-xs text-slate-500">รายละเอียดทรัพย์สินในดีล</p>
        </div>
      </div>

      {property ? (
        <div className="p-0">
          {/* Property Image */}
          <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
            {property.property_images?.[0]?.image_url ? (
              <img
                src={
                  property.property_images.find((img: any) => img.is_cover)
                    ?.image_url || property.property_images[0].image_url
                }
                alt={property.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <RiHome4Line className="h-16 w-16" />
              </div>
            )}
            {/* Price Badge */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {isRent ? "ราคาเช่า" : "ราคาขาย"}
                </p>
                <div className="flex items-baseline gap-2">
                  {(() => {
                    const rawCurrent = isRent
                      ? property.rental_price
                      : property.price;
                    const rawOriginal = isRent
                      ? property.original_rental_price
                      : property.original_price;

                    const current = rawCurrent || 0;
                    const original = rawOriginal || 0;
                    const displayPrice =
                      current === 0 && original > 0 ? original : current;
                    const showOriginal = current > 0 && original > current;

                    return (
                      <>
                        <p className="text-xl font-bold text-emerald-600">
                          ฿{displayPrice.toLocaleString()}
                        </p>
                        {showOriginal && (
                          <span className="text-sm text-muted-foreground line-through">
                            ฿{original.toLocaleString()}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="p-4 space-y-3">
            <Link
              href={`/protected/properties/${property.id}`}
              className="font-bold text-lg hover:text-primary transition-colors line-clamp-2 block"
            >
              {property.title}
            </Link>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              กรุงเทพมหานคร
            </p>

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href={`/protected/properties/${property.id}`}>
                ดูรายละเอียดทรัพย์
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <RiHome4Line className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ไม่พบข้อมูลทรัพย์</p>
        </div>
      )}
    </div>
  );
}
