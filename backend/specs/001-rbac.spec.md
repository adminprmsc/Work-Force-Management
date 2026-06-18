# Spec 001: Role-Based Access Control (RBAC)

## Status
Superseded by `002-user-types-offices.spec.md`

## Overview
Implement hierarchical RBAC for Workforce Management with three roles, team management, and audit logging visible to Manager E&S.

## Hierarchy

```
Manager E&S
    └── Research Analyst (assigned to Team)
            └── ES Worker (reportsTo = RA)
```

## Roles

| Role | Code | Reports To |
|------|------|------------|
| Manager E&S | `MANAGER_ES` | — |
| Research Analyst | `RESEARCH_ANALYST` | Manager E&S (via Team) |
| ES Worker | `ES_WORKER` | Research Analyst |

## Permissions Matrix

| Action | Manager E&S | Research Analyst | ES Worker |
|--------|:-----------:|:----------------:|:---------:|
| Create any user type | ✅ | ES Worker only | ❌ |
| Edit any user | ✅ | Own ES Workers | ❌ |
| Delete any user | ✅ | Own ES Workers | ❌ |
| Activate/Deactivate users | ✅ | Own ES Workers | ❌ |
| Reset user credentials | ✅ | Own ES Workers | ❌ |
| Create/Manage teams (RAs) | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |
| Login (if active) | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |

## API Endpoints

### Auth
- `POST /api/auth/login` — all roles (active users only)
- `GET /api/auth/profile` — all authenticated users

### Users (protected)
- `POST /api/users` — create user (role-restricted)
- `GET /api/users` — list users (scoped by role)
- `GET /api/users/:id` — get user
- `PATCH /api/users/:id` — update user
- `DELETE /api/users/:id` — delete user
- `PATCH /api/users/:id/status` — activate/deactivate
- `POST /api/users/:id/reset-credentials` — reset password, return new temp password

### Teams (Manager E&S only)
- `POST /api/teams` — create team with RA members
- `GET /api/teams` — list teams
- `GET /api/teams/:id` — get team with members
- `PATCH /api/teams/:id` — update team name/members
- `DELETE /api/teams/:id` — delete team

### Audit Logs (Manager E&S only)
- `GET /api/audit-logs` — paginated audit log list

## Audit Events
All mutating actions are logged with: actor, action, resource type/id, metadata, timestamp.

## Business Rules
1. Public registration is disabled; users are created by Manager or RA.
2. Inactive users cannot login.
3. RA can only manage ES Workers where `reportsToId = RA.id`.
4. ES Worker must have `reportsToId` set to a RA when created.
5. RA must belong to a Team when created by Manager (optional on create, required for full assignment).
6. Manager owns Teams; each Team has one Manager and many RAs.

## Seed
First Manager E&S is bootstrapped via `prisma/seed.ts` using env vars.
