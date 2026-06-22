# Spec 004: Survey Forms

## Status
Backend v1

## Overview
A survey designer that lets Head Office staff build custom forms (text, choice,
date, file, etc.), **publish** them, and **assign** them to tehsils. The Research
Analyst (RA) for a tehsil fills out a form for each **site visit** to a village
(and optionally a settlement). Submitted responses are read-only and visible to
Head Office and World Bank users for review.

Geography (tehsils / villages / settlements) is seed-managed and read-only via
the existing tehsil APIs.

## Roles & access

| Capability | SENIOR_MANAGER_ES | RA_ENVIRONMENT_HO | WORLD_BANK_USER | RA_ES_TEHSIL |
|------------|:--:|:--:|:--:|:--:|
| Build / publish / archive forms | ✅ | ✅ | — | — |
| Assign forms to tehsils | ✅ | ✅ | — | — |
| List / read forms | ✅ | ✅ | read (published) | read (assigned to own tehsil) |
| Fill & submit responses | — | — | — | ✅ (own tehsil only) |
| Read responses | ✅ all | ✅ all | ✅ all (read-only) | own tehsil only |

"Managers" = `SENIOR_MANAGER_ES`, `RA_ENVIRONMENT_HO`.

## Lifecycle

```
DRAFT ──publish──▶ PUBLISHED ──archive──▶ ARCHIVED
  │                    │                      │
  │ editable           │ name/description     │ editable (full)
  └ delete             │ only; archive to     └── republish ──▶ PUBLISHED
                       │   change fields
                       └ delete blocked once responses exist
```

- **DRAFT** and **ARCHIVED** forms can be fully edited (name, description, fields).
- **PUBLISHED** forms allow **name and description** updates only; archive first to
  change fields, then republish.
- **ARCHIVED** forms can be **republished** to make them active again.
- Publishing requires at least one answerable field, and every choice field
  must define at least one option.
- A form can be deleted only while `DRAFT` or `ARCHIVED` (and not when responses
  exist).

## Field types

`TEXT, PARAGRAPH, CHECKBOXES, MULTIPLE_CHOICE, DATE, DROPDOWN, TIME, NUMBER,
CNIC, EMAIL, CONTACT, FILE, IMAGE, SECTION_BREAK`

Each field has: `id, type, label, helpText?, required, order, config`.
`config` (JSON) carries type-specific settings:

| Type | config | answer value |
|------|--------|--------------|
| TEXT / PARAGRAPH | `{ minLength?, maxLength? }` | string |
| NUMBER | `{ min?, max?, integer? }` | number |
| MULTIPLE_CHOICE / DROPDOWN | `{ options: [{ value, label }] }` | string (one option value) |
| CHECKBOXES | `{ options: [...], minSelected?, maxSelected? }` | string[] (option values) |
| DATE | — | ISO date `YYYY-MM-DD` |
| TIME | — | `HH:mm` |
| CNIC | — | `#####-#######-#` (Pakistani CNIC) |
| CONTACT | — | Pakistani mobile `03XXXXXXXXX` / `+923XXXXXXXXX` |
| EMAIL | — | email |
| FILE / IMAGE | `{ accept?, maxSizeMb? }` | `{ url, name, size?, mimeType? }` |
| SECTION_BREAK | — | none (presentational) |

## Validation
- **Form build**: title required; each field needs a label; choice fields need
  options with unique values; `order` is normalized server-side.
- **Answers (on submit)** — every field is validated against its definition:
  - required fields must be answered;
  - choice answers must be among the defined option values;
  - CNIC / CONTACT / EMAIL must match their formats;
  - NUMBER must respect `min`/`max`/`integer`;
  - CHECKBOXES respects `minSelected`/`maxSelected`;
  - answers referencing unknown fields are rejected.
  - All field errors are aggregated and returned together.
- **Draft save** stores partial answers without enforcing required/format rules.

## API

Base path `/api`. All routes require JWT.

### Forms
- `GET /survey-forms` — list (managers: all; RA: published forms assigned to own tehsil)
- `GET /survey-forms/:id` — detail (scoped)
- `POST /survey-forms` *(managers)* — create draft `{ title, description?, fields[] }`
- `PATCH /survey-forms/:id` *(managers, DRAFT only)* — update `{ title?, description?, fields? }`
- `POST /survey-forms/:id/publish` *(managers)*
- `POST /survey-forms/:id/archive` *(managers)*
- `DELETE /survey-forms/:id` *(managers; DRAFT, or ARCHIVED w/o responses)*

### Assignments
A form is assigned **per procurement package**. The package determines the
tehsil (and therefore the RA who fills it). Each assignment carries a
**submission frequency** (`ONE_TIME | DAILY | WEEKLY | MONTHLY`) and a
**start → end window**.

- `GET /survey-forms/:id/assignments` *(managers)*
- `POST /survey-forms/:id/assignments` *(managers)* — `{ procurementPackageIds[], frequency, startDate, endDate, instructions? }` (form must be PUBLISHED; idempotent per package)
- `DELETE /survey-assignments/:id` *(managers; blocked once responses exist)*
- `GET /survey-assignments/mine` *(RA_ES_TEHSIL)* — published forms assigned to the RA's tehsil, with package + schedule

Rules:
- `endDate` must be on/after `startDate`.
- An RA can only **start a response while now ∈ [startDate, endDate]** (end inclusive).
- A site-visit response's village must belong to the assignment's **procurement package**.

### Responses
- `GET /survey-responses` — list (managers/WB: all, filterable; RA: own tehsil)
- `GET /survey-responses/:id` — detail (scoped)
- `POST /survey-responses` *(RA_ES_TEHSIL)* — start a site-visit response `{ assignmentId, villageId, settlementId? }`
- `PATCH /survey-responses/:id` *(RA, owner, DRAFT)* — save answers `{ answers: [{ fieldId, value }] }`
- `POST /survey-responses/:id/submit` *(RA, owner, DRAFT)* — validate + submit

#### Response shape
```json
{
  "id": "uuid",
  "form": { "id": "uuid", "title": "..." },
  "assignmentId": "uuid",
  "status": "DRAFT | SUBMITTED",
  "tehsil": { "id": "uuid", "name": "..." },
  "village": { "id": "uuid", "name": "..." },
  "settlement": { "id": "uuid", "name": "..." } | null,
  "respondent": { "id": "uuid", "username": "...", "email": "..." },
  "answers": [{ "fieldId": "uuid", "value": <any> }],
  "submittedAt": "ISO-8601 | null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## Architecture
- Clean architecture mirroring the procurement module: domain entities +
  `survey-access.policy`, application ports + use-cases + services
  (scope resolver, form validator, answer validator), Prisma repositories,
  presentation controllers/DTOs/mappers. `SurveyModule` registered in `AppModule`.
- Tehsil scope for `RA_ES_TEHSIL` is resolved from the user's office `tehsilId`
  (same mechanism as procurement).

## Out of scope (v1)
- Frontend designer / fill UI (separate task)
- Binary file storage — FILE/IMAGE answers store a reference object only
- Form versioning (publish locks structure instead)
- Audit-log entries for survey actions
