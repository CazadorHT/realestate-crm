import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Dynamic mock state for LanguageProvider & next/navigation
const mockLangState = {
  language: "en" as "th" | "en" | "cn" | "ru",
  langPrefix: "/en",
};

const mockPrefetch = vi.fn();
const mockBack = vi.fn();
const mockRedirect = vi.fn();
const mockGetServerTranslations = vi.fn();
const mockSetLanguage = vi.fn();
const mockT = (key: string) => key;
const mockUseLanguageImpl = vi.fn(() => ({
  language: mockLangState.language,
  langPrefix: mockLangState.langPrefix,
  setLanguage: mockSetLanguage,
  t: mockT,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _prefetch, ...props }: any) => (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt || ""} src={props.src || ""} />;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
    push: vi.fn(),
    replace: vi.fn(),
    back: mockBack,
    refresh: vi.fn(),
  }),
  usePathname: () => `${mockLangState.langPrefix}/properties`,
  redirect: (...args: any[]) => mockRedirect(...args),
}));

vi.mock("@/components/providers/LanguageProvider", () => ({
  useLanguage: () => mockUseLanguageImpl(),
  getLangPrefix: (lang?: string | null) => {
    if (!lang || lang === "th") return "";
    if (lang === "cn" || lang === "zh") return "/zh";
    if (lang === "ru") return "/ru";
    if (lang === "en") return "/en";
    return `/${lang}`;
  },
  dictionaries: { th: {}, en: {}, cn: {}, ru: {} },
}));

vi.mock("@/lib/i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/i18n")>();
  return {
    ...actual,
    getServerTranslations: (...args: any[]) => mockGetServerTranslations(...args),
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  showReportDialog: vi.fn(),
}));

vi.mock("@/lib/gtm", () => ({
  pushToDataLayer: vi.fn(),
  GTM_EVENTS: {
    CARD_IMPRESSION: "card_impression",
    CARD_CLICK: "card_click",
    ADD_COMPARE: "add_compare",
    ADD_FAVORITE: "add_favorite",
    VIEW_NEARBY: "view_nearby",
    IMAGE_SLIDE: "image_slide",
    IMAGE_SLIDE_MID: "image_slide_mid",
    IMAGE_SLIDE_HALF: "image_slide_half",
    IMAGE_SLIDE_DEEP: "image_slide_deep",
    IMAGE_SLIDE_ALL: "image_slide_all",
    IMAGE_CLICK: "image_click",
  },
}));

