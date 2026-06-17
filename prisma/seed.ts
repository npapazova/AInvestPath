import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      name: "Conservative",
      annualReturn: 0.04,
      description:
        "Capital preservation model focused on fixed-yield municipal options and 10-Year Treasury Bonds.",
    },
    {
      name: "Moderate",
      annualReturn: 0.08,
      description:
        "Core market index balancing equity tracker funds with high-grade corporate bonds.",
    },
    {
      name: "Aggressive",
      annualReturn: 0.12,
      description:
        "Equity-heavy growth allocation focusing on tech sector holdings and global markets.",
    },
  ];

  for (const template of templates) {
    await prisma.scenarioTemplate.upsert({
      where: { name: template.name },
      update: {
        annualReturn: template.annualReturn,
        description: template.description,
      },
      create: {
        name: template.name,
        annualReturn: template.annualReturn,
        description: template.description,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
