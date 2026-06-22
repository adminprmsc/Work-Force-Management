import {
  SurveyField,
  SurveyFieldBudgetEffect,
} from '../../domain/entities/survey.entity';

export function numericAnswerValue(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sumBudgetEffectsFromAnswers(
  fields: SurveyField[],
  answers: Array<{ fieldId: string; value: unknown }>,
  options?: { effect?: SurveyFieldBudgetEffect },
): number {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const answerByField = new Map(
    answers.map((answer) => [answer.fieldId, answer.value]),
  );
  let total = 0;

  for (const field of fields) {
    const effect = field.config?.budgetEffect;
    if (!effect) continue;
    if (options?.effect && effect !== options.effect) continue;
    const value = numericAnswerValue(answerByField.get(field.id));
    total += effect === 'DEDUCT' ? value : -value;
  }

  return total;
}

export function computeRemainingPackageBudget(
  budgetAmount: string | number,
  committedExpenses: string | number,
  fields: SurveyField[],
  answers: Array<{ fieldId: string; value: unknown }>,
): number {
  const budget = Number(budgetAmount);
  const committed = Number(committedExpenses);
  const inForm = sumBudgetEffectsFromAnswers(fields, answers, {
    effect: 'DEDUCT',
  });
  const inFormCredits = sumBudgetEffectsFromAnswers(fields, answers, {
    effect: 'ADD',
  });
  return budget - committed - inForm + inFormCredits;
}
