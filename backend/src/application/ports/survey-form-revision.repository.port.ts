import {
  SurveyForm,
  SurveyFormRevision,
} from '../../domain/entities/survey.entity';

export abstract class SurveyFormRevisionRepositoryPort {
  abstract findById(id: string): Promise<SurveyFormRevision | null>;

  abstract findCurrentRevisionId(formId: string): Promise<string | null>;

  /** Create the next immutable revision from a form about to be published. */
  abstract createFromForm(
    form: SurveyForm,
    publishedAt: Date,
  ): Promise<SurveyFormRevision>;

  abstract setCurrentRevision(
    formId: string,
    revisionId: string,
  ): Promise<void>;
}

export const SURVEY_FORM_REVISION_REPOSITORY = Symbol(
  'SURVEY_FORM_REVISION_REPOSITORY',
);
