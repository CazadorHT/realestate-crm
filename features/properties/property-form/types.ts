import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "../schema";

/**
 * Base props shared by all step components
 */
export interface BaseStepProps {
  form?: UseFormReturn<PropertyFormValues>;
  mode: "create" | "edit";
}

/**
 * Step 1: Basic Info (Listing type, Property type, Quick Info)
 */
export interface Step1Props extends BaseStepProps {
  popularAreas: string[];
  isAddingArea: boolean;
  newArea: string;
  setNewAreaAction: (val: string) => void;
  newAreaEn: string;
  setNewAreaEnAction: (val: string) => void;
  newAreaCn: string;
  setNewAreaCnAction: (val: string) => void;
  newAreaRu: string;
  setNewAreaRuAction: (val: string) => void;
  onAddAreaAction: () => Promise<boolean | void>;
  isQuickInfoOpen: boolean;
  setIsQuickInfoOpen: (val: boolean) => void;
  branches: Array<{ id: string; name: any }>;
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
  agents: Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url?: string | null;
  }>;
  initialImages: Array<{
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }>;
  uploadSessionId: string;
  persistImages: boolean;
  refreshOwners?: () => Promise<Array<{ id: string; full_name: string; phone: string | null }>>;
  showAllOwners?: boolean;
  setShowAllOwners?: (val: boolean) => void;
  isMultiTenant?: boolean;
  userRole?: string;
}

/**
 * Agent Multi-Select Section Props
 */
export interface AgentMultiSelectProps {
  form?: UseFormReturn<PropertyFormValues>;
  agents: Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url?: string | null;
  }>;
}
