with open('features/finance/actions.ts', 'r') as f:
    code = f.read()

code = code.replace('wht_amount', 'tax_amount')
code = code.replace('agent:profiles!deal_commissions_agent_id_fkey', 'recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey')
code = code.replace('co_broker:co_brokers!deal_commissions_co_broker_id_fkey', 'co_broker:identities_v3!crm_deal_commissions_v3_recipient_id_fkey')

with open('features/finance/actions.ts', 'w') as f:
    f.write(code)
