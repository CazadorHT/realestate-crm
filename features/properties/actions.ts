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
} from "./actions/fetch";
export { incrementPropertyView } from "./actions/view";
