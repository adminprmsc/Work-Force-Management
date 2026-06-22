import { Inject, Injectable } from '@nestjs/common';
import {
  SurveyAssignment,
  SurveyProcurementRef,
} from '../../domain/entities/survey.entity';
import {
  PACKAGE_BASELINE_REPOSITORY,
  PackageBaselineRepositoryPort,
} from '../ports/package-baseline.repository.port';
import { completionKey } from './package-baseline.completion';

@Injectable()
export class AssignmentBaselineEnricher {
  constructor(
    @Inject(PACKAGE_BASELINE_REPOSITORY)
    private readonly baselineRepository: PackageBaselineRepositoryPort,
  ) {}

  async enrich(assignments: SurveyAssignment[]): Promise<SurveyAssignment[]> {
    const pairs = assignments
      .filter((a) => a.requiresPackageBaseline)
      .map((a) => ({
        packageId: a.procurementPackage.id,
        formId: a.formId,
      }));

    const completion = await this.baselineRepository.getCompletionBatch(pairs);

    return assignments.map((assignment) => {
      if (!assignment.requiresPackageBaseline) {
        return new SurveyAssignment(
          assignment.id,
          assignment.formId,
          assignment.formTitle,
          assignment.requiresPackageBaseline,
          assignment.formRevision,
          assignment.tehsil,
          new SurveyProcurementRef(
            assignment.procurementPackage.id,
            assignment.procurementPackage.name,
            true,
            true,
          ),
          assignment.frequency,
          assignment.startDate,
          assignment.endDate,
          assignment.assignedById,
          assignment.instructions,
          assignment.responseCount,
          assignment.createdAt,
        );
      }

      const key = completionKey(
        assignment.procurementPackage.id,
        assignment.formId,
      );
      const flags = completion.get(key) ?? { isBaselineComplete: false };

      return new SurveyAssignment(
        assignment.id,
        assignment.formId,
        assignment.formTitle,
        assignment.requiresPackageBaseline,
        assignment.formRevision,
        assignment.tehsil,
        new SurveyProcurementRef(
          assignment.procurementPackage.id,
          assignment.procurementPackage.name,
          flags.isBaselineComplete,
          flags.isBaselineComplete,
        ),
        assignment.frequency,
        assignment.startDate,
        assignment.endDate,
        assignment.assignedById,
        assignment.instructions,
        assignment.responseCount,
        assignment.createdAt,
      );
    });
  }
}
