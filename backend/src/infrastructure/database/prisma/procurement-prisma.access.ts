import type { PrismaService } from './prisma.service';
import type { ProcurementPackageRecord } from '../mappers/procurement-package.mapper';

export type ProcurementPackageUpdateData = {
  name?: string;
  budgetAmount?: string;
  contractorId?: string;
  consultantId?: string;
  tehsilId?: string;
};

export type ContractorRow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConsultantRow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProcurementPackageInclude = {
  contractor: true;
  consultant: true;
  tehsil: true;
  villages: {
    include: { village: true };
    orderBy: { village: { name: 'asc' } };
  };
  expenses: {
    include: {
      createdBy: {
        select: {
          id: true;
          username: true;
          email: true;
        };
      };
    };
    orderBy: { expenseDate: 'desc' };
  };
};

type ContractorDelegate = {
  findMany(args: { orderBy: { name: 'asc' } }): Promise<ContractorRow[]>;
  findUnique(args: { where: { id: string } }): Promise<ContractorRow | null>;
  findUnique(args: { where: { name: string } }): Promise<ContractorRow | null>;
  create(args: { data: { name: string } }): Promise<ContractorRow>;
  update(args: {
    where: { id: string };
    data: { name: string };
  }): Promise<ContractorRow>;
  delete(args: { where: { id: string } }): Promise<ContractorRow>;
};

type ConsultantDelegate = {
  findMany(args: { orderBy: { name: 'asc' } }): Promise<ConsultantRow[]>;
  findUnique(args: { where: { id: string } }): Promise<ConsultantRow | null>;
  findUnique(args: { where: { name: string } }): Promise<ConsultantRow | null>;
  create(args: { data: { name: string } }): Promise<ConsultantRow>;
  update(args: {
    where: { id: string };
    data: { name: string };
  }): Promise<ConsultantRow>;
  delete(args: { where: { id: string } }): Promise<ContractorRow>;
};

type ProcurementPackageDelegate = {
  findMany(args: {
    where?: { tehsilId: string };
    include: ProcurementPackageInclude;
    orderBy: { createdAt: 'desc' };
  }): Promise<ProcurementPackageRecord[]>;
  findUnique(args: {
    where: { id: string };
    include: ProcurementPackageInclude;
  }): Promise<ProcurementPackageRecord | null>;
  findUnique(args: {
    where: { name: string };
    include: ProcurementPackageInclude;
  }): Promise<ProcurementPackageRecord | null>;
  create(args: {
    data: {
      name: string;
      budgetAmount: string;
      contractorId: string;
      consultantId: string;
      tehsilId: string;
      villages: { create: Array<{ villageId: string }> };
    };
    include: ProcurementPackageInclude;
  }): Promise<ProcurementPackageRecord>;
  update(args: {
    where: { id: string };
    data: ProcurementPackageUpdateData;
    include: ProcurementPackageInclude;
  }): Promise<ProcurementPackageRecord>;
  delete(args: { where: { id: string } }): Promise<ProcurementPackageRecord>;
  count(args: { where: { contractorId: string } }): Promise<number>;
  count(args: { where: { consultantId: string } }): Promise<number>;
};

type ProcurementPackageVillageDelegate = {
  deleteMany(args: {
    where: { packageId: string };
  }): Promise<{ count: number }>;
  createMany(args: {
    data: Array<{ packageId: string; villageId: string }>;
  }): Promise<{ count: number }>;
};

type ProcurementPackageExpenseDelegate = {
  findMany(args: {
    where: { packageId: string };
    include: {
      createdBy: {
        select: {
          id: true;
          username: true;
          email: true;
        };
      };
    };
    orderBy: { expenseDate: 'desc' };
  }): Promise<ProcurementPackageRecord['expenses']>;
  findUnique(args: {
    where: { id: string };
    include: {
      createdBy: {
        select: {
          id: true;
          username: true;
          email: true;
        };
      };
    };
  }): Promise<ProcurementPackageRecord['expenses'][number] | null>;
  create(args: {
    data: {
      packageId: string;
      amount: string;
      description?: string | null;
      expenseDate?: Date;
      createdById: string;
    };
    include: {
      createdBy: {
        select: {
          id: true;
          username: true;
          email: true;
        };
      };
    };
  }): Promise<ProcurementPackageRecord['expenses'][number]>;
  update(args: {
    where: { id: string };
    data: {
      amount?: string;
      description?: string | null;
      expenseDate?: Date;
    };
    include: {
      createdBy: {
        select: {
          id: true;
          username: true;
          email: true;
        };
      };
    };
  }): Promise<ProcurementPackageRecord['expenses'][number]>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  aggregate(args: {
    where: { packageId: string };
    _sum: { amount: true };
  }): Promise<{ _sum: { amount: { toString(): string } | null } }>;
};

export type ProcurementTransactionClient = {
  procurementPackage: Pick<ProcurementPackageDelegate, 'update'>;
  procurementPackageVillage: ProcurementPackageVillageDelegate;
};

export type ProcurementPrismaAccess = {
  contractor: ContractorDelegate;
  consultant: ConsultantDelegate;
  procurementPackage: ProcurementPackageDelegate;
  procurementPackageVillage: ProcurementPackageVillageDelegate;
  procurementPackageExpense: ProcurementPackageExpenseDelegate;
  $transaction<T>(
    fn: (tx: ProcurementTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export function asProcurementPrisma(
  prisma: PrismaService,
): ProcurementPrismaAccess {
  return prisma as unknown as ProcurementPrismaAccess;
}
