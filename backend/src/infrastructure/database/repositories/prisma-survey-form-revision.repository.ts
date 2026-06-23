import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SurveyForm,
  SurveyFormRevision,
} from '../../../domain/entities/survey.entity';
import { SurveyFormRevisionRepositoryPort } from '../../../application/ports/survey-form-revision.repository.port';
import {
  revisionFromForm,
  revisionSnapshotFromForm,
} from '../../../application/services/survey-revision.serializer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSurveyFormRevisionRepository implements SurveyFormRevisionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SurveyFormRevision | null> {
    const record = await this.prisma.surveyFormRevision.findUnique({
      where: { id },
    });
    return record ? revisionFromForm(record) : null;
  }

  async findCurrentRevisionId(formId: string): Promise<string | null> {
    const form = await this.prisma.surveyForm.findUnique({
      where: { id: formId },
      select: { currentRevisionId: true },
    });
    return form?.currentRevisionId ?? null;
  }

  async createFromForm(
    form: SurveyForm,
    publishedAt: Date,
  ): Promise<SurveyFormRevision> {
    const latest = await this.prisma.surveyFormRevision.findFirst({
      where: { formId: form.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const snapshot = revisionSnapshotFromForm(form);

    const record = await this.prisma.$transaction(async (tx) => {
      const revision = await tx.surveyFormRevision.create({
        data: {
          formId: form.id,
          version,
          title: snapshot.title,
          description: snapshot.description,
          requiresPackageBaseline: snapshot.requiresPackageBaseline,
          baselineTitle: snapshot.baselineTitle,
          baselineDescription: snapshot.baselineDescription,
          fields: snapshot.fields as unknown as Prisma.InputJsonValue,
          baselineFields:
            snapshot.baselineFields as unknown as Prisma.InputJsonValue,
          publishedAt,
        },
      });
      await tx.surveyForm.update({
        where: { id: form.id },
        data: { currentRevisionId: revision.id },
      });

      // Submitted responses and in-progress drafts keep their pinned revision.
      // New visits pick up the latest revision when the tehsil RA starts a submission.

      return revision;
    });

    return revisionFromForm(record);
  }

  async setCurrentRevision(formId: string, revisionId: string): Promise<void> {
    await this.prisma.surveyForm.update({
      where: { id: formId },
      data: { currentRevisionId: revisionId },
    });
  }
}
