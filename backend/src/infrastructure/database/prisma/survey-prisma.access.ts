import type { SurveyFrequency } from '../../../domain/entities/survey.entity';
import type { PrismaService } from './prisma.service';

export type SurveyAssignmentInclude = {
  form: { select: { id: true; title: true; requiresPackageBaseline: true } };
  tehsil: { select: { id: true; name: true } };
  procurementPackage: {
    select: {
      id: true;
      name: true;
    };
  };
  _count: { select: { responses: true } };
};

export type SurveyAssignmentRecord = {
  id: string;
  formId: string;
  assignedById: string;
  frequency: SurveyFrequency;
  startDate: Date;
  endDate: Date;
  instructions: string | null;
  createdAt: Date;
  form: { id: string; title: string; requiresPackageBaseline: boolean };
  tehsil: { id: string; name: string };
  procurementPackage: {
    id: string;
    name: string;
  };
  _count: { responses: number };
};

type SurveyAssignmentDelegate = {
  findMany(args: {
    where:
      | { formId: string }
      | { tehsilId: string; form: { status: string } }
      | { procurementPackageId: string };
    include: SurveyAssignmentInclude;
    orderBy: { tehsil: { name: 'asc' } } | { createdAt: 'desc' };
  }): Promise<SurveyAssignmentRecord[]>;
  findUnique(args: {
    where: { id: string };
    include: SurveyAssignmentInclude;
  }): Promise<SurveyAssignmentRecord | null>;
  findUnique(args: {
    where: {
      formId_procurementPackageId: {
        formId: string;
        procurementPackageId: string;
      };
    };
    include: SurveyAssignmentInclude;
  }): Promise<SurveyAssignmentRecord | null>;
  findFirst(args: {
    where: { formId: string; tehsilId: string };
    include: SurveyAssignmentInclude;
  }): Promise<SurveyAssignmentRecord | null>;
  create(args: {
    data: {
      formId: string;
      tehsilId: string;
      procurementPackageId: string;
      assignedById: string;
      frequency: SurveyFrequency;
      startDate: Date;
      endDate: Date;
      instructions: string | null;
    };
    include: SurveyAssignmentInclude;
  }): Promise<SurveyAssignmentRecord>;
  delete(args: { where: { id: string } }): Promise<SurveyAssignmentRecord>;
};

export type SurveyPrismaAccess = {
  surveyAssignment: SurveyAssignmentDelegate;
};

export function asSurveyPrisma(prisma: PrismaService): SurveyPrismaAccess {
  return prisma as unknown as SurveyPrismaAccess;
}
