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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scenarios = useMemo(
    () => compareScenarios(currentAmount, monthlyContribution, months),
    [currentAmount, monthlyContribution, months],
  );

  const chart = useMemo(
    () => buildScenarioChartData(currentAmount, monthlyContribution, months),
    [currentAmount, monthlyContribution, months],
  );

  const hoveredMonth = hoveredIndex == null ? null : chart.sampledMonths[hoveredIndex];
  const hoveredValues = hoveredIndex == null
    ? null
    : {
        Conservative: chart.valuesByScenario.Conservative[hoveredIndex],
        Moderate: chart.valuesByScenario.Moderate[hoveredIndex],
        Aggressive: chart.valuesByScenario.Aggressive[hoveredIndex],
      };
  const hoveredX = hoveredIndex == null
    ? null
    : chart.series.Conservative[hoveredIndex].x;

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

      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Projection curves</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {CHART_SERIES_META.map((series) => (
              <span key={series.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                  aria-hidden="true"
                />
                {series.label}
              </span>
            ))}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-52 w-full rounded-lg border bg-slate-50"
          role="img"
          aria-label="Scenario projection line chart"
        >
          <line
            x1={CHART_PADDING_LEFT}
            y1={CHART_HEIGHT - CHART_PADDING_BOTTOM}
            x2={CHART_WIDTH - CHART_PADDING_RIGHT}
            y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={CHART_PADDING_LEFT}
            y1={CHART_PADDING_TOP}
            x2={CHART_PADDING_LEFT}
            y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={CHART_PADDING_LEFT}
                y1={tick.y}
                x2={CHART_WIDTH - CHART_PADDING_RIGHT}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text
                x={CHART_PADDING_LEFT - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
              >
                {formatCompactCurrency(tick.value)}
              </text>
            </g>
          ))}

          {chart.xTicks.map((tick) => (
            <text
              key={tick.month}
              x={tick.x}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
            >
              {tick.label}
            </text>
          ))}

          {CHART_SERIES_META.map((meta) => {
            const points = chart.series[meta.key]
              .map((point) => `${point.x},${point.y}`)
              .join(" ");

            return (
              <polyline
                key={meta.key}
                fill="none"
                stroke={meta.color}
                strokeWidth="2.4"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          <rect
            x={CHART_PADDING_LEFT}
            y={CHART_PADDING_TOP}
            width={CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT}
            height={CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM}
            fill="transparent"
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseMove={(event) => {
              const localX = mapClientXToViewBoxX(event.clientX, event.currentTarget);
              setHoveredIndex(findNearestSampleIndex(localX, chart.series.Conservative));
            }}
          />

          {hoveredIndex != null && hoveredX != null && hoveredValues != null && hoveredMonth != null ? (
            <g pointerEvents="none">
              <line
                x1={hoveredX}
                y1={CHART_PADDING_TOP}
                x2={hoveredX}
                y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {CHART_SERIES_META.map((meta) => (
                <circle
                  key={meta.key}
                  cx={chart.series[meta.key][hoveredIndex].x}
                  cy={chart.series[meta.key][hoveredIndex].y}
                  r="3.2"
                  fill={meta.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              <g transform={`translate(${resolveTooltipX(hoveredX)} ${CHART_PADDING_TOP + 8})`}>
                <rect
                  width={TOOLTIP_WIDTH}
                  height={TOOLTIP_HEIGHT}
                  rx="8"
                  fill="#0f172a"
                  opacity="0.94"
                />
                <text x="10" y="16" fill="#f8fafc" fontSize="11" fontWeight="600">
                  Month {hoveredMonth}
                </text>

                {CHART_SERIES_META.map((meta, index) => (
                  <text key={meta.key} x="10" y={34 + index * 14} fill="#e2e8f0" fontSize="10.5">
                    <tspan fill={meta.color}>● </tspan>
                    <tspan>{meta.label}: </tspan>
                    <tspan>{formatCurrency(hoveredValues[meta.key])}</tspan>
                  </text>
                ))}
              </g>
            </g>
          ) : null}
        </svg>

        <p className="text-xs text-muted-foreground">
          Curves show projected balance growth from month 0 to month {months}.
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

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_RIGHT = 16;
const CHART_PADDING_BOTTOM = 26;
const CHART_PADDING_LEFT = 56;

const CHART_SERIES_META = [
  {
    key: "Conservative",
    label: "Conservative",
    color: "#0f766e",
  },
  {
    key: "Moderate",
    label: "Moderate",
    color: "#1d4ed8",
  },
  {
    key: "Aggressive",
    label: "Aggressive",
    color: "#b45309",
  },
] as const;

type SeriesKey = (typeof CHART_SERIES_META)[number]["key"];

type SeriesPoint = {
  x: number;
  y: number;
};

type ChartTicks = {
  value: number;
  y: number;
};

type ChartXTicks = {
  month: number;
  label: string;
  x: number;
};

type ScenarioChartData = {
  yTicks: ChartTicks[];
  xTicks: ChartXTicks[];
  sampledMonths: number[];
  valuesByScenario: Record<SeriesKey, number[]>;
  series: Record<SeriesKey, SeriesPoint[]>;
};

function buildScenarioChartData(
  currentAmount: number,
  monthlyContribution: number,
  months: number,
): ScenarioChartData {
  const samplingStep = resolveSamplingStep(months);
  const sampledMonths = sampleMonths(months, samplingStep);
  const scenarioSnapshotsByMonth = sampledMonths.map((month) =>
    compareScenarios(currentAmount, monthlyContribution, month),
  );

  const valuesByScenario = {
    Conservative: scenarioSnapshotsByMonth.map(
      (snapshot) => snapshot[0].futureValue,
    ),
    Moderate: scenarioSnapshotsByMonth.map(
      (snapshot) => snapshot[1].futureValue,
    ),
    Aggressive: scenarioSnapshotsByMonth.map(
      (snapshot) => snapshot[2].futureValue,
    ),
  } satisfies Record<SeriesKey, number[]>;

  const allValues = Object.values(valuesByScenario).flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yRange = Math.max(1, maxValue - minValue);

  const xMin = CHART_PADDING_LEFT;
  const xMax = CHART_WIDTH - CHART_PADDING_RIGHT;
  const yMin = CHART_PADDING_TOP;
  const yMax = CHART_HEIGHT - CHART_PADDING_BOTTOM;

  const xScale = (month: number): number => {
    if (months === 0) {
      return xMin;
    }

    return xMin + (month / months) * (xMax - xMin);
  };

  const yScale = (value: number): number => {
    const ratio = (value - minValue) / yRange;
    return yMax - ratio * (yMax - yMin);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const value = minValue + yRange * fraction;

    return {
      value,
      y: yScale(value),
    };
  });

  const xTickMonths = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => Math.round(months * fraction))
    .filter((month, index, all) => all.indexOf(month) === index);

  const xTicks = xTickMonths.map((month) => ({
    month,
    label: `${month}m`,
    x: xScale(month),
  }));

  const series = {
    Conservative: sampledMonths.map((month, index) => ({
      x: xScale(month),
      y: yScale(valuesByScenario.Conservative[index]),
    })),
    Moderate: sampledMonths.map((month, index) => ({
      x: xScale(month),
      y: yScale(valuesByScenario.Moderate[index]),
    })),
    Aggressive: sampledMonths.map((month, index) => ({
      x: xScale(month),
      y: yScale(valuesByScenario.Aggressive[index]),
    })),
  } satisfies Record<SeriesKey, SeriesPoint[]>;

  return {
    yTicks,
    xTicks,
    sampledMonths,
    valuesByScenario,
    series,
  };
}

function resolveSamplingStep(months: number): number {
  if (months <= 60) {
    return 1;
  }

  if (months <= 180) {
    return 3;
  }

  return 6;
}

function sampleMonths(months: number, step: number): number[] {
  const result: number[] = [0];

  for (let month = step; month < months; month += step) {
    result.push(month);
  }

  if (result[result.length - 1] !== months) {
    result.push(months);
  }

  return result;
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const TOOLTIP_WIDTH = 172;
const TOOLTIP_HEIGHT = 82;

function mapClientXToViewBoxX(clientX: number, element: SVGRectElement): number {
  const bounds = element.getBoundingClientRect();
  const relativeX = (clientX - bounds.left) / bounds.width;

  return relativeX * CHART_WIDTH;
}

function findNearestSampleIndex(x: number, points: SeriesPoint[]): number {
  let nearestIndex = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const distance = Math.abs(points[index].x - x);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

function resolveTooltipX(crosshairX: number): number {
  const preferredRight = crosshairX + 10;
  const maxLeft = CHART_WIDTH - CHART_PADDING_RIGHT - TOOLTIP_WIDTH;

  if (preferredRight <= maxLeft) {
    return preferredRight;
  }

  const preferredLeft = crosshairX - TOOLTIP_WIDTH - 10;
  return Math.max(CHART_PADDING_LEFT, preferredLeft);
}
