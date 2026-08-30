const fs = require('fs');
let content = fs.readFileSync('components/social-studio/SocialStudioModal.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  'import { StudioCarouselPresets } from "./components/StudioCarouselPresets";',
  'import { StudioCarouselPresets } from "./components/StudioCarouselPresets";\nimport { StudioPresetManager } from "./components/StudioPresetManager";\nimport { getSocialStudioPresets, saveSocialStudioPreset } from "@/features/properties/actions/social-presets";\nimport type { SocialStudioPresetConfig } from "./types";'
);

// 2. Add state inside component
content = content.replace(
  'const [shareCoverImageUrl, setShareCoverImageUrl] = useState<string | null>(null);',
  'const [shareCoverImageUrl, setShareCoverImageUrl] = useState<string | null>(null);\n  const [presets, setPresets] = useState<Record<string, SocialStudioPresetConfig>>({});\n  const [isLoadingPresets, setIsLoadingPresets] = useState(true);'
);

// 3. Add useEffect and Handlers
const presetLogic = `

  // ---- Preset Logic ----
  useEffect(() => {
    if (isOpen) {
      setIsLoadingPresets(true);
      getSocialStudioPresets().then((data) => {
        setPresets(data || {});
        setIsLoadingPresets(false);
      });
    }
  }, [isOpen]);

  const handleApplyPreset = (key: string) => {
    const config = presets[key];
    if (!config) return;
    
    setAspectRatio(config.aspectRatio ?? aspectRatio);
    setTheme(config.theme ?? theme);
    setLayout(config.layout ?? layout);
    setContentPosition(config.contentPosition ?? contentPosition);
    setFontSizeScale(config.fontSizeScale ?? fontSizeScale);
    setSpecFontSizeScale(config.specFontSizeScale ?? specFontSizeScale);
    if (config.zoneMapping) setZoneMapping(config.zoneMapping);
    setCard1YOffset(config.card1YOffset ?? card1YOffset);
    setCard2YOffset(config.card2YOffset ?? card2YOffset);
    setCardHeightPercent(config.cardHeightPercent ?? cardHeightPercent);
    setCardWidthPercent(config.cardWidthPercent ?? cardWidthPercent);
    setCardTextAlign(config.cardTextAlign ?? cardTextAlign);
    setCardOpacity(config.cardOpacity ?? cardOpacity);
    setScrimOpacity(config.scrimOpacity ?? scrimOpacity);
    setTopScrimOpacity(config.topScrimOpacity ?? topScrimOpacity);
    setBottomScrimOpacity(config.bottomScrimOpacity ?? bottomScrimOpacity);
    setPriceFormatStyle(config.priceFormatStyle ?? priceFormatStyle);
    setCardBackground(config.cardBackground ?? cardBackground);
    setCardYOffset(config.cardYOffset ?? cardYOffset);
    setCustomAccentColor(config.customAccentColor ?? customAccentColor);
    setPromoPosition(config.promoPosition ?? promoPosition);
    setPromoColor(config.promoColor ?? promoColor);
    setPromoTextColor(config.promoTextColor ?? promoTextColor);
    setPhotoFilter(config.photoFilter ?? photoFilter);
    setGridLineWidth(config.gridLineWidth ?? gridLineWidth);
    setGridLineColor(config.gridLineColor ?? gridLineColor);
    setCustomTitleColor(config.customTitleColor ?? customTitleColor);
    setCustomPriceColor(config.customPriceColor ?? customPriceColor);
    setCustomHeadlineColor(config.customHeadlineColor ?? customHeadlineColor);
    setCustomProjectNameColor(config.customProjectNameColor ?? customProjectNameColor);
    setCustomCardBgColor(config.customCardBgColor ?? customCardBgColor);
    setCustomCanvasBgColor(config.customCanvasBgColor ?? customCanvasBgColor);
    setCustomListingBadgeBgColor(config.customListingBadgeBgColor ?? customListingBadgeBgColor);
    setCustomListingBadgeTextColor(config.customListingBadgeTextColor ?? customListingBadgeTextColor);
    setShowBrandingHeader(config.showBrandingHeader ?? showBrandingHeader);
    setShowTopListingBadge(config.showTopListingBadge ?? showTopListingBadge);
    setHeaderFontSizeScale(config.headerFontSizeScale ?? headerFontSizeScale);
    setBadgeFontSizeScale(config.badgeFontSizeScale ?? badgeFontSizeScale);
    setHeaderYOffset(config.headerYOffset ?? headerYOffset);
    setCardRightMargin(config.cardRightMargin ?? cardRightMargin);
    setShowHeadline(config.showHeadline ?? showHeadline);

    toast.success(\`Applied Custom \${key.split("_")[1]} preset!\`);
  };

  const handleSavePreset = async (key: string) => {
    const config: SocialStudioPresetConfig = {
      aspectRatio, theme, layout, contentPosition, fontSizeScale, specFontSizeScale, zoneMapping,
      card1YOffset, card2YOffset, cardHeightPercent, cardWidthPercent, cardTextAlign, cardOpacity, scrimOpacity,
      topScrimOpacity, bottomScrimOpacity, priceFormatStyle, cardBackground, cardYOffset, customAccentColor,
      promoPosition, promoColor, promoTextColor, photoFilter, gridLineWidth, gridLineColor, customTitleColor,
      customPriceColor, customHeadlineColor, customProjectNameColor, customCardBgColor, customCanvasBgColor,
      customListingBadgeBgColor, customListingBadgeTextColor, showBrandingHeader, showTopListingBadge,
      headerFontSizeScale, badgeFontSizeScale, headerYOffset, cardRightMargin, showHeadline
    };

    const res = await saveSocialStudioPreset(key, config);
    if (res.success) {
      setPresets((prev) => ({ ...prev, [key]: config }));
      toast.success(\`Saved as Custom \${key.split("_")[1]} preset!\`);
    } else {
      toast.error(\`Failed to save preset: \${res.error}\`);
    }
  };
  
`;

content = content.replace(
  '// Ensure active slot is valid for layout',
  presetLogic + '\n  // Ensure active slot is valid for layout'
);

// 4. Render StudioPresetManager
content = content.replace(
  '<StudioLanguageBar',
  '<StudioPresetManager\n                    availablePresets={presets}\n                    isLoading={isLoadingPresets}\n                    onApplyPreset={handleApplyPreset}\n                    onSavePreset={handleSavePreset}\n                  />\n\n                  <StudioLanguageBar'
);

fs.writeFileSync('components/social-studio/SocialStudioModal.tsx', content);
console.log("Patched SocialStudioModal.tsx");
