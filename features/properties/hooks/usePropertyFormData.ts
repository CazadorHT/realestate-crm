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
    {
      id: string;
      full_name: string | null;
      phone: string | null;
      avatar_url?: string | null;
    }[]
  >([]);
  const [popularAreas, setPopularAreas] = React.useState<string[]>([]);
  const [showAllOwners, setShowAllOwners] = React.useState(false);
  const [branches, setBranches] = React.useState<{ id: string; name: any }[]>([]);

  const province = form.watch("province");

  const fetchOwners = async (showAll: boolean) => {
    try {
      const { getOwnersAction } = await import("@/features/owners/actions");
      const ownersData = await getOwnersAction(showAll);
      setOwners(ownersData);
      return ownersData;
    } catch (error) {
      console.error("Error fetching owners:", error);
      return [];
    }
  };

  const fetchPopularAreas = React.useCallback(async (selectedProvince?: string) => {
    try {
      const areasData = (await getPopularAreasAction({
        onlyActive: false,
        province: selectedProvince,
      })) as string[];
      setPopularAreas(areasData);
      return areasData;
    } catch (error) {
      console.error("Error fetching popular areas:", error);
      return [];
    }
  }, []);

  React.useEffect(() => {
    async function loadData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Load branches
        const { data: branchesData } = await supabase
          .from("branches_v3")
          .select("id, name")
          .eq("is_active", true);
        if (branchesData) {
          setBranches(branchesData);
          if (mode === "create" && !form.getValues("branch_id") && branchesData.length > 0) {
            form.setValue("branch_id", branchesData[0].id, { shouldValidate: true });
          }
        }

        // Load owners
        await fetchOwners(showAllOwners);

        // Load agents
        const { data: agentsData } = await supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url")
          .order("full_name");

        if (agentsData) {
          setAgents(agentsData);
        }

        // Load popular areas for initial province
        await fetchPopularAreas(province);

        // If edit mode, load assigned agents
        if (mode === "edit" && defaultValuesId) {
          const { data: rels } = await supabase
            .from("property_agents")
            .select("agent_id")
            .eq("property_id", defaultValuesId);

          if (rels && rels.length > 0) {
            const ids = rels.map((r) => r.agent_id);
            form.setValue("agent_ids", ids);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    loadData();
  }, [mode, defaultValuesId, showAllOwners]); // Removed form from deps to avoid loops, watching province separately

  // Re-fetch popular areas when province changes
  React.useEffect(() => {
    if (province) {
      fetchPopularAreas(province);
    }
  }, [province, fetchPopularAreas]);

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
    branches,
    showAllOwners,
    setShowAllOwners,
    refreshPopularAreas: fetchPopularAreas,
    refreshOwners: async () => {
      return fetchOwners(showAllOwners);
    },
  };
}
