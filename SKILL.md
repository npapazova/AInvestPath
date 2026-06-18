# Financial Calculation Skill

## Purpose
This skill guides implementation of financial calculations across the workspace.
Its main focus is on clean, auditable annualized formulas, normalized rate handling, and preserving numeric precision until display.

## When to use
- Implementing investment projections, compounding formulas, discounting, future value, present value, savings accumulation, or other financial math.
- Refining or reviewing existing financial formula code in the domain layer.
- Translating business requirements into numerical calculations for goals, scenarios, or forecasts.

## Core principles
1. Prefer annualized formulas
   - Use annual rates and convert them explicitly when the domain requires monthly or daily periods.
   - Keep the formula semantics aligned with standard financial terminology: annualized return, effective annual rate, and nominal annual rate.

2. Normalize percentages before calculations
   - Convert percentages like `8%` into decimals `0.08` before any arithmetic.
   - Normalize user inputs and constants in one place so formulas use raw decimal factors.

3. Round only at the presentation layer
   - Keep internal calculation precision as high as possible.
   - Only format or round numbers for display, storage summaries, or UI labels.
   - Avoid rounding intermediate values inside core math functions.

4. Document every formula
   - Add comments for each formula describing the financial meaning and the algebraic relationship.
   - Include worked examples in comments for clarity.

5. Keep internal precision high
   - Use `number` math with as little implicit rounding as possible.
   - Only apply `toFixed`, `Math.round`, or similar rounding functions at the final formatting stage.

## Workflow
1. Identify the financial concept being implemented.
   - Example: future value of a savings plan, target completion date, annualized return.

2. Define the normalized inputs.
   - Annual rate as decimal: `annualRate = percent / 100`
   - Timeline in years: `years = months / 12`
   - Monthly contribution as a raw `number`, not a rounded currency string.

3. Choose the simplest annualized formula.
   - Prefer standard formulas such as:
     - Future value: `FV = PV * (1 + r)^n`
     - Annuity future value: `FV = PMT * ((1 + r)^n - 1) / r`
     - Present value: `PV = FV / (1 + r)^n`

4. Annotate the formula with a financial explanation.
   - Example comment:
     ```ts
     // Future value of a present amount compounded annually.
     // FV = PV * (1 + r)^n
     // where r is the annual decimal rate and n is years.
     ```

5. Include a worked example comment.
   - Example:
     ```ts
     // If PV = 1000, annualRate = 0.08, years = 5,
     // FV = 1000 * (1 + 0.08)^5 = 1469.33
     ```

6. Keep display formatting separate.
   - Use helper utilities such as `formatCurrency(value)` or `formatPercentage(rate)` only at the UI boundary.

## Example prompt
- "Implement the future value formula for annual compounding in the financial domain module using normalized percentage inputs and internal precision. Document each formula and add a worked example comment."

## Notes
- This skill is workspace-scoped and intended for domain/math implementations, not for UI copy or user-facing text.
- If a formula must support monthly contributions or periodic compounding, derive it from the annual form and document the conversion step clearly.
- Avoid storing rounded values in the core projection engine.
