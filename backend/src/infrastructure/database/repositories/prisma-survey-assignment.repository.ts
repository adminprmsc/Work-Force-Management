import { Injectable } from '@nestjs/common';
import {
  SurveyAssignment,
  SurveyFormRevisionSnapshot,
  SurveyProcurementRef,
  SurveyTehsilRef,
} from '../../../domain/entities/survey.entity';
import {
  CreateSurveyAssignmentData,
  SurveyAssignmentRepositoryPort,
} from '../../../application/ports/survey-assignment.repository.port';
import { parseRevisionFields } from '../../../application/services/survey-revision.serializer';
import { PrismaService } from '../prisma/prisma.service';

type AssignmentRecord = {
  id: string;
  formId: string;
  assignedById: string;
  frequency: SurveyAssignment['frequency'];
  startDate: Date;
  endDate: Date;
  instructions: string | null;
  createdAt: Date;
  form: { id: string; title: string; requiresPackageBaseline: boolean };
  formRevision: {
    id: string;
    version: number;
    fields: unknown;
    publishedAt: Date;
  };
  tehsil: { id: string; name: string };
  procurementPackage: { id: string; name: string };
  _count: { responses: number };
};

function mapRevisionSnapshot(
  revision: AssignmentRecord['formRevision'],
): SurveyFormRevisionSnapshot {
  return new SurveyFormRevisionSnapshot(
    revision.id,
    revision.version,
    parseRevisionFields(revision.fields),
    revision.publishedAt,
  );
}

function mapAssignment(record: AssignmentRecord): SurveyAssignment {
  return new SurveyAssignment(
    record.id,
    record.formId,
    record.form.title,
    record.form.requiresPackageBaseline,
    mapRevisionSnapshot(record.formRevision),
    new SurveyTehsilRef(record.tehsil.id, record.tehsil.name),
    new SurveyProcurementRef(
      record.procurementPackage.id,
      record.procurementPackage.name,
      false,
      false,
    ),
    record.frequency,
    record.startDate,
    record.endDate,
    record.assignedById,
    record.instructions,
    record._count.responses,
    record.createdAt,
  );
}

@Injectable()
export class PrismaSurveyAssignmentRepository implements SurveyAssignmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    form: { select: { id: true, title: true, requiresPackageBaseline: true } },
    formRevision: {
      select: { id: true, version: true, fields: true, publishedAt: true },
    },
    tehsil: { select: { id: true, name: true } },
    procurementPackage: { select: { id: true, name: true } },
    _count: { select: { responses: true } },
  };

  async findByForm(formId: string): Promise<SurveyAssignment[]> {
    const records = await this.prisma.surveyAssignment.findMany({
      where: { formId },
      include: this.include,
      orderBy: { tehsil: { name: 'asc' } },
    });
    return records.map((record) => mapAssignment(record as AssignmentRecord));
  }

  async findById(id: string): Promise<SurveyAssignment | null> {
    const record = await this.prisma.surveyAssignment.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? mapAssignment(record as AssignmentRecord) : null;
  }

  async findByFormAndPackage(
    formId: string,
    procurementPackageId: string,
  ): Promise<SurveyAssignment | null> {
    const record = await this.prisma.surveyAssignment.findUnique({
      where: {
        formId_procurementPackageId: { formId, procurementPackageId },
      },
      include: this.include,
    });
    return record ? mapAssignment(record as AssignmentRecord) : null;
  }

  async findByFormAndTehsil(
    formId: string,
    tehsilId: string,
  ): Promise<SurveyAssignment | null> {
    const record = await this.prisma.surveyAssignment.findFirst({
      where: { formId, tehsilId },
      include: this.include,
    });
    return record ? mapAssignment(record as AssignmentRecord) : null;
  }

  async findForTehsil(tehsilId: string): Promise<SurveyAssignment[]> {
    const records = await this.prisma.surveyAssignment.findMany({
      where: { tehsilId, form: { status: 'PUBLISHED' } },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => mapAssignment(record as AssignmentRecord));
  }

  async findByPackage(
    procurementPackageId: string,
  ): Promise<SurveyAssignment[]> {
    const records = await this.prisma.surveyAssignment.findMany({
      where: { procurementPackageId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => mapAssignment(record as AssignmentRecord));
  }

  async create(data: CreateSurveyAssignmentData): Promise<SurveyAssignment> {
    const record = await this.prisma.surveyAssignment.create({
      data: {
        formId: data.formId,
        formRevisionId: data.formRevisionId,
        tehsilId: data.tehsilId,
        procurementPackageId: data.procurementPackageId,
        assignedById: data.assignedById,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate,
        instructions: data.instructions ?? null,
      },
      include: this.include,
    });
    return mapAssignment(record as AssignmentRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.surveyAssignment.delete({ where: { id } });
  }
}
