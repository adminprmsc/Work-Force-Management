import 'dotenv/config';
import { PrismaClient, OfficeType, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  TEHSIL_OPTIONS,
  tehsilRaEmail,
  tehsilRaUsername,
} from './data/tehsils';
import { seedEmail } from './data/email-domain';
import { seedGeography } from './seed-geography';
import { seedCesmpVillageMonitoringForm } from './seed-cesmp-form';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('Seeding fixed geography (16 tehsils, villages, settlements)...');
  await seedGeography(prisma);

  let headOffice = await prisma.office.findFirst({
    where: { type: OfficeType.HEAD_OFFICE },
  });
  if (!headOffice) {
    headOffice = await prisma.office.create({
      data: {
        type: OfficeType.HEAD_OFFICE,
        name: 'Head Office',
      },
    });
  }

  let worldBankOffice = await prisma.office.findFirst({
    where: { type: OfficeType.WORLD_BANK_OFFICE },
  });
  if (!worldBankOffice) {
    worldBankOffice = await prisma.office.create({
      data: {
        type: OfficeType.WORLD_BANK_OFFICE,
        name: 'World Bank Office',
      },
    });
  }

  const seniorEmail =
    process.env.SEED_SENIOR_MANAGER_EMAIL ?? seedEmail('senior.manager');
  const seniorUsername =
    process.env.SEED_SENIOR_MANAGER_USERNAME ?? 'senior_manager_es';
  const seniorPassword =
    process.env.SEED_SENIOR_MANAGER_PASSWORD ?? 'SeniorManager@123';

  const existingSenior = await prisma.user.findUnique({
    where: { email: seniorEmail },
  });
  if (!existingSenior) {
    await prisma.user.create({
      data: {
        email: seniorEmail,
        username: seniorUsername,
        password: await bcrypt.hash(seniorPassword, 12),
        role: UserRole.SENIOR_MANAGER_ES,
      },
    });
    console.log('Senior Manager E&S created');
    console.log(`  Email:    ${seniorEmail}`);
    console.log(`  Username: ${seniorUsername}`);
    console.log(`  Password: ${seniorPassword}`);
  } else {
    console.log(`Senior Manager already exists: ${seniorEmail}`);
  }

  const raPassword = process.env.SEED_RA_ES_PASSWORD ?? 'RaEs@123';

  for (const tehsilName of TEHSIL_OPTIONS) {
    const tehsil = await prisma.tehsil.findUnique({
      where: { name: tehsilName },
    });
    if (!tehsil) {
      throw new Error(
        `Canonical tehsil missing after geography seed: ${tehsilName}`,
      );
    }

    const tehsilOffice = await prisma.office.findUnique({
      where: { tehsilId: tehsil.id },
    });
    if (!tehsilOffice) {
      throw new Error(
        `Tehsil office missing after geography seed: ${tehsilName}`,
      );
    }

    const email = tehsilRaEmail(tehsilName);
    const username = tehsilRaUsername(tehsilName);
    const existingRa = await prisma.user.findUnique({ where: { email } });
    if (!existingRa) {
      await prisma.user.create({
        data: {
          email,
          username,
          password: await bcrypt.hash(raPassword, 12),
          role: UserRole.RA_ES_TEHSIL,
          officeId: tehsilOffice.id,
          status: 'ACTIVE',
        },
      });
    } else if (existingRa.officeId !== tehsilOffice.id) {
      await prisma.user.update({
        where: { id: existingRa.id },
        data: { officeId: tehsilOffice.id },
      });
    }
  }

  console.log(`16 RA E&S users ensured (password: ${raPassword})`);
  console.log(`Head Office id: ${headOffice.id}`);
  console.log(`World Bank Office id: ${worldBankOffice.id}`);

  await seedCesmpVillageMonitoringForm(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
