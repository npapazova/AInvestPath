# TESTING.md: Comprehensive Quality Assurance Strategy

## 1. Unit Testing Strategy
- **Runner:** `Vitest` with native TypeScript type-stripping support.
- **Isolated Target:** The Financial Projection Engine (`src/domain/financial-engine/*`) is an independent, pure mathematical territory with zero dependencies. No mocks, no global environment states, and no active prisma client instances are allowed in this directory.
- **Parametrized Sweeps:** Utilize Vitest's `test.each` API to verify formula stability over dynamic parameter intervals (including extremely small interest increments).

## 2. Integration Testing Strategy
- **Runner:** `Vitest` for API/Server Action layers; `Playwright` for E2E system flow.
- **Database Sandbox:** Spin up an isolated local database configuration (`test-run.db`) for integration passes. Run migrations before executing tests and ensure that the test teardown sequence clears the file system clean.
- **Hydration Diagnostics:** Assert that dynamic calculations executed via React client states match values processed by Node server-side components.

## 3. Test Data Strategy
- Avoid random faker generators. Use fixed, immutable, predictable records representing deterministic economic scenarios:
  - `underfundedGoal`: Represents an inflation-affected model where contribution velocities cannot catch up with compound horizons.
  - `hyperCompoundingGoal`: Long horizon (e.g., 30 years) to check for floating-point accumulative precision drift.
  - `flatGoal`: 0% return model to verify basic addition accumulation.

## 4. Coverage Targets
- **`src/domain/financial-engine/*`**: 100% Statement, Branch, and functional execution path protection.
- **`src/app/actions/*`**: >90% code coverage.
- **`src/components/*`**: >75% interface rendering and layout validation.

---

## 5. Critical Business Logic Test Cases

### Test Case A: Compound Future Value (Basic Growth)
Verifies compound interest compounding for ordinary annuities where investments are deposited at the end of each monthly period.

#### Mathematical Reference Equation
$$FV_{Total} = P(1 + r_m)^n + PMT \times \frac{(1 + r_m)^n - 1}{r_m}$$

Where:
- $P$ = Initial savings capital principal balance.
- $PMT$ = Repeating monthly contribution constraint.
- $r_m$ = Monthly expected interest yield rate ratio ($\frac{AnnualRate}{12}$).
- $n$ = Total duration of investment periods in months ($\text{Years} \times 12$).

#### Test Parameters
- `initialPrincipal` ($P$): `1000.00`
- `monthlyContribution` ($PMT$): `100.00`
- `annualRate` ($r$): `0.06` (representing `6.0%`)
- `months` ($n$): `12` (1 year)

#### Intermediate Manual Evaluations
- $r_m = \frac{0.06}{12} = 0.005$ (0.5% compounded monthly)
- **Principal Future Value Element:**
  $$FV_{Principal} = 1000.00 \times (1 + 0.005)^{12} = 1000.00 \times 1.06167781 = 1061.68$$
- **Contributions Future Value Element:**
  $$FV_{Contributions} = 100.00 \times \frac{(1.06167781 - 1)}{0.005} = 100.00 \times 12.335562 = 1233.56$$
- **Target Value Aggregation:**
  $$FV_{Total} = 1061.68 + 1233.56 = 2295.24$$
- **Total Cash Injected:**
  $$1000.00 + (100.00 \times 12) = 2200.00$$
- **Accumulated Interest Growth Yield:**
  $$2295.24 - 2200.00 = 95.24$$

#### Programmatic Assertions
```typescript
import { expect, test } from "vitest";
import { calculateFutureValue } from "@/domain/financial-engine/math";

test("Test Case A: Compounding verification matches analytical formulas", () => {
  const result = calculateFutureValue({
    initialPrincipal: 1000.00,
    monthlyContribution: 100.00,
    annualRate: 0.06,
    months: 12,
  });

  expect(result.futureValue).toBeCloseTo(2295.24, 2);
  expect(result.totalInvested).toBeCloseTo(2200.00, 2);
  expect(result.totalGains).toBeCloseTo(95.24, 2);
});
```

---

### Test Case B: Mathematical Zero-Yield Zero-Compounding
Validates that interest division code branches handle flat yield situations smoothly without producing infinite values or dividing by zero.

