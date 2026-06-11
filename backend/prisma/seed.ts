import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.dailyRecord.deleteMany();
  await prisma.campaign.deleteMany();

  const campaigns = await Promise.all([
    prisma.campaign.create({ data: { name: 'Campaign A', adType: 'CPM', upstream: 'Upstream 1', downstream: 'Downstream 1' } }),
    prisma.campaign.create({ data: { name: 'Campaign B', adType: 'CPA', upstream: 'Upstream 1', downstream: 'Downstream 2' } }),
    prisma.campaign.create({ data: { name: 'Campaign C', adType: 'CPS', upstream: 'Upstream 2', downstream: 'Downstream 3' } }),
  ]);

  const today = new Date();
  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    await Promise.all(
      campaigns.map((campaign, index) => {
        const anomalyMultiplier = index === 0 && dayOffset === 1 ? 3.2 : 1;
        const clickDrop = index === 1 && dayOffset <= 2 ? (3 - dayOffset) * 180 : 0;

        return prisma.dailyRecord.create({
          data: {
            campaignId: campaign.id,
            date,
            impressions: Math.round((10000 + index * 2500 + dayOffset * 200) * anomalyMultiplier),
            clicks: Math.max(100, 800 + index * 120 + dayOffset * 15 - clickDrop),
            revenue: (1500 + index * 600 + dayOffset * 50) * anomalyMultiplier,
            cost: (900 + index * 350 + dayOffset * 30) * (index === 0 && dayOffset === 1 ? 2.4 : 1),
          },
        });
      }),
    );
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
