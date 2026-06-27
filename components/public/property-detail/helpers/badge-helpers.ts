export function getUnitSpecialFeatures(property: any, t: (key: string) => string) {
  return [
    property.is_hot_deal && {
      name: t("property.badges.hot_deal"),
      icon: "flame",
    },
    property.verified && {
      name: t("property.badges.verified"),
      icon: "check-circle",
    },
    property.is_exclusive && {
      name: t("property.badges.exclusive"),
      icon: "shield-check",
    },
    property.is_cbd && { name: t("property.badges.cbd"), icon: "navigation" },
    (property.near_transit ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("ทำเลดี เดินทางสะดวก")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("ทำเลดี เดินทางสะดวก"))) && {
      name: t("property.badges.good_location"),
      icon: "map-pin",
    },
    (!property.is_bare_shell ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("พร้อมเข้าอยู่")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("พร้อมเข้าอยู่"))) && {
      name: t("property.badges.ready_to_move"),
      icon: "check-circle-2",
    },
    property.is_never_lived_in && {
      name: t("property.badges.new_listing"),
      icon: "zap",
    },
    property.is_smart_home && {
      name: t("property.badges.smart_home"),
      icon: "cpu",
    },
    property.is_high_ceiling && {
      name: t("property.badges.high_ceiling"),
      icon: "move-up",
    },
    property.has_private_elevator && {
      name: t("property.badges.private_elevator"),
      icon: "arrow-up-circle",
    },
    property.is_high_floor && {
      name: t("property.badges.high_floor"),
      icon: "building-2",
    },
    property.is_pet_friendly && {
      name: t("property.badges.pet_friendly"),
      icon: "paw-print",
    },
    property.is_handicapped_friendly && {
      name: t("property.badges.accessible"),
      icon: "accessibility",
    },
    ((property.bedrooms || 0) >= 2 ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("เหมาะสำหรับครอบครัว")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("เหมาะสำหรับครอบครัว"))) && {
      name: t("property.badges.family_friendly"),
      icon: "users",
    },
    property.is_foreigner_quota && {
      name: t("property.badges.foreigner_quota"),
      icon: "globe",
    },
    property.is_renovated && {
      name: t("property.badges.renovated"),
      icon: "sparkles",
    },
    property.is_corner_unit && {
      name: t("property.badges.corner_unit"),
      icon: "layout-dashboard",
    },
    property.is_fully_furnished && {
      name: t("property.badges.fully_furnished"),
      icon: "package-check",
    },
    property.has_private_pool && {
      name: t("property.badges.private_pool"),
      icon: "waves",
    },
    property.is_selling_with_tenant && {
      name: t("property.badges.investment_ready"),
      icon: "star",
    },
    property.has_river_view && {
      name: t("property.badges.river_view"),
      icon: "sunset",
    },
    property.has_city_view && {
      name: t("property.badges.city_view"),
      icon: "building-2",
    },
    property.has_garden_view && {
      name: t("property.badges.garden_view"),
      icon: "leaf",
    },
    property.has_unblocked_view && {
      name: t("property.badges.unblocked_view"),
      icon: "eye",
    },
    property.allow_smoking && {
      name: t("property.badges.allow_smoking"),
      icon: "cigarette",
    },
    property.allow_airbnb && {
      name: t("property.badges.allow_airbnb"),
      icon: "airbnb",
    },
    property.is_column_free && {
      name: t("property.badges.column_free"),
      icon: "maximize",
    },
    property.is_bare_shell && {
      name: t("property.badges.bare_shell"),
      icon: "box",
    },
    property.is_grade_a && { name: t("property.badges.grade_a"), icon: "star" },
    property.is_tax_registered && {
      name: t("property.badges.tax_registered"),
      icon: "shield-check",
    },
    property.has_pool_view && {
      name: t("property.badges.pool_view"),
      icon: "waves",
    },
    property.facing_east && {
      name: t("property.badges.facing_east"),
      icon: "compass",
    },
    property.facing_north && {
      name: t("property.badges.facing_north"),
      icon: "compass",
    },
    property.facing_south && {
      name: t("property.badges.facing_south"),
      icon: "wind",
    },
    property.facing_west && {
      name: t("property.badges.facing_west"),
      icon: "sunset",
    },
    property.is_grade_b && {
      name: t("property.badges.grade_b"),
      icon: "medal",
    },
    property.is_grade_c && {
      name: t("property.badges.grade_c"),
      icon: "medal",
    },
    property.has_raised_floor && {
      name: t("property.badges.raised_floor"),
      icon: "layers",
    },
    property.is_central_air && {
      name: t("property.badges.central_air"),
      icon: "wind",
    },
    property.is_split_air && {
      name: t("property.badges.split_air"),
      icon: "wind",
    },
    property.has_247_access && {
      name: t("property.badges.access_247"),
      icon: "check-circle-2",
    },
    property.has_fiber_optic && {
      name: t("property.badges.fiber_optic"),
      icon: "wifi",
    },
    property.has_multi_parking && {
      name: t("property.badges.multi_parking"),
      icon: "check-circle-2",
    },
    property.is_green_building && {
      name: t("property.badges.green_building"),
      icon: "leaf",
    },
    property.has_flexible_lease && {
      name: t("property.badges.flexible_lease"),
      icon: "calendar-range",
    },
    property.is_fully_fitted && {
      name: t("property.badges.fully_fitted"),
      icon: "layout",
    },
  ].filter((f): f is { name: string; icon: string } => !!f);
}
