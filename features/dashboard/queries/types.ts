
import { ListingType, PropertyType } from "@/features/properties/labels";

export type DashboardStats = {
  revenueThisMonth: number;
  revenueChange: string;
  leadsThisMonth: number;
  leadsChange: string;
  leadsTotal: number;
  conversionRate: number;
  conversionChange: string;
  conversionBase: string;
  dealsWon: number;
  dealsWonChange: string;
  dealsTarget: number;
  totalCommission: number;
};

export type TopAgent = {
  id: string;
  name: string;
  avatar_url: string | null;
  deals_count: number;
  total_commission: number;
  branch_name?: string | null;
  team_name?: string | null;
};

export type RevenueChartData = {
  name: string;
  total: number;
};

export type FunnelData = {
  step: string;
  count: number;
  fill: string;
};

export type PipelineData = {
  stage: string;
  count: number;
  color: string;
  label: string;
};

export type MarketingPerformanceData = {
  source: string;
  leadCount: number;
  avgAiScore: number;
  hotLeadCount: number;
};

export type Notification = {
  id: string | number;
  message: string;
  type: "info" | "warning" | "alert" | "success";
  time: string;
  read: boolean;
  href?: string;
  createdAt?: number;
  category?: string;
};

export type AgendaEvent = {
  id: string | number;
  time: string;
  title: string;
  type: "meeting" | "call" | "task" | "deadline";
  priority: "high" | "medium" | "low";
};

export type FollowUpLead = {
  id: string;
  name: string;
  daysQuiet: number;
  stage: string;
};

export type RiskDeal = {
  id: string;
  title: string;
  daysInStage: number;
  stage: string;
};

export type PropertyAnalytics = {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number | null;
  rental_price: number | null;
  property_images: { image_url: string; is_cover: boolean }[];
};

export type AreaAnalytics = {
  name: string;
  view_count: number;
  leads_count: number;
};

export type DistributionData = {
  label: string;
  value: number;
};

export type ViewsTrendData = {
  date: string;
  views: number;
};

export type AgentPerformanceData = {
  name: string;
  leads_count: number;
  deals_count: number;
};

export interface AnalyticsResult {
  topProperties: PropertyAnalytics[];
  topPropertiesCount: number;
  topAreas: AreaAnalytics[];
  totalViews: number;
  listingTypeDistribution: DistributionData[];
  propertyTypeDistribution: DistributionData[];
  viewsTrend: ViewsTrendData[];
  agentPerformance: AgentPerformanceData[];
  funnel: {
    views: number;
    leads: number;
    deals: number;
  };
  error?: string | null;
}
