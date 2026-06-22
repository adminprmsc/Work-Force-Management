import { CreateProcurementPackageExpenseUseCase, DeleteProcurementPackageExpenseUseCase, ListProcurementPackageExpensesUseCase, UpdateProcurementPackageExpenseUseCase } from '../../application/use-cases/procurement/manage-procurement-package-expenses.use-case';
import { ListPackageBaselineFormsUseCase } from '../../application/use-cases/procurement/list-package-baseline-forms.use-case';
import { GetPackageFormBaselineUseCase, SavePackageFormBaselineUseCase } from '../../application/use-cases/procurement/manage-package-baseline.use-case';
import { CreateProcurementPackageUseCase, DeleteProcurementPackageUseCase, GetProcurementPackageUseCase, ListProcurementPackagesUseCase, PreviewProcurementPackageNameUseCase, UpdateProcurementPackageUseCase } from '../../application/use-cases/procurement/manage-procurement-packages.use-case';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { CreateProcurementPackageDto, CreateProcurementPackageExpenseDto, UpdateProcurementPackageDto, UpdateProcurementPackageExpenseDto, SavePackageBaselineDto } from './dto/procurement.dto';
export declare class ProcurementPackagesController {
    private readonly listPackagesUseCase;
    private readonly getPackageUseCase;
    private readonly previewNameUseCase;
    private readonly createPackageUseCase;
    private readonly updatePackageUseCase;
    private readonly deletePackageUseCase;
    private readonly listExpensesUseCase;
    private readonly createExpenseUseCase;
    private readonly updateExpenseUseCase;
    private readonly deleteExpenseUseCase;
    private readonly getPackageBaselineUseCase;
    private readonly savePackageBaselineUseCase;
    private readonly listPackageBaselineFormsUseCase;
    constructor(listPackagesUseCase: ListProcurementPackagesUseCase, getPackageUseCase: GetProcurementPackageUseCase, previewNameUseCase: PreviewProcurementPackageNameUseCase, createPackageUseCase: CreateProcurementPackageUseCase, updatePackageUseCase: UpdateProcurementPackageUseCase, deletePackageUseCase: DeleteProcurementPackageUseCase, listExpensesUseCase: ListProcurementPackageExpensesUseCase, createExpenseUseCase: CreateProcurementPackageExpenseUseCase, updateExpenseUseCase: UpdateProcurementPackageExpenseUseCase, deleteExpenseUseCase: DeleteProcurementPackageExpenseUseCase, getPackageBaselineUseCase: GetPackageFormBaselineUseCase, savePackageBaselineUseCase: SavePackageFormBaselineUseCase, listPackageBaselineFormsUseCase: ListPackageBaselineFormsUseCase);
    list(user: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        budgetAmount: string;
        totalExpenses: string;
        remainingBudget: string;
        contractor: {
            id: string;
            name: string;
        };
        consultant: {
            id: string;
            name: string;
        };
        tehsil: {
            id: string;
            name: string;
            displayName: string;
        };
        villages: {
            id: string;
            name: string;
        }[];
        expenses: {
            id: string;
            packageId: string;
            amount: string;
            description: string | null;
            expenseDate: Date;
            createdBy: {
                id: string;
                username: string;
                email: string;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    previewName(user: AuthenticatedUser, tehsilId: string): Promise<import("../../application/services/procurement-package-naming.service").TehsilNamingPreview>;
    listExpenses(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        packageId: string;
        amount: string;
        description: string | null;
        expenseDate: Date;
        createdBy: {
            id: string;
            username: string;
            email: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createExpense(user: AuthenticatedUser, id: string, dto: CreateProcurementPackageExpenseDto): Promise<{
        id: string;
        packageId: string;
        amount: string;
        description: string | null;
        expenseDate: Date;
        createdBy: {
            id: string;
            username: string;
            email: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateExpense(user: AuthenticatedUser, id: string, expenseId: string, dto: UpdateProcurementPackageExpenseDto): Promise<{
        id: string;
        packageId: string;
        amount: string;
        description: string | null;
        expenseDate: Date;
        createdBy: {
            id: string;
            username: string;
            email: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteExpense(user: AuthenticatedUser, id: string, expenseId: string): Promise<{
        success: boolean;
    }>;
    listBaselineForms(user: AuthenticatedUser, id: string): Promise<{
        formId: string;
        formTitle: string;
        baselineTitle: string | null;
        isBaselineComplete: boolean;
    }[]>;
    getBaseline(user: AuthenticatedUser, id: string, formId: string): Promise<{
        packageId: string;
        formId: string;
        formTitle: string;
        baselineTitle: string | null;
        baselineDescription: string | null;
        fields: {
            id: string;
            type: import("../../domain/entities/survey.entity").SurveyFieldType;
            label: string;
            helpText: string | null;
            required: boolean;
            writeOnce: boolean;
            order: number;
            config: import("../../domain/entities/survey.entity").SurveyFieldConfig | null;
        }[];
        answers: {
            fieldId: string;
            value: unknown;
        }[];
        isBaselineComplete: boolean;
        isMobilized: boolean;
        submittedAt: Date | null;
        submittedBy: {
            id: string;
            username: string;
            email: string;
        } | null;
        updatedAt: Date | null;
    }>;
    saveBaseline(user: AuthenticatedUser, id: string, formId: string, dto: SavePackageBaselineDto): Promise<{
        packageId: string;
        formId: string;
        formTitle: string;
        baselineTitle: string | null;
        baselineDescription: string | null;
        fields: {
            id: string;
            type: import("../../domain/entities/survey.entity").SurveyFieldType;
            label: string;
            helpText: string | null;
            required: boolean;
            writeOnce: boolean;
            order: number;
            config: import("../../domain/entities/survey.entity").SurveyFieldConfig | null;
        }[];
        answers: {
            fieldId: string;
            value: unknown;
        }[];
        isBaselineComplete: boolean;
        isMobilized: boolean;
        submittedAt: Date | null;
        submittedBy: {
            id: string;
            username: string;
            email: string;
        } | null;
        updatedAt: Date | null;
    }>;
    getOne(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        name: string;
        budgetAmount: string;
        totalExpenses: string;
        remainingBudget: string;
        contractor: {
            id: string;
            name: string;
        };
        consultant: {
            id: string;
            name: string;
        };
        tehsil: {
            id: string;
            name: string;
            displayName: string;
        };
        villages: {
            id: string;
            name: string;
        }[];
        expenses: {
            id: string;
            packageId: string;
            amount: string;
            description: string | null;
            expenseDate: Date;
            createdBy: {
                id: string;
                username: string;
                email: string;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthenticatedUser, dto: CreateProcurementPackageDto): Promise<{
        id: string;
        name: string;
        budgetAmount: string;
        totalExpenses: string;
        remainingBudget: string;
        contractor: {
            id: string;
            name: string;
        };
        consultant: {
            id: string;
            name: string;
        };
        tehsil: {
            id: string;
            name: string;
            displayName: string;
        };
        villages: {
            id: string;
            name: string;
        }[];
        expenses: {
            id: string;
            packageId: string;
            amount: string;
            description: string | null;
            expenseDate: Date;
            createdBy: {
                id: string;
                username: string;
                email: string;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateProcurementPackageDto): Promise<{
        id: string;
        name: string;
        budgetAmount: string;
        totalExpenses: string;
        remainingBudget: string;
        contractor: {
            id: string;
            name: string;
        };
        consultant: {
            id: string;
            name: string;
        };
        tehsil: {
            id: string;
            name: string;
            displayName: string;
        };
        villages: {
            id: string;
            name: string;
        }[];
        expenses: {
            id: string;
            packageId: string;
            amount: string;
            description: string | null;
            expenseDate: Date;
            createdBy: {
                id: string;
                username: string;
                email: string;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
    }>;
}
