import type {
  ReviewSurveyResponseCommand,
  SaveSurveyResponseCommand,
  SubmitSurveyResponseCommand,
} from '../../../application/use-cases/survey/survey-response.commands';
import type { SurveyAnswerInput } from '../../../application/ports/survey-response.repository.port';
import type {
  ReviewSurveyResponseBody,
  SaveSurveyResponseBody,
  SubmitSurveyResponseBody,
} from '../dto/survey.dto';

function toAnswerInputs(
  answers: SaveSurveyResponseBody['answers'],
): SurveyAnswerInput[] {
  return answers.map((answer) => ({
    fieldId: answer.fieldId,
    value: answer.value,
  }));
}

export function toSaveSurveyResponseCommand(
  body: SaveSurveyResponseBody,
): SaveSurveyResponseCommand {
  return { answers: toAnswerInputs(body.answers) };
}

export function toSubmitSurveyResponseCommand(
  body: SubmitSurveyResponseBody,
): SubmitSurveyResponseCommand {
  return {
    answers: toAnswerInputs(body.answers),
    latitude: body.latitude,
    longitude: body.longitude,
    locationAccuracyMeters: body.locationAccuracyMeters ?? null,
  };
}

export function toReviewSurveyResponseCommand(
  body: ReviewSurveyResponseBody,
): ReviewSurveyResponseCommand {
  return { remarks: body.remarks ?? null };
}

export function parseSubmitSurveyResponseCommand(
  body: unknown,
): SubmitSurveyResponseCommand {
  const payload = body as SubmitSurveyResponseBody;
  const command: SubmitSurveyResponseCommand = {
    answers: payload.answers.map((answer) => ({
      fieldId: answer.fieldId,
      value: answer.value,
    })),
    latitude: payload.latitude,
    longitude: payload.longitude,
    locationAccuracyMeters: payload.locationAccuracyMeters ?? null,
  };
  return command;
}

export function parseReviewSurveyResponseCommand(
  body: unknown,
): ReviewSurveyResponseCommand {
  return toReviewSurveyResponseCommand(body as ReviewSurveyResponseBody);
}
