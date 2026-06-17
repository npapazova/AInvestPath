# AGENTS.md: Product Vision, Architecture, and Standards

## 1. Product Vision
**AInvestPath** is a modern, high-precision personal finance planning tool that empowers everyday savers to map out, evaluate, and achieve their long-term investment goals. By simplifying sophisticated financial projections into an interactive, visually stunning, and performance-driven single-page interface, it eliminates the confusion of complex spreadsheets. AInvestPath acts as a personal mathematical compass, illustrating with mathematical rigor how modifications in timelines, contribution amounts, or market scenarios translate to future compound wealth.

## 2. Project Goals
- **Empirical Rigor:** Deliver standard mathematical compound financial logic without rounding drift or state synchronization anomalies.
- **Offline & Local-First:** Build a highly stable, instantly bootstrapping application utilizing **SQLite** with the **Prisma ORM** for persistent local records requiring zero cloud database infrastructure.
- **Seamless Interactive Scenario Comparison:** Allow users to dynamically sweep through Conservative, Moderate, and Aggressive interest rates and witness instantaneous visual projection changes without UI lagging.
- **Architectural Isolation:** Keep mathematical and financial logic strictly decoupled from all database, route, or presentation details so that the mathematical equations are 100% pure, modular, and separately testable.

## 3. Core Domain Concepts
### 1. Goal
A concrete investment objective representing a future target state.
- **Inputs:** Name, target cash amount, current net initial savings, discretionary monthly repeating contribution, preferred annualized return rate, target completion/maturity date, priority level (High, Medium, Low), and optional notes.
- **Outputs:** Future value forecasting, milestone coverage percentage, and current mathematical status.

### 2. Scenario
An economic projection profile reflecting performance assumptions.
- **Conservative Scenario (4% Return):** Heavy exposure to inflation-protected securities, short-term debt, and capital-preservation assets.
- **Moderate Scenario (8% Return):** Standard index tracker mix (e.g., diversified bonds and equity tracker indices).
- **Aggressive Scenario (12% Return):** Broad equity growth index investments, high-yield municipal funds, or growth-weighted international equities.

### 3. Financial Status Classifier
Determines whether an investment goal's contribution pace is sufficient to reach its target budget prior to the specified end date.
- `ON_TRACK`: The estimated Future Value ($FV$) at the target date is greater than or equal to the desired target amount.
- `AT_RISK`: The estimated Future Value ($FV$) at the target date falls short of the target budget.
- `COMPLETED`: Current initial principal savings are already greater than or equal to the target amount.
- `ARCHIVED`: User-flagged inactive or completed goal.

---

## 4. Architecture Overview

```
+-------------------------------------------------------------+
|                      UI Layer (Next.js)                     |
|  - App Router, React Components, Tailwind UI & Recharts     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               Prisma Clients / Server Actions               |
|  - SQLite Datastore, Transaction Managers & Zod Parsers     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|             Pure Financial Projection Engine                |
|  - Isolative Pure TypeScript Module (Domain Domain)         |
|  - Zero global side effects, completely stateless helpers   |
+-------------------------------------------------------------+
```

### Architectural Decisions

#### Decision 1: Pure Domain Extraction of Financial Formulas
- **Decision:** Extract all compounding formulas, remaining periods solvers, required-to-target monthly budgets calculations, and scenario modeling parameters into a completely pure, dependency-free domain module located exclusively at `src/domain/financial-engine/`.
- **Reasoning:** Financial formulas are objective algebraic models. Extracting them to a pure module ensures they can be tested exhaustively without mocking databases, HTTP servers, or browser rendering trees. This pure module can run server-side inside Server Actions or inside interactive client components (e.g., slider components) with equal precision.
- **Alternatives Considered:** Bundling formulas directly inside database seed scripts, embedding within React custom hooks (`useGoalCompounding`), or utilizing database views/stored procedures.
- **Trade-offs:** Requires strict types mapping data between database models and pure domain objects, introducing some boilerplate translation.

#### Decision 2: SQLite with Prisma in WAL Mode
- **Decision:** Utilize an embedded SQLite database accessed through the Prisma ORM. Configure the database connector pool to initialize in Write-Ahead Logging (WAL) mode.
- **Reasoning:** It satisfies the user requirement for zero cloud/network dependency while maintaining high transactional consistency. WAL mode enables parallel client queries and non-blocking reads during writes, preventing SQLite database busy errors.
- **Alternatives Considered:** Client-only persistence using browser `localStorage` or `IndexedDB`, or configuring a containerized Postgres instance.
- **Trade-offs:** SQLite lacks a native fixed-point Decimal data type, requiring all values to be processed carefully in TypeScript using binary floating-points, which are rounded to exactly two decimal places at presentation boundaries.

#### Decision 3: Recharts for Visualizations
- **Decision:** Adopt `recharts` for visual SVG graphs.
- **Reasoning:** It integrates directly with React 19 and Tailwind CSS, presenting seamless responsive layout sizing and highly custom CSS-based tooltips which are essential for comparing three interactive curves simultaneously.
- **Alternatives Considered:** Chart.js, D3.js.
- **Trade-offs:** Recharts carries a larger initial bundle footprint than pure canvas-based alternatives, but its React-friendly declarative API reduces developer boilerplate significantly.

---

## 5. Coding Standards
- **Exhaustive TypeScript typing:** Compiles under `"strict": true` in `tsconfig.json`. Implicit `any` is forbidden.
- **Immutability First:** The pure projection engine must treat inputs as read-only. Avoid in-place object mutations. Use spread operadores (`...`) and array helpers (`.map()`, `.filter()`, `.reduce()`).
- **Mathematical Constants & Safety:** Explicitly assert bounds at calculation entry. If a parameter (e.g., monthly contribution, timeline) is negative or invalid, return a standard, informative Error object instead of returning `NaN` or pushing silent structural failures.
- **Error Boundaries:** Use custom error classes with descriptive keys rather than plain JavaScript `throw new Error()`.

## 6. Development Workflow
1. **Schema Definition:** Implement matching Prisma schemas, run migrations, and execute the standard scenarios seeder.
2. **Domain Mathematics:** Code pure financial algebra formulas inside `src/domain/financial-engine/` and write unit tests to ensure absolute calculation precision down to 2 decimal places.
3. **Database Client layer:** Implement type-safe Database accessors using Next.js Server Actions with clean Zod validator parameters.
4. **UI Wireframe Components:** Design visual layout containers matching the responsive grid instructions. Bind state hooks to layout controls.
5. **Integration Phase:** Connect component callbacks to Server Actions.
6. **E2E & Linting Verification:** Run automated linter checks and end-to-end routing validation.

## 7. Definition of Done
- TypeScript compiles successfully with zero warnings or generic type exemptions.
- Unit test suite covers 100% of all math calculations, edge cases, and bounds boundaries in the domain financial module.
- Integration tests confirm full database CRUD execution without schema mismatches or state leaks.
- Tailwind layouts execute cleanly on mobile (>= 320px), tablet (>= 768px), and desktop (>= 1200px) environments.
- Accessibility standards (WCAG AA color contrasts and screen reader element tags) are verified on all active forms.

## 8. Architectural Constraints
- **Mathematical Bound Check:** All return rates must undergo normalization checks. Intermediary interest factors are processed using standard float types, but final values stored in the database or displayed on screens are forced to two decimal places.
- **Offline Compliance:** No external SaaS API integrations or public network dependency. Every component and formula must function fully in an isolated local environment.