#### Test Parameters
- `initialPrincipal` ($P$): `5000.00`
- `monthlyContribution` ($PMT$): `200.00`
- `annualRate` ($r$): `0.00` (representing `0.0%`)
- `months` ($n$): `24` (2 years)

#### Theoretical Math Expectation
$$FV_{Total} = 5000.00 + (200.00 \times 24) = 9800.00$$
$$FV_{Gains} = 0.00$$

#### Programmatic Assertions
```typescript
test("Test Case B: Null-yield inputs resolve as plain additions instead of NaN/Infinity", () => {
  const result = calculateFutureValue({
    initialPrincipal: 5000.00,
    monthlyContribution: 200.00,
    annualRate: 0.00,
    months: 24,
  });

  expect(result.futureValue).toBeCloseTo(9800.00, 2);
  expect(result.totalGains).toBe(0.00);
});
```

---

### Test Case C: Required Monthly Contribution
Asserts that the system can solve for the exact monthly contribution target required to close a capital gap over a fixed future date constraint.

#### Mathematical Reference Equation
$$PMT = \frac{TargetAmount - P(1 + r_m)^n}{\frac{(1 + r_m)^n - 1}{r_m}}$$

#### Test Parameters
- `targetAmount`: `50000.00`
- `currentAmount` ($P$): `10000.00`
- `annualRate` ($r$): `0.08` (representing `8.0%`)
- `months` ($n$): `60` (5 years)

#### Intermediate Manual Evaluations
- $r_m = \frac{0.08}{12} = 0.00666667$ (0.6667% per month)
- **Principal Future Compound Element:**
  $$FV_{Principal} = 10000.00 \times (1 + 0.00666667)^{60} = 10000.00 \times 1.4898457 = 14898.46$$
- **Capital Deficit to fill via Monthly Injections:**
  $$\text{Deficit} = 50000.00 - 14898.46 = 35101.54$$
- **Compounding Annuity Accumulator Factor:**
  $$\text{Accumulator} = \frac{(1 + 0.00666667)^{60} - 1}{0.00666667} = 73.47686$$
- **Required Monthly Payment Calculation:**
  $$PMT = \frac{35101.54}{73.47686} = 477.72$$

#### Programmatic Assertions
```typescript
test("Test Case C: Solve required monthly payment to achieve milestone target", () => {
  const pmt = calculateRequiredContribution({
    targetAmount: 50000.00,
    currentAmount: 10000.00,
    annualRate: 0.08,
    months: 60,
  });

  expect(pmt).toBeCloseTo(477.72, 2);
});
```

---

### Test Case D: Dynamic Volatility Achievement Confidence Score
Empowers users with a statistical proxy showing the probability of reaching their goal. Using standard analytical geometric Brownian progress estimation, or a standard deviation proxy dispersion metric.

Our deterministic confidence solver ranks target outcomes using a simple standard deviation boundary:
Annuity projections define a base expected return ($\mu$). Let's overlay an asset volatility metric ($\sigma$):
- **Conservative Volatility:** Standard Deviation of $\sigma = 3.0\%$ (`0.03`).
- **Moderate Volatility:** Standard Deviation of $\sigma = 8.0\%$ (`0.08`).
- **Aggressive Volatility:** Standard Deviation of $\sigma = 15.0\%$ (`0.15`).

We calculate a simple Z-Score relative to the requested target to estimate the probability of success based on a normal distribution.

```typescript
test("Test Case D: Dynamic achievement probability outputs lower percentages under higher volatility regimes", () => {
  const safePortfolio = estimateSuccessProbability({
    targetAmount: 20000.00,
    currentAmount: 10000.00,
    monthlyContribution: 100.00,
    annualRate: 0.08,
    months: 60,
    volatility: 0.03, // Low risk
  });

  const aggregateRiskPortfolio = estimateSuccessProbability({
    targetAmount: 20000.00,
    currentAmount: 10000.00,
    monthlyContribution: 100.00,
    annualRate: 0.08,
    months: 60,
    volatility: 0.15, // High risk
  });

  // Safe investments display tighter dispersion bands around the expected target output,
  // meaning if target < expected growth, a safe portfolio correlates with higher certainty parameters
  expect(safePortfolio).toBeGreaterThan(aggregateRiskPortfolio);
});
```
