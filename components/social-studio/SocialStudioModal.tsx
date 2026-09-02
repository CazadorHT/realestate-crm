"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import type { PlatformOverlayType } from "./PlatformUiOverlay";
import type { StudioLayout, StudioLanguage, SocialStudioProperty } from "./types";
import { formatTransitDisplay } from "./helpers";
import { useLanguage } from "@/lib/i18n/language-context";

// Custom Hooks
import { useSocialStudioState } from "./hooks/useSocialStudioState";
import { useStudioExport } from "./hooks/useStudioExport";

// Subcomponents
import { StudioPreviewPanel } from "./components/StudioPreviewPanel";
import { StudioLanguageBar } from "./components/StudioLanguageBar";
import { StudioLayoutControls } from "./components/StudioLayoutControls";
import { StudioCardCustomizer } from "./components/StudioCardCustomizer";
import { StudioFieldRouter } from "./components/StudioFieldRouter";
import { StudioContentEditor } from "./components/StudioContentEditor";
import { StudioAlbumPackager } from "./components/StudioAlbumPackager";
import { StudioShareDialog } from "./components/StudioShareDialog";
import { StudioCarouselPresets } from "./components/StudioCarouselPresets";
import { StudioPresetManager } from "./components/StudioPresetManager";

export type { SocialStudioProperty };

interface SocialStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SocialStudioProperty;
  onApplyCoverToPost?: (coverDataUrl: string) => void;
}

