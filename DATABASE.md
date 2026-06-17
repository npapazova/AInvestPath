# DATABASE.md: Local Storage Engine & Schema Setup

## 1. Prisma Schema Definition

This section defines the structural schema representing our application's local SQLite database. It is located at `prisma/schema.prisma`.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Goal {
  id                  String   @id @default(uuid())
  name                String
  targetAmount        Float    // Expected future goal savings target (e.g. 150000.0)
  currentAmount       Float    // Current net initial capital starting savings (e.g. 10000.0)
  monthlyContribution Float    // Post-payment cash added at end of month (e.g. 500.0)
  expectedReturn      Float    // Baseline rate of annual return (e.g. 0.07 for 7%)
  targetDate          DateTime // Expected date for completing the goal
  priority            String   // Enum-based string: "LOW" | "MEDIUM" | "HIGH"
  status              String   // Evaluated category: "ACTIVE" | "ON_TRACK" | "AT_RISK" | "COMPLETED" | "ARCHIVED"
  notes               String?  // Optional text block for user comments
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([status])
  @@index([priority])
  @@index([targetDate])
}

model ScenarioTemplate {
  id           String   @id @default(uuid())
  name         String   @unique // e.g. "Conservative", "Moderate", "Aggressive"
  annualReturn Float    // Annualized return (e.g. 0.04 for 4%, 0.07 for 7%, 0.10 for 10%)
  description  String?  // Explanation of modeling assumptions
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 2. Entity Descriptions and Core Attributes

### `Goal` Entity
Tracks an independent personal investment milestone.
- **id:** `String` (UUID v4) primary key.
- **name:** `String` (Mandatory). High-level identification string user inputs (e.g., "Downpayment for Apartment", "Child College Fund"). Maximum length: 150 characters.
- **targetAmount:** `Float` (Mandatory). Double precision representation of target savings budget. Must be mathematically positive ($> 0.0$).
- **currentAmount:** `Float` (Mandatory). Initial available value matching current investment holdings. Must be non-negative ($\ge 0.0$).
- **monthlyContribution:** `Float` (Mandatory). Stable cash flows injected by the end of each monthly compounding period. Must be non-negative ($\ge 0.0$).
- **expectedReturn:** `Float` (Mandatory). User estimated annual compound return rate ratio (e.g. `0.07` for `7.0%`). Accepted values: `-0.99` to `2.0`.
- **targetDate:** `DateTime` (Mandatory). Target end date. Must be strictly set or updated to a future date relative to client input time.
- **priority:** `String` (Mandatory). Limits visual filtering queries to three specific groups: `"LOW"`, `"MEDIUM"`, or `"HIGH"`.
- **status:** `String` (Mandatory). Tracking flag evaluated using compounding math relative to target dates. Supported: `"ACTIVE"`, `"ON_TRACK"`, `"AT_RISK"`, `"COMPLETED"`, `"ARCHIVED"`.
- **notes:** `String` (Nullable). Markdown-capable free text area allowing personalized descriptions.

### `ScenarioTemplate` Entity
A pre-seeded system lookup table providing standard yield rates for secondary dashboard scenario analysis curves.
- **id:** `String` (UUID v4) primary key.
- **name:** `String` (Mandatory, Unique). Descriptive scenario template name (e.g., `"Conservative"`, `"Moderate"`, `"Aggressive"`).
- **annualReturn:** `Float` (Mandatory). Fixed interest yield for calculation simulations (e.g., `0.04`, `0.07`, `0.10`).
- **description:** `String` (Nullable). Conceptual breakdown of suggested funds or asset classes representing this profile.

---

## 3. Class Cardinality and Relationships
Since the application runs locally in an isolated single-device offline scenario:
- **Zero foreign key dependencies:** There are no explicit user profiles or account ID linkages needed in this layout schema.
- **Logical Association:** `Goal` records operate independently. During execution of multiple-scenario visualization passes, the UI fetches all active `ScenarioTemplate` entries and maps them programmatically alongside each `Goal` row inside memory.

---

## 4. Query Performance Indexes
SQLite automatically indexes Primary Keys and Unique Constraints. We register the following secondary indexes inside `Prisma` to ensure peak performance:
1. `@@index([status])`: Dramatically optimizes rendering speed of primary dashboard aggregations (e.g., counting `"AT_RISK"` goals).
2. `@@index([priority])`: Maintains consistent latency when displaying filtered search lists on long lists.
3. `@@index([targetDate])`: Speeds up temporal queries such as finding the next approaching goal deadline.

---

## 5. System Database Constraints
Because SQLite lacks native compile-time complex `CHECK` constraints on specific Prisma properties, the application enforces the following mathematical rules using **Zod schemas** in the Node/Server action boundary before writing to the database:
- **`targetAmount` > `currentAmount`**: Prevents the user from creating redundant tracking targets when they have already achieved the cash threshold.
- **Positive Bounds**: `targetAmount`, `currentAmount`, and `monthlyContribution` must be explicitly verified to be $\ge 0.0$ via `z.number().min(0)`.
- **Valid Timeline Interval**: The parsed difference between the target date and present execution day must evaluate to at least one valid calendar month.

---

## 6. Migration and Seeding Strategy

Our target database operates and runs locally inside an embedded context. Let's outline the precise database lifecycle processes:

### Migration Pipeline
1. **Incremental Schema Migrations:** Developers will implement alterations inside `prisma/schema.prisma` first.
2. **Migration Generator:** Running `npx prisma migrate dev --name init` instantiates the database schema locally, compiling an SQL change log to `./prisma/migrations/`.
3. **Productive Deployments:** In packaged client containers or staging instances, deploy changes dynamically during startup boot sequences via `npx prisma migrate deploy` to execute schemas cleanly.

### Pre-Seeding Script (`prisma/seed.ts`)
We force default market scenario boundaries into the SQLite system to initialize comparative scenario profiles:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      name: "Conservative",
      annualReturn: 0.04,
      description: "Capital preservation model focused on fixed-yield municipal options and 10-Year Treasury Bonds.",
    },
    {
      name: "Moderate",
      annualReturn: 0.08,
      description: "Core market index balancing equity tracker funds with high-grade corporate bonds.",
    },
    {
      name: "Aggressive",
      annualReturn: 0.12,
      description: "Equity-heavy growth allocation focusing on tech sector holdings and global markets.",
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
```
This script ensures uniform comparative analysis across goals.
