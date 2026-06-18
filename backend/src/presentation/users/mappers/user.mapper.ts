import {
  User,
  UserRole,
  UserStatus,
} from '../../../domain/entities/user.entity';

export function toUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    officeId: user.officeId,
    officeName: user.officeName,
    officeType: user.officeType,
    tehsilName: user.tehsilName,
    createdById: user.createdById,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toActorContext(user: { id: string; role: UserRole }) {
  return { id: user.id, role: user.role };
}

export { UserRole, UserStatus };
