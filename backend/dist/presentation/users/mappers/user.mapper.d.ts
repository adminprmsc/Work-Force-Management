import { User, UserRole, UserStatus } from '../../../domain/entities/user.entity';
export declare function toUserResponse(user: User): {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    officeId: string | null;
    officeName: string | null;
    officeType: import("../../../domain/entities/user.entity").OfficeType | null;
    tehsilName: string | null;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
};
export declare function toActorContext(user: {
    id: string;
    role: UserRole;
}): {
    id: string;
    role: UserRole;
};
export { UserRole, UserStatus };
