import { describe, it, expect } from 'vitest';
import { calculateAgentStats } from './agent-kpis';

describe('calculateAgentStats', () => {
  const mockAgents = [
    { id: 'agent-1', full_name: 'Agent One', email: 'one@test.com', avatar_url: null },
    { id: 'agent-2', full_name: 'Agent Two', email: 'two@test.com', avatar_url: null },
  ];

  const mockDeals = [
    { created_by: 'agent-1', commission_amount: 1000, deal_type: 'SALE' },
    { created_by: 'agent-1', commission_amount: 500, deal_type: 'RENT' },
    { created_by: 'agent-2', commission_amount: 2000, deal_type: 'SALE' },
  ];

  const mockLeads = [
    { assigned_to: 'agent-1' },
    { assigned_to: 'agent-1' },
    { assigned_to: 'agent-1' },
    { assigned_to: 'agent-2' },
  ];

  it('should calculate stats correctly for agent-1', () => {
    const stats = calculateAgentStats(mockAgents, mockDeals, mockLeads);
    const agent1 = stats.find(s => s.agentId === 'agent-1');

    expect(agent1?.totalDeals).toBe(2);
    expect(agent1?.totalRevenue).toBe(1500);
    expect(agent1?.salesCount).toBe(1);
    expect(agent1?.rentCount).toBe(1);
    expect(agent1?.leadCount).toBe(3);
    // 2 deals / 3 leads = 66.7%
    expect(agent1?.conversionRate).toBe(66.7);
  });

  it('should calculate stats correctly for agent-2', () => {
    const stats = calculateAgentStats(mockAgents, mockDeals, mockLeads);
    const agent2 = stats.find(s => s.agentId === 'agent-2');

    expect(agent2?.totalDeals).toBe(1);
    expect(agent2?.totalRevenue).toBe(2000);
    expect(agent2?.salesCount).toBe(1);
    expect(agent2?.rentCount).toBe(0);
    expect(agent2?.leadCount).toBe(1);
    // 1 deal / 1 lead = 100%
    expect(agent2?.conversionRate).toBe(100);
  });

  it('should handle agents with no deals or leads', () => {
    const emptyAgent = [{ id: 'agent-none', full_name: 'None', email: 'none@test.com', avatar_url: null }];
    const stats = calculateAgentStats(emptyAgent, [], []);
    const agentNone = stats[0];

    expect(agentNone.totalDeals).toBe(0);
    expect(agentNone.totalRevenue).toBe(0);
    expect(agentNone.leadCount).toBe(0);
    expect(agentNone.conversionRate).toBe(0);
  });

  it('should handle null commission amounts', () => {
    const dealWithNull = [{ created_by: 'agent-1', commission_amount: null, deal_type: 'SALE' }];
    const stats = calculateAgentStats([{ id: 'agent-1' }], dealWithNull, []);
    expect(stats[0].totalRevenue).toBe(0);
  });
});
