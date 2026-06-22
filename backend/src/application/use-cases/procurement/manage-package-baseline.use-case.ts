import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { canManagePackageCompliance } from '../../../domain/policies/package-compliance.policy';
import { canReadProcurementPackage } from '../../../domain/policies/procurement-access.policy';
import {
  PACKAGE_BASELINE_REPOSITORY,
  PackageBaselineAnswerInput,
  PackageBaselineRepositoryPort,
  PackageFormBaselineState,
} from '../../ports/package-baseline.repository.port';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import {
  SURVEY_FORM_REPOSITORY,
  SurveyFormRepositoryPort,
} from '../../ports/survey-form.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import { SurveyBaselineFieldValidator } from '../../services/survey-baseline-field.validator';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface SavePackageBaselineCommand {
  answers: PackageBaselineAnswerInput[];
}

@Injectable()
export class GetPackageFormBaselineUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(PACKAGE_BASELINE_REPOSITORY)
    private readonly baselineRepository: PackageBaselineRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    formId: string,
  ): Promise<PackageFormBaselineState> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }
    if (!form.requiresPackageBaseline) {
      throw new BadRequestException('This form does not use package baseline');
    }

    const state = await this.baselineRepository.getState(packageId, formId);
    if (!state) {
      throw new NotFoundException('Package baseline not found');
    }
    return state;
  }
}

@Injectable()
export class SavePackageFormBaselineUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(PACKAGE_BASELINE_REPOSITORY)
    private readonly baselineRepository: PackageBaselineRepositoryPort,
    private readonly baselineValidator: SurveyBaselineFieldValidator,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    formId: string,
    command: SavePackageBaselineCommand,
  ): Promise<PackageFormBaselineState> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canManagePackageCompliance(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }
    if (!form.requiresPackageBaseline) {
      throw new BadRequestException('This form does not use package baseline');
    }

    const existing = await this.baselineRepository.getState(packageId, formId);
    if (!existing) {
      throw new NotFoundException('Package baseline not found');
    }

    const existingMap = new Map(
      existing.answers.map((a) => [a.fieldId, a.value]),
    );
    const cleaned = this.baselineValidator.validateAnswers(
      form.baselineFields,
      command.answers,
      existingMap,
    );

    return this.baselineRepository.saveAnswers(
      packageId,
      formId,
      cleaned,
      actor.id,
    );
  }
}
