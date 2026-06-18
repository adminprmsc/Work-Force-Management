# Spec 002: User Types, Offices & Tehsil Geography

## Status
Complete

## Overview
Replace prior RBAC with four user types, three office types, and a geographic hierarchy (Tehsil → Village → Settlement). Tehsil RA E&S accounts are pre-seeded (one per tehsil); Senior Manager ES administers all users.

## User Types

| Role | Code | Office | Count |
|------|------|--------|-------|
| Senior Manager E&S | `SENIOR_MANAGER_ES` | — | 1 (seed) |
| Research Analyst – Environment (HO) | `RA_ENVIRONMENT_HO` | Head Office | Unlimited |
| Research Analyst – E&S (Tehsil) | `RA_ES_TEHSIL` | Tehsil Office | 1 per tehsil (seed) |
| World Bank User | `WORLD_BANK_USER` | World Bank Office | Unlimited |

## Office Types

| Type | Code | Notes |
|------|------|-------|
| Head Office | `HEAD_OFFICE` | Singleton; multiple RA Environment users |
| World Bank Office | `WORLD_BANK_OFFICE` | Singleton; multiple World Bank users |
| Tehsil Office | `TEHSIL_OFFICE` | One per tehsil; exactly one RA E&S |

## Senior Manager E&S Permissions

- Create: `RA_ENVIRONMENT_HO`, `WORLD_BANK_USER` (assign office)
- Activate / deactivate: all user types including seeded `RA_ES_TEHSIL`
- Edit / delete / reset credentials: `RA_ENVIRONMENT_HO`, `WORLD_BANK_USER`
- Cannot create or delete `RA_ES_TEHSIL` (system-seeded)
- View audit logs

## Geography

- 16 tehsils (fixed list)
- Villages belong to a tehsil
- Settlements belong to a village (where defined)

## API

### Auth
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Users (Senior Manager only)
- `POST /api/users` — create RA Environment or World Bank user
- `GET /api/users` — list all users
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id` — not allowed for `RA_ES_TEHSIL`
- `PATCH /api/users/:id/status`
- `POST /api/users/:id/reset-credentials`

### Offices (Senior Manager)
- `GET /api/offices` — list offices (for assignment)

### Tehsils (authenticated)
- `GET /api/tehsils` — list tehsils
- `GET /api/tehsils/:id/villages` — villages for a tehsil

### Audit Logs (Senior Manager)
- `GET /api/audit-logs`

## Seed

1. 16 tehsils + villages + settlements from location data
2. Head Office, World Bank Office, 16 Tehsil Offices
3. Senior Manager ES
4. 16 RA E&S users (one per tehsil office, inactive-ready)
