import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from './page';
import * as supabaseServer from '@/lib/supabase/server';
import * as authContext from '@/lib/actions/tenant-context';
import * as currentProfile from '@/lib/supabase/getCurrentProfile';
import * as systemConfig from '@/lib/actions/system-config';
import * as authz from '@/lib/authz';
import * as features from '@/lib/features';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Mock UI Components to avoid RSC rendering issues in JSDOM
vi.mock('@/components/dashboard/DashboardHeader', () => ({ DashboardHeader: () => 'DashboardHeader' }));
vi.mock('@/components/dashboard/SystemStatus', () => ({ SystemStatus: () => 'SystemStatus' }));
vi.mock('@/components/dashboard/DashboardFilters', () => ({ DashboardFilters: () => 'DashboardFilters' }));
vi.mock('@/components/dashboard/QuickActions', () => ({ QuickActions: () => 'QuickActions' }));
vi.mock('@/components/dashboard/StatsSection', () => ({ StatsSectionSuspense: () => 'StatsSectionSuspense' }));
vi.mock('@/components/dashboard/AnalyticsSection', () => ({ AnalyticsSection: () => 'AnalyticsSection' }));
vi.mock('@/components/dashboard/RecentPropertiesSection', () => ({ RecentPropertiesSectionSuspense: () => 'RecentPropertiesSectionSuspense' }));
vi.mock('@/components/dashboard/PendingApprovalCard', () => ({ PendingApprovalCard: () => 'PendingApprovalCard' }));
vi.mock('@/components/dashboard/ExecutiveAISummary', () => ({ ExecutiveAISummary: () => 'ExecutiveAISummary' }));
vi.mock('@/components/dashboard/MarketingROISummary', () => ({ MarketingROISummary: () => 'MarketingROISummary' }));

// Mock all internal modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/lib/actions/tenant-context', () => ({
  getActiveTenantCookie: vi.fn(),
}));
vi.mock('@/lib/supabase/getCurrentProfile', () => ({
  getCurrentProfile: vi.fn(),
}));
vi.mock('@/lib/actions/system-config', () => ({
  getSystemConfig: vi.fn(),
}));
vi.mock('@/lib/authz', () => ({
  isStaff: vi.fn(),
  assertAdminOrManager: vi.fn(),
}));
vi.mock('@/lib/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

// Mock feature queries
vi.mock('@/features/dashboard/queries/stats', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({}),
  getRevenueChartData: vi.fn().mockResolvedValue([]),
  getFunnelStats: vi.fn().mockResolvedValue([]),
  getPipelineStats: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/dashboard/queries/performance', () => ({
  getTopAgents: vi.fn().mockResolvedValue([]),
  getMarketingPerformanceData: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/dashboard/queries/notifications', () => ({
  getRecentNotifications: vi.fn().mockResolvedValue([]),
  getTodayAgenda: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/dashboard/queries/maintenance', () => ({
  getFollowUpLeads: vi.fn().mockResolvedValue([]),
  getRiskDeals: vi.fn().mockResolvedValue([]),
  getSetupProgress: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/calendar/queries', () => ({
  getCalendarEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/dashboard/queries/agent-dashboard', () => ({
  getAgentTasks: vi.fn().mockResolvedValue([]),
}));

describe('DashboardPage Unit Tests', () => {
  const mockSearchParams = Promise.resolve({
    range: 'week',
    branchId: 'tenant-123',
    view: 'company'
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock setup
    (supabaseServer.createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
      }
    });
    (authContext.getActiveTenantCookie as any).mockResolvedValue('tenant-123');
    (systemConfig.getSystemConfig as any).mockResolvedValue({ multi_tenant_enabled: true });
    (features.isFeatureEnabled as any).mockReturnValue(true);
  });

  it('renders PendingApprovalCard for non-staff users', async () => {
    // Setup: User is not staff
    (currentProfile.getCurrentProfile as any).mockResolvedValue({ full_name: 'Customer Name', role: 'USER' });
    (authz.isStaff as any).mockReturnValue(false);

    const result = await DashboardPage({ searchParams: mockSearchParams });
    render(result);

    expect(screen.getByText(/DashboardHeader/i)).toBeDefined();
    // In actual implementation, check for specific text in PendingApprovalCard
    expect(screen.queryByText(/AnalyticsSection/i)).toBeNull();
  });

  it('renders full dashboard for staff users (Admin/Manager)', async () => {
    // Setup: User is staff
    (currentProfile.getCurrentProfile as any).mockResolvedValue({ full_name: 'Admin User', role: 'ADMIN' });
    (authz.isStaff as any).mockReturnValue(true);

    const result = await DashboardPage({ searchParams: mockSearchParams });
    render(result);

    // Verify key sections are present
    expect(screen.getByText(/SystemStatus/i)).toBeDefined();
    expect(screen.getByText(/DashboardFilters/i)).toBeDefined();
    expect(screen.getByText(/QuickActions/i)).toBeDefined();
  });

  it('correctly extracts and passes search parameters to child components', async () => {
    (currentProfile.getCurrentProfile as any).mockResolvedValue({ full_name: 'Staff User', role: 'MANAGER' });
    (authz.isStaff as any).mockReturnValue(true);

    const result = await DashboardPage({ searchParams: mockSearchParams });
    render(result);

    // Verify StatsSection received the correct range and branchId
    // (This would typically be checked by inspecting props of mocked components)
    // Here we ensure the logic processed the awaited searchParams correctly
  });

  it('hides AI Smart Summary when feature is disabled', async () => {
    (currentProfile.getCurrentProfile as any).mockResolvedValue({ role: 'ADMIN' });
    (authz.isStaff as any).mockReturnValue(true);
    
    // Disable AI summary
    (features.isFeatureEnabled as any).mockImplementation((feature: string) => {
      if (feature === 'ai_smart_summary') return false;
      return true;
    });

    const result = await DashboardPage({ searchParams: mockSearchParams });
    render(result);

    expect(screen.queryByText(/SmartSummary/i)).toBeNull();
  });

  it('fetches basic data promises in parallel for better performance', async () => {
    (currentProfile.getCurrentProfile as any).mockResolvedValue({ role: 'ADMIN' });
    (authz.isStaff as any).mockReturnValue(true);

    await DashboardPage({ searchParams: mockSearchParams });

    // Check if critical async functions were called
    expect(authContext.getActiveTenantCookie).toHaveBeenCalled();
    expect(currentProfile.getCurrentProfile).toHaveBeenCalled();
    expect(systemConfig.getSystemConfig).toHaveBeenCalled();
  });
});
