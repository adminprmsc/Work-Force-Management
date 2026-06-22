# Spec 005: ESMP / C-ESMP Compliance Monitoring

## Status
Draft — v1 foundation

## Problem

When a **procurement package** is created, the tehsil **RA E&S** must monitor Environmental and Social
safeguards for every village in that contract. Stakeholders require:

1. **Package-level baseline** (one-time, before field monitoring proceeds)
2. **Village-level site visits** (repeatable — each visit captures KPIs against predefined questions)

This is the core product purpose: **Environment and Social Safeguard compliance tracking tied to
procurement contracts and village geography.**

## Solution architecture — hybrid (recommended)

| Layer | Mechanism | Why |
|-------|-----------|-----|
| Package baseline | `ProcurementPackageCompliance` (typed fields on procurement) | Mobilization date must be **immutable**; fields are semantically fixed, not user-designed |
| Village monitoring | **Survey** (published template + assignment per package) | Repeatable visits, sectioned questionnaires, RA fill workflow, HO/WB review already exist |
| Coverage dashboards | Future read model | Roll up baseline + per-village submission counts |

### Do we still need Survey?

**Yes — for village-level monitoring.** Survey is the right engine for:

- Repeatable site-visit responses per village
- Predefined question sets with validation (ratings, yes/no, dates, numbers)
- `submittedAt` + `respondent` audit on every visit
- Assignment scoped to procurement package → tehsil RA

**No — for package baseline alone.** Survey requires `villageId` on every response and treats all
answers as generic form fields. Package baseline (mobilization date, C-ESMP submitted, HSE hired)
needs **strong lifecycle rules** that belong on procurement.

```
ProcurementPackage
  ├── ProcurementPackageCompliance   ← one-time baseline (this spec)
  └── SurveyAssignment               ← village visit checklist (existing survey)
        └── SurveyResponse (per village, per visit)
```

## Roles

| Capability | SENIOR_MANAGER_ES | RA_ENVIRONMENT_HO | WORLD_BANK_USER | RA_ES_TEHSIL |
|------------|:--:|:--:|:--:|:--:|
| Read package compliance | ✅ | ✅ | ✅ | own tehsil |
| Submit / update baseline | ✅ | ✅ | — | own tehsil |
| Set mobilization date | ✅ | ✅ | — | own tehsil (once) |
| Fill village monitoring survey | — | — | — | ✅ (after mobilization) |

## Package baseline (`ProcurementPackageCompliance`)

One row per procurement package (created lazily on first read or write).

| Field | Type | Rules |
|-------|------|-------|
| `cesmpPlanSubmitted` | boolean | Required before mobilization |
| `hseStaffHired` | boolean | Required before mobilization |
| `mobilizationDate` | date | **Write-once.** Once set, never changes. Unlocks village surveys. |
| `baselineSubmittedAt` | timestamp | Set when all three fields first complete |
| `baselineSubmittedBy` | user ref | RA or manager who completed baseline |

### Mobilization gate

Village-level survey responses (`POST /survey-responses`) are **blocked** until
`mobilizationDate` is set on the assignment's procurement package.

## Village monitoring (survey template)

Published system form: **"C-ESMP Village Monitoring Checklist"** (seeded).

Sections (stakeholder KPIs):

1. PPE Compliance
2. Worksite Housekeeping
3. Noise Level
4. Dust Emission
5. Labor Camp Management
6. HSE Compliance
7. Environmental Monitoring
8. Incident Occurred at Construction Site
9. Trainings Conducted (v1: single training block per visit)
10. Grievance Redressal Mechanism
11. ESMP Budget

Each `SurveyResponse` carries:

- `visitDate` — date of field inspection (may differ from `submittedAt`)
- `villageId` — village within the package
- `respondent` — tehsil RA

**Frequency:** assignments use open window; unlimited visits per village in v1.
Future: enforce `WEEKLY` / `MONTHLY` per assignment.

### Future enhancements (out of v1)

- `REPEATABLE_GROUP` field type (multiple trainings per visit)
- File/image upload storage for evidence photos
- Package compliance dashboard (% villages visited, overdue)
- Amendment workflow for submitted responses

## API (v1)

Base `/api`. JWT required.

### Compliance
- `GET /procurement-packages/:id/compliance` — read baseline (scoped)
- `PUT /procurement-packages/:id/compliance/baseline` — upsert baseline
  - Body: `{ cesmpPlanSubmitted, hseStaffHired, mobilizationDate? }`
  - `mobilizationDate` rejected if already set to a different value

### Survey (extended)
- `POST /survey-responses` — add mobilization gate; accept optional `visitDate`
- Response includes `visitDate`

## Frontend (v1)

- **Package detail / compliance panel** — baseline form for RA (mobilization warning)
- **My Surveys** — existing flow; disabled with message until mobilization set
- Managers see baseline status on package list

## Seed

- `C-ESMP Village Monitoring Checklist` form published as system template
- HO assigns to packages (existing assign dialog)
