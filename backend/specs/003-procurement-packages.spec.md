# Spec 003: Procurement Packages

## Status
Complete (backend v1)

## Overview
Procurement packages are contracts linking a **contractor**, **consultant**, **package name**, **tehsil**, and one or more **villages** within that tehsil. Contractors and consultants are maintained as separate master records and selected when creating or editing a package.

Geography (tehsils/villages) remains seed-managed and read-only via existing tehsil APIs.

## Master data

### Contractor
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | Unique display name |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

### Consultant
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | Unique display name |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

### Procurement package
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | Package / contract name |
| contractorId | UUID | FK → contractors |
| consultantId | UUID | FK → consultants |
| tehsilId | UUID | FK → tehsils |
| createdAt | datetime | Contract created date (defaults to now) |
| updatedAt | datetime | Auto |
| villageIds | UUID[] | Many-to-many via junction; villages must belong to `tehsilId` |

## Access control

| Role | Contractors & consultants | Procurement packages |
|------|---------------------------|-------------------|
| `SENIOR_MANAGER_ES` | Create, read, update, delete | Create, read, update, delete (all tehsils) |
| `RA_ENVIRONMENT_HO` | Create, read, update, delete | Create, read, update, delete (all tehsils) |
| `WORLD_BANK_USER` | — (names embedded in package responses) | Read only (all tehsils) |
| `RA_ES_TEHSIL` | — | Read only (packages where `tehsilId` matches user's tehsil office) |

Scope for `RA_ES_TEHSIL` is resolved from the user's office `tehsilId`.

## Validation rules
- Package `villageIds` must be non-empty.
- Every village must belong to the selected `tehsilId`.
- Contractor and consultant must exist when creating/updating a package.
- Tehsil must exist when creating/updating a package.
- Contractor and consultant names must be unique (case-sensitive trim).

## API

Base path: `/api` (global prefix). All routes require JWT.

### Contractors (`SENIOR_MANAGER_ES`, `RA_ENVIRONMENT_HO`)
- `GET /contractors` — list
- `POST /contractors` — create `{ name }`
- `PATCH /contractors/:id` — update `{ name }`
- `DELETE /contractors/:id` — delete (blocked if referenced by a package)

### Consultants (`SENIOR_MANAGER_ES`, `RA_ENVIRONMENT_HO`)
- `GET /consultants` — list
- `POST /consultants` — create `{ name }`
- `PATCH /consultants/:id` — update `{ name }`
- `DELETE /consultants/:id` — delete (blocked if referenced by a package)

### Procurement packages

**Read** (`SENIOR_MANAGER_ES`, `RA_ENVIRONMENT_HO`, `WORLD_BANK_USER`, `RA_ES_TEHSIL` — scoped for tehsil RA):
- `GET /procurement-packages` — list (scoped)
- `GET /procurement-packages/:id` — detail (scoped)

**Write** (`SENIOR_MANAGER_ES`, `RA_ENVIRONMENT_HO`):
- `POST /procurement-packages` — create
- `PATCH /procurement-packages/:id` — update
- `DELETE /procurement-packages/:id` — delete

#### Create / update body
```json
{
  "name": "Package Alpha",
  "contractorId": "uuid",
  "consultantId": "uuid",
  "tehsilId": "uuid",
  "villageIds": ["uuid", "uuid"]
}
```

#### Response shape
```json
{
  "id": "uuid",
  "name": "Package Alpha",
  "contractor": { "id": "uuid", "name": "..." },
  "consultant": { "id": "uuid", "name": "..." },
  "tehsil": { "id": "uuid", "name": "..." },
  "villages": [{ "id": "uuid", "name": "..." }],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## Architecture
- Clean architecture: domain entities + policies, application use cases + ports, infrastructure Prisma repositories, presentation controllers/DTOs.
- `ProcurementModule` registered in `AppModule`.
- Dynamic village validation uses live tehsil/village data (no hard-coded lists).

## Out of scope (v1)
- Frontend UI for procurement
- Audit log entries for procurement actions
- Settlements on packages
