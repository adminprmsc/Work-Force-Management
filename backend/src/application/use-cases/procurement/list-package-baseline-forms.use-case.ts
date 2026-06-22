import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { canReadProcurementPackage } from '../../../domain/policies/procurement-access.policy';
import type { PackageBaselineFormSummary } from '../../ports/package-baseline.repository.port';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import {
  SURVEY_ASSIGNMENT_REPOSITORY,
  SurveyAssignmentRepositoryPort,
} from '../../ports/survey-assignment.repository.port';
import { AssignmentBaselineEnricher } from '../../services/assignment-baseline.enricher';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

@Injectable()
export class ListPackageBaselineFormsUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
    private readonly baselineEnricher: AssignmentBaselineEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
  ): Promise<PackageBaselineFormSummary[]> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const assignments =
      await this.assignmentRepository.findByPackage(packageId);
    const baselineAssignments = assignments.filter(
      (a) => a.requiresPackageBaseline,
    );
    const enriched = await this.baselineEnricher.enrich(baselineAssignments);

    return enriched.map((assignment) => ({
      formId: assignment.formId,
      formTitle: assignment.formTitle,
      baselineTitle: null,
      isBaselineComplete: assignment.procurementPackage.isBaselineComplete,
    }));
  }
}
