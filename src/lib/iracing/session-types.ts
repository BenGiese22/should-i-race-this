/**
 * Session Type Normalization
 * 
 * Re-exports the centralized SessionType enum and provides backward compatibility
 * for existing function names.
 */

import { SessionType, SessionTypeHelper } from '../types/session';

// Re-export the main types
export { SessionType };

// Backward compatibility exports
export const normalizeSessionType = SessionTypeHelper.normalizeFromEventType;
export const getSessionTypeName = SessionTypeHelper.getDisplayName;
export const isCompetitiveSession = SessionTypeHelper.isCompetitive;
export const getAllSessionTypes = SessionTypeHelper.getAllTypes;
export const isValidSessionType = SessionTypeHelper.isValid;
export const getSessionTypePriority = SessionTypeHelper.getPriority;