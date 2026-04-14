// Re-export types for consumers
export type {
  CreatePropertyResult,
  DuplicatePropertyResult,
  UpdatePropertyStatusResult,
} from "./types";

// Re-export action functions with explicit named exports to avoid barrel file bloat
export {
  createPropertyAction,
  duplicatePropertyAction,
} from "./actions/create";
export {
  updatePropertyAction,
  updatePropertyStatusAction,
  triggerPropertyAiReviewAction,
} from "./actions/update";
export { deletePropertyAction } from "./actions/delete";
export {
  uploadPropertyImageAction,
  deletePropertyImageFromStorage,
  cleanupUploadSessionAction,
} from "./actions/images";
export {
  getPropertyById,
  getPropertyWithImages,
  getPopularAreasAction,
  addPopularAreaAction,
  getRecommendedPropertiesAction,
  getGlobalPropertiesTableDataAction,
  getGlobalInventoryFilterCountsAction,
} from "./actions/fetch";
export { postPropertyToMetaAction } from "./actions/social";
export { incrementPropertyView } from "./actions/view";
