import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "../schema";

/**
 * Base props shared by all step components
 */
export interface BaseStepProps {
  form: UseFormReturn<PropertyFormValues>;
  mode: "create" | "edit";
}

/**
 * Step 1: Basic Info (Listing type, Property type, Quick Info)
 */
export interface Step1Props extends BaseStepProps {
  popularAreas: string[];
  isAddingArea: boolean;
  newArea: string;
  setNewArea: (val: string) => void;
  onAddArea: () => Promise<void>;
  isQuickInfoOpen: boolean;
  setIsQuickInfoOpen: (val: boolean) => void;
}

/**
 * Step 2: Details (Price, specs, description, commission)
 * No additional props needed - uses parseNumber from parent
 */
export interface Step2Props extends BaseStepProps {}

/**
 * Step 3: Location (Address fields, transit info)
 * Uses useThaiAddress hook internally
 */
export interface Step3Props extends BaseStepProps {}

/**
 * Step 4: Media & Management (Images, owner, status, agents, source)
 */
export interface Step4Props extends BaseStepProps {
  owners: Array<{ id: string; full_name: string; phone: string | null }>;
  agents: Array<{ id: string; full_name: string | null; phone: string | null }>;
  initialImages: Array<{
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }>;
  uploadSessionId: string;
  persistImages: boolean;
}

/**
 * Agent Multi-Select Section Props
 */
export interface AgentMultiSelectProps {
  form: UseFormReturn<PropertyFormValues>;
  agents: Array<{ id: string; full_name: string | null; phone: string | null }>;
}
