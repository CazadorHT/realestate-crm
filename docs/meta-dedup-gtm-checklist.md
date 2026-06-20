# Meta Dedup GTM Checklist

This project already generates and forwards a shared `event_id` from the app for key Meta flows.

App-side sources:
- [components/providers/GTMPropertyPageView.tsx](../components/providers/GTMPropertyPageView.tsx)
- [components/public/ContactForm.tsx](../components/public/ContactForm.tsx)
- [components/public/ContactAgentDialog.tsx](../components/public/ContactAgentDialog.tsx)
- [components/public/deposit/DepositWizard.tsx](../components/public/deposit/DepositWizard.tsx)
- [components/public/smart-match/LeadForm.tsx](../components/public/smart-match/LeadForm.tsx)
- [app/api/analytics/meta-capi/route.ts](../app/api/analytics/meta-capi/route.ts)

What must be true in GTM for Pixel + CAPI dedup to work:
1. The Meta ViewContent tag must read the same `event_id` value from the dataLayer.
2. The Meta Lead tag must read the same `event_id` value from the dataLayer.
3. That value must be passed to Meta as `eventID` in the final `fbq(...)` call.
4. The browser tag and the CAPI request must fire the same event name and the same `event_id`.

Observed issue in the exported container:
- The active custom HTML tags for ViewContent and Lead show the payload fields, but they do not visibly include `eventID` in the snippet.
- The custom template named Meta Pixel does support an Event ID field and passes it through, so that template is the safer route.

Recommended container fix:
1. Replace the custom HTML ViewContent and Lead tags with the Meta Pixel custom template.
2. Map the GTM `event_id` dataLayer variable into the template's Event ID field.
3. Re-test in Meta Test Events and Pixel Helper to confirm browser + server dedup.

Acceptance check:
- A ViewContent event should appear once in Meta even when both Pixel and CAPI fire.
- A Lead event should appear once in Meta even when both Pixel and CAPI fire.