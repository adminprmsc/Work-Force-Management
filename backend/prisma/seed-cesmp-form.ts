import { PrismaClient, SurveyFieldType, SurveyStatus } from '@prisma/client';

const FORM_TITLE = 'C-ESMP Village Monitoring Checklist';

function opts(...labels: string[]) {
  return labels.map((label) => ({
    value: label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()><]/g, ''),
    label,
  }));
}

function mc(label: string, options: string[], order: number, required = true) {
  return {
    type: SurveyFieldType.MULTIPLE_CHOICE,
    label,
    required,
    order,
    config: { options: opts(...options) },
  };
}

function yn(label: string, order: number, required = true) {
  return mc(label, ['Yes', 'No'], order, required);
}

function section(label: string, order: number) {
  return {
    type: SurveyFieldType.SECTION_BREAK,
    label,
    required: false,
    order,
    config: null,
  };
}

export function cesmpVillageMonitoringFields() {
  let order = 0;
  const next = () => order++;

  return [
    section('PPE COMPLIANCE', next()),
    mc(
      'How would you rate workers who are wearing appropriate PPE as required by their tasks?',
      ['None', 'Some', 'Many', 'Most', 'Everyone'],
      next(),
    ),
    yn('PPE is in good condition and properly fitted for each worker?', next()),

    section('WORKSITE HOUSEKEEPING', next()),
    mc(
      'How would you rate housekeeping at site?',
      ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
      next(),
    ),
    yn(
      'Waste and construction materials are properly disposed of or stored.',
      next(),
    ),

    section('NOISE LEVEL', next()),
    mc(
      'Average level of noise at the site during inspection?',
      [
        'Faint (< 50 dB)',
        'Moderate (60 -70 dB)',
        'Loud (71 -85 dB)',
        'Very Loud (86-100 dB)',
        'Extremely Loud (> 100 dB)',
      ],
      next(),
    ),
    mc(
      'How often is the machinery integrated with noise reduction measures?',
      ['Never', 'Rarely', 'Occasionally', 'Oftenly', 'Always'],
      next(),
    ),

    section('DUST EMISSION', next()),
    mc(
      'What is the level of Fugitive Dust on the construction site?',
      ['No Dust', 'Low dust level', 'Medium dust', 'High dust', 'Extreme dust'],
      next(),
    ),
    mc(
      'How often the water is sprinkled on the construction site to control dust?',
      ['Never', 'Rarely', 'Occasionally', 'Oftenly', 'Always'],
      next(),
    ),

    section('LABOR CAMP MANAGEMENT', next()),
    mc(
      'How often portable drinking water is provided at site?',
      ['Never', 'Rarely', 'Occasionally', 'Oftenly', 'Always'],
      next(),
    ),
    mc(
      'Sanitation facility for labor camp?',
      [
        'Portable WC',
        'Community Mosques',
        'At home in case of the local labor',
        'Open Defecation',
      ],
      next(),
    ),
    mc(
      'How often solid waste / construction waste generated at site is being properly managed?',
      ['Never', 'Rarely', 'Occasionally', 'Often', 'Always'],
      next(),
    ),

    section('HSE COMPLIANCE', next()),
    mc(
      'How would you rate the necessary signage displayed at the construction site?',
      ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
      next(),
    ),
    yn(
      'Have workers undergone medical screening prior to commencing work on site?',
      next(),
    ),
    yn(
      'Are fire extinguishers and fire alarms properly placed and maintained on-site?',
      next(),
    ),

    section('ENVIRONMENTAL MONITORING', next()),
    {
      type: SurveyFieldType.TEXT,
      label: 'Conducted By',
      required: true,
      order: next(),
      config: null,
    },
    {
      type: SurveyFieldType.DATE,
      label: 'Sample Date',
      required: true,
      order: next(),
      config: null,
    },
    {
      type: SurveyFieldType.DATE,
      label: 'Report Date',
      required: true,
      order: next(),
      config: null,
    },
    yn('Water Quality Testing', next()),
    mc(
      'Result of Water Quality Testing',
      ['Within Premissible Limit', 'Exceed Premissible Limit'],
      next(),
    ),
    yn('Ambient Air Monitoring', next()),
    mc(
      'Result of Ambient Air Monitoring',
      ['Within Premissible Limit', 'Exceed Premissible Limit'],
      next(),
    ),
    yn('Noise Level Monitoring', next()),
    mc(
      'Result of Noise Level Monitoring',
      ['Within Premissible Limit', 'Exceed Premissible Limit'],
      next(),
    ),
    yn('Wastewater Quality Testing', next()),
    mc(
      'Result of Wastewater Quality Testing',
      ['Within Premissible Limit', 'Exceed Premissible Limit'],
      next(),
    ),

    section('INCIDENT OCCURED AT CONSTRUCTION SITE', next()),
    yn('Has any incident or accident occurred on-site?', next()),
    {
      type: SurveyFieldType.NUMBER,
      label: 'Number of Major',
      required: false,
      order: next(),
      config: { integer: true, min: 0 },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'Number of Minor',
      required: false,
      order: next(),
      config: { integer: true, min: 0 },
    },

    section('TRAININGS CONDUCTED', next()),
    {
      type: SurveyFieldType.TEXT,
      label: 'Title of Training',
      required: false,
      order: next(),
      config: null,
    },
    {
      type: SurveyFieldType.TEXT,
      label: 'Target Audience',
      required: false,
      order: next(),
      config: null,
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'Number of Participants',
      required: false,
      order: next(),
      config: { integer: true, min: 0 },
    },
    {
      type: SurveyFieldType.TEXT,
      label: 'Venue of Training',
      required: false,
      order: next(),
      config: null,
    },

    section('GRIEVANCE REDRESSAL MECHANISM', next()),
    {
      type: SurveyFieldType.NUMBER,
      label: 'Total Grievances Received Till Date',
      required: true,
      order: next(),
      config: { integer: true, min: 0 },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'Total Grievances Resolved Till Date',
      required: true,
      order: next(),
      config: { integer: true, min: 0 },
    },

    section('ESMP BUDGET', next()),
    {
      type: SurveyFieldType.NUMBER,
      label: 'How much ESMP Budget is Allocated?',
      required: false,
      order: next(),
      config: {
        packageReference: 'budgetAmount',
        readOnly: true,
        snapshotOnSubmit: true,
      },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'How much budget is utilized from PPEs head?',
      required: true,
      order: next(),
      config: { min: 0, budgetEffect: 'DEDUCT' },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'How much budget is utilized from HSE head?',
      required: true,
      order: next(),
      config: { min: 0, budgetEffect: 'DEDUCT' },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'How much budget is utilized from Environmental Monitoring head?',
      required: true,
      order: next(),
      config: { min: 0, budgetEffect: 'DEDUCT' },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'Total utilized on this visit',
      required: false,
      order: next(),
      config: { computedVisitDeductions: true, readOnly: true },
    },
    {
      type: SurveyFieldType.NUMBER,
      label: 'Remaining ESMP budget after this visit',
      required: false,
      order: next(),
      config: { computedRemainingBudget: true, readOnly: true },
    },
    yn(
      'Are the quantities and specifications of the claimed items in the IPC accurate and justified according to the ESMP budget?',
      next(),
    ),
  ];
}

