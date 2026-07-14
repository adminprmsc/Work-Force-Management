import type { SurveyAnswerInput } from '../../ports/survey-response.repository.port';

export interface SaveSurveyResponseCommand {
  answers: SurveyAnswerInput[];
}

export interface SubmitSurveyResponseCommand extends SaveSurveyResponseCommand {
  latitude: number;
  longitude: number;
  locationAccuracyMeters?: number | null;
}

export interface ReviewSurveyResponseCommand {
  remarks?: string | null;
}
