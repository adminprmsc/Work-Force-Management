import { UserRole } from '../entities/user.entity';

export interface SurveyActorContext {
  id: string;
  role: UserRole;
  tehsilId: string | null;
}

/** Head Office staff who build, publish, and assign forms. */
const SURVEY_MANAGERS: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
];

/** Everyone who may read forms/responses (RA is tehsil-scoped). */
const SURVEY_READERS: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
  UserRole.RA_ES_TEHSIL,
];

export function canManageSurveyForms(role: UserRole): boolean {
  return SURVEY_MANAGERS.includes(role);
}

export function canReadSurveys(role: UserRole): boolean {
  return SURVEY_READERS.includes(role);
}

/** Only tehsil RAs fill out and submit survey responses. */
export function canFillSurveyResponses(role: UserRole): boolean {
  return role === UserRole.RA_ES_TEHSIL;
}

/** Managers and World Bank see all responses; a tehsil RA only its own tehsil. */
export function canReadResponseForTehsil(
  actor: SurveyActorContext,
  tehsilId: string,
): boolean {
  if (!canReadSurveys(actor.role)) {
    return false;
  }
  if (actor.role === UserRole.RA_ES_TEHSIL) {
    return actor.tehsilId === tehsilId;
  }
  return true;
}
