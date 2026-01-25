import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";
import { getPopularAreasAction } from "@/features/properties/actions";
import { POPULAR_AREAS } from "@/features/properties/labels";

export function usePropertyFormData(
  mode: "create" | "edit",
  defaultValuesId: string | undefined,
  form: UseFormReturn<PropertyFormValues>,
) {
  const [owners, setOwners] = React.useState<
    { id: string; full_name: string; phone: string | null }[]
  >([]);
  const [agents, setAgents] = React.useState<
    { id: string; full_name: string | null; phone: string | null }[]
  >([]);
  const [popularAreas, setPopularAreas] = React.useState<string[]>([]);

  const fetchPopularAreas = async () => {
    try {
      const areasData = await getPopularAreasAction({ onlyActive: false });
      // Merge DB areas with hardcoded defaults to ensure we have a good list
      const combinedAreas = Array.from(
        new Set([...areasData, ...(POPULAR_AREAS as unknown as string[])]),
      ).sort();
      setPopularAreas(combinedAreas);
      return combinedAreas;
    } catch (error) {
      console.error("Error fetching popular areas:", error);
      return [];
    }
  };

  React.useEffect(() => {
    async function loadData() {
      try {
        // Load owners
        const { getOwnersAction } = await import("@/features/owners/actions");
        const ownersData = await getOwnersAction();
        setOwners(ownersData);

        // Load agents
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: agentsData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .order("full_name");

        if (agentsData) {
          setAgents(agentsData);
        }

        // Load popular areas
        await fetchPopularAreas();

        // If edit mode, load assigned agents
        if (mode === "edit" && defaultValuesId) {
          const { data: rels } = await supabase
            .from("property_agents")
            .select("agent_id")
            .eq("property_id", defaultValuesId);

          if (rels && rels.length > 0) {
            const ids = rels.map((r) => r.agent_id);
            form.setValue("agent_ids", ids); // Note: Make sure field name matches schema
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    loadData();
  }, [mode, defaultValuesId, form]); // Added form to deps, be careful of loops if form is unstable

  // Fetch Features on Edit Mode
  React.useEffect(() => {
    async function loadFeatures() {
      if (mode === "edit" && defaultValuesId) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: featuresData } = await supabase
            .from("property_features")
            .select("feature_id")
            .eq("property_id", defaultValuesId);

          if (featuresData && featuresData.length > 0) {
            const ids = featuresData.map((f) => f.feature_id);
            form.setValue("feature_ids", ids);
          }
        } catch (err) {
          console.error("Error loading features:", err);
        }
      }
    }
    loadFeatures();
  }, [mode, defaultValuesId, form]);

  return {
    owners,
    agents,
    popularAreas,
    refreshPopularAreas: fetchPopularAreas,
  };
}