export function cesmpPackageBaselineFields() {
  const yesNo = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];
  return [
    {
      type: SurveyFieldType.MULTIPLE_CHOICE,
      label: 'Is Plan (C-ESMP) submitted?',
      required: true,
      writeOnce: false,
      order: 0,
      config: { options: yesNo },
    },
    {
      type: SurveyFieldType.MULTIPLE_CHOICE,
      label: 'Health, Safety and Environment (HSE) staff hired?',
      required: true,
      writeOnce: false,
      order: 1,
      config: { options: yesNo },
    },
    {
      type: SurveyFieldType.DATE,
      label: 'Date of mobilization',
      helpText:
        'Recorded once when work starts on site. Cannot be changed after saving.',
      required: true,
      writeOnce: true,
      order: 2,
      config: null,
    },
  ];
}

export async function seedCesmpVillageMonitoringForm(prisma: PrismaClient) {
  const author = await prisma.user.findFirst({
    where: { role: 'SENIOR_MANAGER_ES' },
    select: { id: true },
  });
  if (!author) {
    console.warn('Skipping C-ESMP form seed: no Senior Manager user');
    return;
  }

  const existing = await prisma.surveyForm.findFirst({
    where: { title: FORM_TITLE },
    include: { fields: true },
  });

  if (existing?.status === SurveyStatus.PUBLISHED) {
    console.log(`C-ESMP form already published: ${FORM_TITLE}`);
    return;
  }

  if (existing) {
    await prisma.surveyForm.delete({ where: { id: existing.id } });
  }

  const fields = cesmpVillageMonitoringFields();
  const baselineFields = cesmpPackageBaselineFields();
  const form = await prisma.surveyForm.create({
    data: {
      title: FORM_TITLE,
      description:
        'Environmental and Social Management Plan — village-level site visit monitoring checklist for procurement packages.',
      status: SurveyStatus.PUBLISHED,
      requiresPackageBaseline: true,
      baselineTitle: 'Package baseline',
      baselineDescription:
        'One-time information required before village visit submissions.',
      publishedAt: new Date(),
      createdById: author.id,
      fields: {
        create: fields.map((field) => ({
          type: field.type,
          label: field.label,
          required: field.required,
          order: field.order,
          config: field.config ?? undefined,
        })),
      },
      baselineFields: {
        create: baselineFields.map((field) => ({
          type: field.type,
          label: field.label,
          helpText: field.helpText ?? null,
          required: field.required,
          writeOnce: field.writeOnce,
          order: field.order,
          config: field.config ?? undefined,
        })),
      },
    },
  });

  console.log(`C-ESMP village monitoring form seeded (published): ${form.id}`);
}
