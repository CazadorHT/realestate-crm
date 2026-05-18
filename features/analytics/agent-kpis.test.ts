import { describe, it, expect } from 'vitest';
import { calculateAgentStats } from './agent-kpis';

describe('calculateAgentStats', () => {
  const mockAgents = [
    { id: 'agent-1', display_name: 'Agent One', email: 'one@test.com', avatar_url: null },
    { id: 'agent-2', display_name: 'Agent Two', email: 'two@test.com', avatar_url: null },
  ];

  const mockDeals = [
    { id: 'deal-1', agent_id: 'agent-1', total_amount: 1000, commission_total: 100, deal_type: 'SALE', status: 'CLOSED_WIN' },
    { id: 'deal-2', agent_id: 'agent-1', total_amount: 500, commission_total: 50, deal_type: 'RENT', status: 'CLOSED_WIN' },
    { id: 'deal-3', agent_id: 'agent-2', total_amount: 2000, commission_total: 200, deal_type: 'SALE', status: 'CLOSED_WIN' },
  ];

  const mockLeads = [
    { id: 'lead-1', assigned_to: 'agent-1' },
    { id: 'lead-2', assigned_to: 'agent-1' },
    { id: 'lead-3', assigned_to: 'agent-1' },
    { id: 'lead-4', assigned_to: 'agent-2' },
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
    const emptyAgent = [{ id: 'agent-none', display_name: 'None', email: 'none@test.com', avatar_url: null }];
    const stats = calculateAgentStats(emptyAgent, [], []);
    const agentNone = stats[0];

    expect(agentNone.totalDeals).toBe(0);
    expect(agentNone.totalRevenue).toBe(0);
    expect(agentNone.leadCount).toBe(0);
    expect(agentNone.conversionRate).toBe(0);
  });

  it('should handle null commission amounts', () => {
    const dealWithNull = [{ id: 'deal-null', agent_id: 'agent-1', total_amount: null, commission_total: null, deal_type: 'SALE', status: 'CLOSED_WIN' }];
    const stats = calculateAgentStats([{ id: 'agent-1', display_name: 'Agent One', email: 'one@test.com', avatar_url: null }], dealWithNull, []);
    expect(stats[0].totalRevenue).toBe(0);
  });
});
