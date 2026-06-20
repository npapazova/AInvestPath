"use client";

import { useMemo, useState } from "react";
import { compareScenarios } from "@/domain/financial-engine/scenarios";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPercent } from "@/lib/format";

type GoalSimulationPanelProps = {
  currentAmount: number;
  monthlyContribution: number;
  targetAmount: number;
  initialMonths: number;
};

const MIN_MONTHS = 1;
const MAX_MONTHS = 600;

export function GoalSimulationPanel({
  currentAmount,
  monthlyContribution,
  targetAmount,
  initialMonths,
}: GoalSimulationPanelProps) {
  const normalizedInitial = clampMonths(initialMonths);
  const [months, setMonths] = useState<number>(normalizedInitial);

  const scenarios = useMemo(
    () => compareScenarios(currentAmount, monthlyContribution, months),
    [currentAmount, monthlyContribution, months],
  );

  return (
    <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Timeline controls</h2>
        <p className="text-sm text-muted-foreground">
          Adjust the horizon to instantly compare conservative, moderate, and aggressive outcomes.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="timeline-months" className="text-sm font-medium">
            Projection timeline (months)
          </label>
          <Input
            id="timeline-months"
            type="number"
            min={MIN_MONTHS}
            max={MAX_MONTHS}
            value={months}
            onChange={(event) => {
              const parsed = Number(event.target.value);

              if (Number.isNaN(parsed)) {
                return;
              }

              setMonths(clampMonths(parsed));
            }}
            className="w-28"
          />
        </div>
        <input
          type="range"
          min={MIN_MONTHS}
          max={MAX_MONTHS}
          value={months}
          onChange={(event) => setMonths(clampMonths(Number(event.target.value)))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
          aria-label="Projection timeline in months"
        />
        <p className="text-xs text-muted-foreground">
          {months} months equals {(months / 12).toFixed(1)} years.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const isOnTrack = scenario.futureValue >= targetAmount;
          const gapToTarget = Math.max(0, targetAmount - scenario.futureValue);

          return (
            <article
              key={scenario.scenarioName}
              className="rounded-xl border bg-gradient-to-b from-white to-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{scenario.scenarioName}</p>
                  <p className="text-xs text-muted-foreground">
                    Expected annual return {formatPercent(scenario.annualRate)}
                  </p>
                </div>
                <Badge variant={isOnTrack ? "outline" : "secondary"}>
                  {isOnTrack ? "On track" : "At risk"}
                </Badge>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Projected value</dt>
                  <dd className="font-semibold">{formatCurrency(scenario.futureValue)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Total invested</dt>
                  <dd>{formatCurrency(scenario.totalInvested)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Projected gains</dt>
                  <dd className="text-emerald-600">{formatCurrency(scenario.totalGains)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Gap to target</dt>
                  <dd>{formatCurrency(gapToTarget)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function clampMonths(value: number): number {
  if (value < MIN_MONTHS) {
    return MIN_MONTHS;
  }

  if (value > MAX_MONTHS) {
    return MAX_MONTHS;
  }

  return Math.round(value);
}