export function SocialStudioModal({
  isOpen,
  onClose,
  property,
  onApplyCoverToPost,
}: SocialStudioModalProps) {
  const { language: uiLang } = useLanguage();
  const isEn = uiLang === "en";

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<"style" | "layout" | "content" | "album">("style");
  const [platformOverlay, setPlatformOverlay] = useState<PlatformOverlayType>("none");

  // Property URL for sharing & QR
  const propertyUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/properties/${property.slug || property.id}`;
    }
    return "";
  }, [property.slug, property.id]);

  // Main Studio State Engine
  const state = useSocialStudioState({
    isOpen,
    property,
    initialLanguage: "th",
  });

  // Export & Share Engine
  const exp = useStudioExport({
    canvasRef: state.canvasRef,
    property,
    aspectRatio: state.aspectRatio,
    caption: state.caption,
    hashtags: state.hashtags,
    propertyUrl,
    imageUrls: state.imageUrls,
    isEn,
  });

  // Slot Image Handlers
  const handleSelectLayout = (newLayout: StudioLayout) => {
    state.setLayout(newLayout);
    const slotsCount =
      newLayout === "single"
        ? 1
        : newLayout === "split_two"
          ? 2
          : newLayout === "hero_plus_two"
            ? 3
            : newLayout === "four_grid"
              ? 4
              : newLayout === "five_grid"
                ? 5
                : 6;
    state.setSlotIndices((prev) => {
      const next = [...prev];
      while (next.length < slotsCount) {
        next.push(next.length % Math.max(state.imageUrls.length, 1));
      }
      return next.slice(0, slotsCount);
    });
  };

  const handleSelectSlotImage = (slotIdx: number, imgIdx: number) => {
    state.setSlotIndices((prev) => {
      const next = [...prev];
      next[slotIdx] = imgIdx;
      return next;
    });
  };

  const handleSelectImageForSlot = (imgIdx: number) => {
    handleSelectSlotImage(state.activeSlot, imgIdx);
  };

  const handleShuffleImages = () => {
    if (state.imageUrls.length <= 1) return;
    state.setSlotIndices((prev) => {
      return [...prev].map(() => Math.floor(Math.random() * state.imageUrls.length));
    });
    toast.success(isEn ? "Images randomized across layout! 🔀" : "สลับรูปภาพใน Layout แล้ว! 🔀");
  };

  const handleToggleBadge = (badgeLabel: string) => {
    state.setSelectedBadges((prev) => {
      if (prev.includes(badgeLabel)) {
        return prev.filter((b) => b !== badgeLabel);
      }
      if (prev.length >= 2) {
        toast.info(isEn ? "Maximum 2 stickers allowed." : "เลือกสติกเกอร์ได้สูงสุด 2 รายการครับ");
        return prev;
      }
      return [...prev, badgeLabel];
    });
  };

  const handleApplyCoverToPost = () => {
    const canvas = state.canvasRef.current;
    if (!canvas) return;
    const coverDataUrl = canvas.toDataURL("image/png", 1.0);
    if (onApplyCoverToPost) {
      onApplyCoverToPost(coverDataUrl);
      toast.success(
        isEn
          ? "Applied Social Studio cover to social post! 🖼️✨"
          : "นำภาพปก Social Studio ใส่ในโพสต์โซเชียลเรียบร้อยแล้ว! 🖼️✨"
      );
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="p-0! gap-0! bg-slate-900! border-slate-800! text-white rounded-3xl shadow-2xl max-w-[1380px]! w-[96vw]! h-[94vh]! max-h-[94vh]! block overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-white"
          style={{
            maxWidth: "1380px",
            width: "96vw",
            height: "94vh",
            maxHeight: "94vh",
            padding: 0,
            backgroundColor: "#0F172A",
            borderColor: "#1E293B",
          }}
        >
          <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
            {/* Header */}
            <div className="w-full px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                    AI Social Media Studio & Banner Generator
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px] uppercase font-mono">
                      Pro Multi-Layout
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-400">
                    {isEn
                      ? "Select layouts, arrange photos, add highlight stickers, and generate AI captions with 1-click"
                      : "เลือก Layouts จัดเรียงภาพ ใส่สติกเกอร์ไฮไลท์ และสร้างแคปชั่น AI ในคลิกเดียว"}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Body Split 50/50 */}
            <div
              className="w-full flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-900"
              style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%" }}
            >
              {/* Left Column: Live Canvas Preview & Action Dock */}
              <StudioPreviewPanel
                canvasRef={state.canvasRef}
                aspectRatio={state.aspectRatio}
                isRendering={state.isRendering}
                platformOverlay={platformOverlay}
                setPlatformOverlay={setPlatformOverlay}
                agentFullName={property.assigned_agent?.full_name}
                selectedAlbumCount={exp.selectedAlbumIndices.length > 0 ? exp.selectedAlbumIndices.length : state.imageUrls.length}
                isExportingAlbum={exp.isExportingAlbum}
                isSharingAlbum={exp.isSharingAlbum}
                copiedImage={exp.copiedImage}
                onDownloadAlbumZip={exp.handleDownloadAlbumZip}
                onShareAlbum={exp.handleShareAlbum}
                onDownloadSingle={exp.handleDownloadSingle}
                onCopyImage={exp.handleCopyImage}
                onApplyCoverToPost={onApplyCoverToPost ? handleApplyCoverToPost : undefined}
                textEffectXOffset={state.textEffectXOffset}
                setTextEffectXOffset={state.setTextEffectXOffset}
                textEffectYOffset={state.textEffectYOffset}
                setTextEffectYOffset={state.setTextEffectYOffset}
                calloutPointers={state.calloutPointers}
                onUpdateCallout={state.updateCalloutPointer}
                customTexts={state.customTexts}
                onUpdateCustomText={state.updateCustomText}
              />

              {/* Right Column: Modular Studio Controls */}
              <div
                className="w-full md:w-1/2 p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 bg-slate-900 flex-1"
                style={{ width: "50%" }}
              >
                {/* Tab Navigation Header */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 sticky top-0 z-20 backdrop-blur-md shadow-md">
                  {[
                    { id: "layout", label: isEn ? "🎨 Layout" : "🎨 รูปแบบ", sub: "Layout & Theme" },
                    { id: "style", label: isEn ? "🎛️ Style" : "🎛️ สไตล์", sub: "Card & Scrim" },
                    { id: "content", label: isEn ? "📝 Content" : "📝 ข้อความ", sub: "Text & AI" },
                    { id: "album", label: isEn ? "📑 Album" : "📑 ชุดภาพ", sub: "Carousel & Zip" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 rounded-xl text-center flex flex-col items-center transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-amber-500 text-slate-950 font-bold shadow-xs scale-102"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium"
                      }`}
                    >
                      <span className="text-xs">{tab.label}</span>
                      <span className="text-[9px] opacity-70 hidden sm:inline">{tab.sub}</span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: Layout & Theme */}
                {activeTab === "layout" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <StudioPresetManager
                      availablePresets={state.presets}
                      isLoading={state.isLoadingPresets}
                      onApplyPreset={state.handleApplyPreset}
                      onSavePreset={state.handleSavePreset}
                    />

                    <StudioLanguageBar
                      language={state.language}
                      onLanguageChange={state.handleLanguageChange}
                    />

                    <StudioLayoutControls
                      layout={state.layout}
                      setLayout={handleSelectLayout}
                      imageUrls={state.imageUrls}
                      activeSlot={state.activeSlot}
                      setActiveSlot={state.setActiveSlot}
                      slotIndices={state.slotIndices}
                      onSelectImageForSlot={handleSelectImageForSlot}
                      onShuffleImages={handleShuffleImages}
                      aspectRatio={state.aspectRatio}
                      setAspectRatio={state.setAspectRatio}
                      theme={state.theme}
                      setTheme={state.setTheme}
                      customAccentColor={state.customAccentColor}
                      setCustomAccentColor={state.setCustomAccentColor}
                      fontSizeScale={state.fontSizeScale}
                      setFontSizeScale={state.setFontSizeScale}
                      priceFontSizeScale={state.priceFontSizeScale}
                      setPriceFontSizeScale={state.setPriceFontSizeScale}
                      contentPosition={state.contentPosition}
                      setContentPosition={state.setContentPosition}
                      photoFilter={state.photoFilter}
                      setPhotoFilter={state.setPhotoFilter}
                      bgDimOpacity={state.bgDimOpacity}
                      setBgDimOpacity={state.setBgDimOpacity}
                      gridLineWidth={state.gridLineWidth}
                      setGridLineWidth={state.setGridLineWidth}
                      gridLineColor={state.gridLineColor}
                      setGridLineColor={state.setGridLineColor}
                    />
                  </div>
                )}

                {/* TAB 2: Card & Scrim Styling */}
                {activeTab === "style" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <StudioCardCustomizer
                      cardHeightPercent={state.cardHeightPercent}
                      setCardHeightPercent={state.setCardHeightPercent}
                      cardWidthPercent={state.cardWidthPercent}
                      setCardWidthPercent={state.setCardWidthPercent}
                      cardTextAlign={state.cardTextAlign}
                      setCardTextAlign={state.setCardTextAlign}
                      cardOpacity={state.cardOpacity}
                      setCardOpacity={state.setCardOpacity}
                      scrimOpacity={state.scrimOpacity}
                      setScrimOpacity={state.setScrimOpacity}
                      topScrimOpacity={state.topScrimOpacity}
                      setTopScrimOpacity={state.setTopScrimOpacity}
                      bottomScrimOpacity={state.bottomScrimOpacity}
                      setBottomScrimOpacity={state.setBottomScrimOpacity}
                      cardBackground={state.cardBackground}
                      setCardBackground={state.setCardBackground}
                      showBrandingHeader={state.showBrandingHeader}
                      setShowBrandingHeader={state.setShowBrandingHeader}
                      showTopListingBadge={state.showTopListingBadge}
                      setShowTopListingBadge={state.setShowTopListingBadge}
                      headerFontSizeScale={state.headerFontSizeScale}
                      setHeaderFontSizeScale={state.setHeaderFontSizeScale}
                      badgeFontSizeScale={state.badgeFontSizeScale}
                      setBadgeFontSizeScale={state.setBadgeFontSizeScale}
                      headerYOffset={state.headerYOffset}
                      setHeaderYOffset={state.setHeaderYOffset}
                      contentPosition={state.contentPosition}
                      cardYOffset={state.cardYOffset}
                      setCardYOffset={state.setCardYOffset}
                      card1YOffset={state.card1YOffset}
                      setCard1YOffset={state.setCard1YOffset}
                      card2YOffset={state.card2YOffset}
                      setCard2YOffset={state.setCard2YOffset}
                      cardRightMargin={state.cardRightMargin}
                      setCardRightMargin={state.setCardRightMargin}
                      customCardBgColor={state.customCardBgColor}
                      setCustomCardBgColor={state.setCustomCardBgColor}
                      customCanvasBgColor={state.customCanvasBgColor}
                      setCustomCanvasBgColor={state.setCustomCanvasBgColor}
                      customListingBadgeBgColor={state.customListingBadgeBgColor}
                      setCustomListingBadgeBgColor={state.setCustomListingBadgeBgColor}
                      customListingBadgeTextColor={state.customListingBadgeTextColor}
                      setCustomListingBadgeTextColor={state.setCustomListingBadgeTextColor}
                      showCardContent={state.showCardContent}
                      setShowCardContent={state.setShowCardContent}
                    />
                  </div>
                )}

                {/* TAB 3: Text & AI Content */}
                {activeTab === "content" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <StudioContentEditor
                      language={state.language}
                      selectedBadges={state.selectedBadges}
                      onToggleBadge={handleToggleBadge}
                      customProjectName={state.customProjectName}
                      setCustomProjectName={state.setCustomProjectName}
                      customTitle={state.customTitle}
                      setCustomTitle={state.setCustomTitle}
                      customTransitText={state.customTransitText}
                      setCustomTransitText={state.setCustomTransitText}
                      defaultTransitPlaceholder={
                        formatTransitDisplay(
                          property.transit_station_name,
                          property.transit_type,
                          property.transit_distance_meters,
                          state.language,
                          {
                            en: property.transit_station_name_en,
                            cn: property.transit_station_name_cn,
                            ru: property.transit_station_name_ru,
                          }
                        ) || ""
                      }
                      headline={state.headline}
                      setHeadline={state.setHeadline}
                      isGeneratingAI={state.isGeneratingAI}
                      onFetchAIContent={() => state.fetchAIContent()}
                      showQrCode={state.showQrCode}
                      setShowQrCode={state.setShowQrCode}
                      showContact={state.showContact}
                      setShowContact={state.setShowContact}
                      showAgentAvatar={state.showAgentAvatar}
                      setShowAgentAvatar={state.setShowAgentAvatar}
                      caption={state.caption}
                      setCaption={state.setCaption}
                      hashtags={state.hashtags}
                      copiedCaption={exp.copiedCaption}
                      onCopyCaption={exp.handleCopyCaption}
                      promoText={state.promoText}
                      setPromoText={state.setPromoText}
                      promoPosition={state.promoPosition}
                      setPromoPosition={state.setPromoPosition}
                      promoColor={state.promoColor}
                      setPromoColor={state.setPromoColor}
                      promoTextColor={state.promoTextColor}
                      setPromoTextColor={state.setPromoTextColor}
                      customTitleColor={state.customTitleColor}
                      setCustomTitleColor={state.setCustomTitleColor}
                      customPriceColor={state.customPriceColor}
                      setCustomPriceColor={state.setCustomPriceColor}
                      customHeadlineColor={state.customHeadlineColor}
                      setCustomHeadlineColor={state.setCustomHeadlineColor}
                      customProjectNameColor={state.customProjectNameColor}
                      setCustomProjectNameColor={state.setCustomProjectNameColor}
                      textEffectTemplate={state.textEffectTemplate}
                      setTextEffectTemplate={state.setTextEffectTemplate}
                      textEffectText={state.textEffectText}
                      setTextEffectText={state.setTextEffectText}
                      textEffectPosition={state.textEffectPosition}
                      setTextEffectPosition={state.setTextEffectPosition}
                      textEffectSize={state.textEffectSize}
                      setTextEffectSize={state.setTextEffectSize}
                      textEffectXOffset={state.textEffectXOffset}
                      setTextEffectXOffset={state.setTextEffectXOffset}
                      textEffectYOffset={state.textEffectYOffset}
                      setTextEffectYOffset={state.setTextEffectYOffset}
                      textEffectRotation={state.textEffectRotation}
                      setTextEffectRotation={state.setTextEffectRotation}
                      textEffectCurve={state.textEffectCurve}
                      setTextEffectCurve={state.setTextEffectCurve}
                      textEffectCustomTextColor={state.textEffectCustomTextColor}
                      setTextEffectCustomTextColor={state.setTextEffectCustomTextColor}
                      textEffectCustomBgColor={state.textEffectCustomBgColor}
                      setTextEffectCustomBgColor={state.setTextEffectCustomBgColor}
                      textEffectCustomBorderColor={state.textEffectCustomBorderColor}
                      setTextEffectCustomBorderColor={state.setTextEffectCustomBorderColor}
                      textEffectCustomShadowColor={state.textEffectCustomShadowColor}
                      setTextEffectCustomShadowColor={state.setTextEffectCustomShadowColor}
                      textEffectCustomBgAlpha={state.textEffectCustomBgAlpha}
                      setTextEffectCustomBgAlpha={state.setTextEffectCustomBgAlpha}
                      textEffectCustomBorderWidth={state.textEffectCustomBorderWidth}
                      setTextEffectCustomBorderWidth={state.setTextEffectCustomBorderWidth}
                      calloutPointers={state.calloutPointers}
                      onAddCallout={state.addCalloutPointer}
                      onUpdateCallout={state.updateCalloutPointer}
                      onRemoveCallout={state.removeCalloutPointer}
                      customTexts={state.customTexts}
                      onAddCustomText={state.addCustomText}
                      onUpdateCustomText={state.updateCustomText}
                      onRemoveCustomText={state.removeCustomText}
                      priceText={state.priceDisplay}
                      showCardContent={state.showCardContent}
                    />

                    <StudioFieldRouter
                      contentPosition={state.contentPosition}
                      zoneMapping={state.zoneMapping}
                      setZoneMapping={state.setZoneMapping}
                      showLocation={state.showLocation}
                      setShowLocation={state.setShowLocation}
                      showProjectName={state.showProjectName}
                      setShowProjectName={state.setShowProjectName}
                      showListingType={state.showListingType}
                      setShowListingType={state.setShowListingType}
                      showTitle={state.showTitle}
                      setShowTitle={state.setShowTitle}
                      showSpecs={state.showSpecs}
                      setShowSpecs={state.setShowSpecs}
                      specFontSizeScale={state.specFontSizeScale}
                      setSpecFontSizeScale={state.setSpecFontSizeScale}
                      showPrice={state.showPrice}
                      setShowPrice={state.setShowPrice}
                      priceFormatStyle={state.priceFormatStyle}
                      setPriceFormatStyle={state.setPriceFormatStyle}
                      showOriginalPrice={state.showOriginalPrice}
                      setShowOriginalPrice={state.setShowOriginalPrice}
                      showHeadline={state.showHeadline}
                      setShowHeadline={state.setShowHeadline}
                      showContact={state.showContact}
                      setShowContact={state.setShowContact}
                      showQrCode={state.showQrCode}
                      setShowQrCode={state.setShowQrCode}
                      hasOriginalPrice={Boolean(property.original_price || property.original_rental_price)}
                      showCardContent={state.showCardContent}
                      setShowCardContent={state.setShowCardContent}
                    />
                  </div>
                )}

                {/* TAB 4: Album & Carousel */}
                {activeTab === "album" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <StudioCarouselPresets
                      carouselPages={state.carouselPages}
                      setCarouselPages={state.setCarouselPages}
                      activeCarouselPage={state.activeCarouselPage}
                      setActiveCarouselPage={state.setActiveCarouselPage}
                    />

                    <StudioAlbumPackager
                      imageUrls={state.imageUrls}
                      selectedAlbumIndices={exp.selectedAlbumIndices}
                      onToggleAlbumImage={exp.handleToggleAlbumImage}
                      onSelectAllAlbumImages={exp.handleSelectAllAlbumImages}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Share Pack Modal Dialog */}
      <StudioShareDialog
        isOpen={exp.isShareDialogOpen}
        onClose={() => exp.setIsShareDialogOpen(false)}
        coverImageUrl={exp.shareCoverImageUrl}
        coverFile={exp.shareCoverFile}
        propertyTitle={state.customTitle || property.title}
        caption={state.caption}
        hashtags={state.hashtags}
        propertyUrl={propertyUrl}
        onDownloadAlbumZip={exp.handleDownloadAlbumZip}
      />
    </>
  );
}