vi.mock("@/lib/analytics-utils", () => ({
  updateAIScore: vi.fn(),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Sub-components of PropertyCard that aren't under test in PropertyCard prefetch check
vi.mock("./property-card/PropertyCardImage", () => ({
  PropertyCardImage: () => <div data-testid="card-image" />,
}));
vi.mock("./property-card/PropertyCardSpecs", () => ({
  PropertyCardSpecs: () => <div data-testid="card-specs" />,
}));
vi.mock("./property-card/PropertyCardFeatures", () => ({
  PropertyCardFeatures: () => <div data-testid="card-features" />,
}));
vi.mock("./property-card/PropertyCardFooter", () => ({
  PropertyCardFooter: () => <div data-testid="card-footer" />,
}));

// Imports under test
import { PropertyCardInfo } from "./property-card/PropertyCardInfo";
import { PropertyCard } from "./PropertyCard";
import { PropertyHeader } from "./property-detail/PropertyHeader";
import { NearbyPlaces } from "./NearbyPlaces";
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { ChatWindow } from "@/components/chatbot/ChatWindow";
import SearchPage from "@/app/(public)/search/page";
import NotFound from "@/app/not-found";
import RootError from "@/app/error";

const LOCALES: Array<{ language: "th" | "en" | "cn" | "ru"; prefix: string }> = [
  { language: "th", prefix: "" },
  { language: "en", prefix: "/en" },
  { language: "cn", prefix: "/zh" },
  { language: "ru", prefix: "/ru" },
];

function setLocale(language: "th" | "en" | "cn" | "ru", prefix: string) {
  mockLangState.language = language;
  mockLangState.langPrefix = prefix;
}

describe("Locale Link Prefix Regression Suite (9 fixed locations)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocale("en", "/en");
    mockUseLanguageImpl.mockImplementation(() => ({
      language: mockLangState.language,
      langPrefix: mockLangState.langPrefix,
      setLanguage: mockSetLanguage,
      t: mockT,
    }));

    // Mock IntersectionObserver for PropertyCard
    (globalThis as any).IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  // 1. PropertyCardInfo: project link preserves locale prefix
  describe("1. PropertyCardInfo project link", () => {
    it.each(LOCALES)(
      "links project name to $prefix/projects/<slug> when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        const property = {
          id: "prop-1",
          slug: "asoke-unit-1",
          title: "Luxury Condo Asoke",
          property_type: "CONDO",
          listing_type: "RENT" as const,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          projects: {
            name_th: "แอชตัน อโศก",
            name_en: "Ashton Asoke",
            slug: "ashton-asoke",
          },
        };

        render(<PropertyCardInfo property={property} areaProvince="Asoke • Bangkok" />);

        const projectLink = screen.getByRole("link", { name: /Ashton Asoke/i });
        expect(projectLink).toHaveAttribute("href", `${prefix}/projects/ashton-asoke`);
      }
    );
  });

  // 2. PropertyCard: hover prefetch preserves locale prefix
  describe("2. PropertyCard hover prefetch", () => {
    it.each(LOCALES)(
      "prefetches $prefix/properties/<slug> on mouseEnter when language=$language",
      ({ language, prefix }) => {
        vi.useFakeTimers();
        setLocale(language, prefix);
        const property = {
          id: "prop-2",
          slug: "sathorn-sky-2",
          title: "Sathorn Sky Suite",
          property_type: "CONDO",
          listing_type: "SALE" as const,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        };

        const { container } = render(<PropertyCard property={property} />);
        const cardEl = container.firstElementChild as HTMLElement;

        fireEvent.mouseEnter(cardEl);
        act(() => {
          vi.advanceTimersByTime(150);
        });

        expect(mockPrefetch).toHaveBeenCalledWith(`${prefix}/properties/sathorn-sky-2`);
      }
    );
  });

  // 3. PropertyHeader: popular area badge link preserves locale prefix
  describe("3. PropertyHeader popular area badge link", () => {
    it.each(LOCALES)(
      "links area badge with slug to $prefix/areas/<slug> when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        const property = {
          id: "prop-3",
          slug: "thonglor-penthouse",
          title: "Thonglor Penthouse",
          property_type: "CONDO",
          listing_type: "SALE" as const,
          price: 15000000,
          original_price: null,
          rental_price: null,
          original_rental_price: null,
          min_contract_months: null,
          popular_area: { th: "ทองหล่อ", en: "Thong Lo" },
          popular_area_slug: "thonglor",
        };

        render(<PropertyHeader property={property} />);

        const areaLinks = screen
          .getAllByRole("link")
          .filter((a) => a.getAttribute("href")?.includes("/areas/thonglor"));
        expect(areaLinks.length).toBeGreaterThanOrEqual(1);
        for (const link of areaLinks) {
          expect(link).toHaveAttribute("href", `${prefix}/areas/thonglor`);
        }
      }
    );

    it("links area badge without slug to /en/properties?popular_area=... when language=en", () => {
      setLocale("en", "/en");
      const property = {
        id: "prop-3b",
        slug: "custom-area-unit",
        title: "Custom Area Unit",
        property_type: "CONDO",
        listing_type: "RENT" as const,
        price: null,
        original_price: null,
        rental_price: 25000,
        original_rental_price: null,
        min_contract_months: 12,
        popular_area: "Ekkamai",
        popular_area_slug: null,
      };

      render(<PropertyHeader property={property} />);

      const areaLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.includes("popular_area="));
      expect(areaLinks.length).toBeGreaterThanOrEqual(1);
      for (const link of areaLinks) {
        expect(link.getAttribute("href")).toBe(
          `/en/properties?popular_area=${encodeURIComponent("Ekkamai")}`
        );
      }
    });
  });

  // 4. NearbyPlaces: transit station links preserve locale prefix across all 3 branches
  describe("4. NearbyPlaces transit station links", () => {
    it.each(LOCALES)(
      "prefixes all 3 transit link branches with $prefix when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        const transits = [
          {
            type: "BTS",
            station_name: { th: "อโศก", en: "Asoke" },
            slug: "bts-asoke",
            distance_meters: 200,
          },
          {
            type: "MRT",
            station_name: { th: "สุขุมวิท", en: "Sukhumvit" },
            distance_meters: 350,
          },
          {
            type: "BTS",
            station_name: { th: "สถานีพิเศษ", en: "" },
            distance_meters: 500,
          },
        ];

        render(<NearbyPlaces transits={transits} />);

        const links = screen.getAllByRole("link");
        const hrefs = links.map((l) => l.getAttribute("href"));

        expect(hrefs).toContain(`${prefix}/near-station/bts-asoke`);
        expect(hrefs).toContain(`${prefix}/near-station/mrt-sukhumvit`);
        expect(hrefs).toContain(
          `${prefix}/properties?transit_station=${encodeURIComponent("สถานีพิเศษ")}`
        );
      }
    );
  });

  // 5. SearchResultsHeader: default mapHref fallback preserves locale prefix
  describe("5. SearchResultsHeader default mapHref", () => {
    it.each(LOCALES)(
      "defaults map link to $prefix/map when mapHref is omitted and language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        render(
          <SearchResultsHeader
            totalFound={10}
            startIndex={0}
            endIndex={10}
            onViewModeChange={vi.fn()}
          />
        );

        const mapLink = screen.getByRole("link");
        expect(mapLink).toHaveAttribute("href", `${prefix}/map`);
      }
    );

    it("uses explicit mapHref prop when provided", () => {
      setLocale("en", "/en");
      render(
        <SearchResultsHeader
          totalFound={10}
          startIndex={0}
          endIndex={10}
          onViewModeChange={vi.fn()}
          mapHref="/en/map?listing_type=RENT"
        />
      );

      expect(screen.getByRole("link")).toHaveAttribute("href", "/en/map?listing_type=RENT");
    });
  });

  // 6. ChatWindow: recommended property cards preserve locale prefix
  describe("6. ChatWindow property card links", () => {
    it.each(LOCALES)(
      "links chatbot property cards to $prefix/properties/<slug|id> when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        localStorage.setItem(
          "chat_messages",
          JSON.stringify([
            {
              id: "msg-1",
              role: "bot",
              content: "Recommended properties:",
              timestamp: "2026-01-01T00:00:00Z",
              properties: [
                {
                  id: "p-1",
                  title: "Rhythm Asoke",
                  image: null,
                  price: 4500000,
                  rental_price: null,
                  original_price: null,
                  original_rental_price: null,
                  slug: "rhythm-asoke",
                },
                {
                  id: "p-2",
                  title: "No Slug Condo",
                  image: null,
                  price: null,
                  rental_price: 20000,
                  original_price: null,
                  original_rental_price: null,
                  slug: null,
                },
              ],
            },
          ])
        );

        render(<ChatWindow isOpen={true} onClose={vi.fn()} />);

        const rhythmLink = screen.getByRole("link", { name: /Rhythm Asoke/i });
        const noSlugLink = screen.getByRole("link", { name: /No Slug Condo/i });

        expect(rhythmLink).toHaveAttribute("href", `${prefix}/properties/rhythm-asoke`);
        expect(noSlugLink).toHaveAttribute("href", `${prefix}/properties/p-2`);
      }
    );
  });

  // 7. app/(public)/search/page.tsx: redirects with server locale prefix
  describe("7. SearchPage redirect", () => {
    it.each(LOCALES)(
      "redirects to $prefix/properties when server language=$language",
      async ({ language, prefix }) => {
        mockGetServerTranslations.mockResolvedValueOnce({ language, t: (k: string) => k });

        await SearchPage();

        expect(mockRedirect).toHaveBeenCalledWith(`${prefix}/properties`);
      }
    );
  });

  // 8. app/not-found.tsx: home & properties links preserve locale prefix
  describe("8. Root NotFound links", () => {
    it.each(LOCALES)(
      "links Home and Search Properties with $prefix when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        render(<NotFound />);

        const links = screen.getAllByRole("link");
        const hrefs = links.map((l) => l.getAttribute("href"));

        expect(hrefs).toContain(prefix || "/");
        expect(hrefs).toContain(`${prefix}/properties`);
      }
    );
  });

  // 9. app/error.tsx: home link preserves locale prefix (both inside & outside LanguageProvider)
  describe("9. Root Error home link", () => {
    it.each(LOCALES)(
      "links Home to $prefix (or /) when language=$language",
      ({ language, prefix }) => {
        setLocale(language, prefix);
        const err = Object.assign(new Error("Boom"), { digest: "test-digest" });

        render(<RootError error={err} reset={vi.fn()} />);

        const homeLink = screen.getByRole("link");
        expect(homeLink).toHaveAttribute("href", prefix || "/");
      }
    );

    it("falls back to URL pathname locale when useLanguage throws", () => {
      mockUseLanguageImpl.mockImplementationOnce(() => {
        throw new Error("Outside LanguageProvider");
      });
      window.history.pushState({}, "", "/en/some-broken-page");
      const err = Object.assign(new Error("Crash"), { digest: "fallback-digest" });

      render(<RootError error={err} reset={vi.fn()} />);

      const homeLink = screen.getByRole("link");
      expect(homeLink).toHaveAttribute("href", "/en");

      // Restore pathname
      window.history.pushState({}, "", "/");
    });
  });
});
