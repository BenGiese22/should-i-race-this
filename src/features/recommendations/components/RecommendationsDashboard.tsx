"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ThemeToggle from "@/components/ThemeToggle";

import type {
  PerformanceResponse,
  PerformanceView,
  Recommendation,
  RecommendationsResponse,
  RiskLevel,
  RiskMode,
} from "@/features/recommendations/types";
import { getRecommendations } from "@/features/recommendations/data/getRecommendations";
import { getPerformanceSummary } from "@/features/recommendations/data/getPerformanceSummary";

type SortKey =
  | "score"
  | "srRisk"
  | "iratingRisk"
  | "raceLengthMin"
  | "timeSlotLocalHour";
type SortDir = "desc" | "asc";
type SetupFilter = "all" | "fixed" | "open";
type RiskFilterState = {
  low: boolean;
  medium: boolean;
  high: boolean;
};

const MODES: { value: RiskMode; label: string; hint: string }[] = [
  { value: "balanced", label: "Balanced", hint: "Repeatable gains, avoids chaos" },
  { value: "irating_push", label: "iRating Push", hint: "Upside-focused, accepts variance" },
  { value: "sr_recovery", label: "SR Recovery", hint: "Low incidents > position" },
];

const DEFAULT_SORT_KEY: SortKey = "score";
const DEFAULT_SORT_DIR: SortDir = "desc";
const DEFAULT_SETUP: SetupFilter = "all";
const DEFAULT_RISK_FILTERS: RiskFilterState = {
  low: true,
  medium: true,
  high: true,
};

function formatHour(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const period = h >= 12 ? "PM" : "AM";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}:00 ${period}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function riskDotClass(risk: RiskLevel) {
  switch (risk) {
    case "low":
      return "bg-emerald-400";
    case "medium":
      return "bg-amber-400";
    case "high":
      return "bg-rose-400";
  }
}

function riskLabel(risk: RiskLevel) {
  return risk === "low" ? "Low" : risk === "medium" ? "Medium" : "High";
}

function riskRank(risk: RiskLevel) {
  return risk === "low" ? 0 : risk === "medium" ? 1 : 2;
}

function badgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(clamp01(value) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-foreground/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RecommendationsDashboard() {
  const [mode, setMode] = useState<RiskMode>("balanced");
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [performanceView, setPerformanceView] =
    useState<PerformanceView>("series");
  const [performanceData, setPerformanceData] =
    useState<PerformanceResponse | null>(null);

  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSearch, setStatsSearch] = useState("");
  const requestIdRef = useRef(0);

  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT_DIR);
  const [filterSetup, setFilterSetup] = useState<SetupFilter>(DEFAULT_SETUP);
  const [filterRiskLevels, setFilterRiskLevels] = useState<RiskFilterState>(
    DEFAULT_RISK_FILTERS
  );
  const [raceLengthRange, setRaceLengthRange] = useState<[number, number] | null>(
    null
  );
  const [hourRange, setHourRange] = useState<[number, number] | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchRecommendations = useCallback(async (nextMode: RiskMode) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setErr(null);
    setData(null);

    try {
      const response = await getRecommendations(nextMode);
      if (requestId !== requestIdRef.current) return;
      setData(response);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load recommendations.";
      setErr(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(mode);
  }, [fetchRecommendations, mode]);

  useEffect(() => {
    let cancelled = false;
    async function loadPerformance() {
      setStatsErr(null);
      setStatsLoading(true);
      setPerformanceData(null);
      try {
        const response = await getPerformanceSummary(performanceView);
        if (cancelled) return;
        setPerformanceData(response);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load performance summary.";
        setStatsErr(message);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    loadPerformance();
    return () => {
      cancelled = true;
    };
  }, [performanceView]);

  const modeMeta = MODES.find((m) => m.value === mode)!;

  const baseItems = data?.items ?? [];
  const [minRaceLength, maxRaceLength] = useMemo(() => {
    if (baseItems.length === 0) return [0, 0];
    let min = baseItems[0].raceLengthMin;
    let max = baseItems[0].raceLengthMin;
    baseItems.forEach((item) => {
      min = Math.min(min, item.raceLengthMin);
      max = Math.max(max, item.raceLengthMin);
    });
    return [min, max];
  }, [baseItems]);
  const [minHour, maxHour] = useMemo(() => {
    if (baseItems.length === 0) return [0, 23];
    let min = baseItems[0].timeSlotLocalHour;
    let max = baseItems[0].timeSlotLocalHour;
    baseItems.forEach((item) => {
      min = Math.min(min, item.timeSlotLocalHour);
      max = Math.max(max, item.timeSlotLocalHour);
    });
    return [min, max];
  }, [baseItems]);

  useEffect(() => {
    if (baseItems.length === 0) return;
    setRaceLengthRange((prev) => {
      if (!prev) return [minRaceLength, maxRaceLength];
      const nextMin = clamp(prev[0], minRaceLength, maxRaceLength);
      const nextMax = clamp(prev[1], minRaceLength, maxRaceLength);
      return [Math.min(nextMin, nextMax), Math.max(nextMin, nextMax)];
    });
    setHourRange((prev) => {
      if (!prev) return [minHour, maxHour];
      const nextMin = clamp(prev[0], minHour, maxHour);
      const nextMax = clamp(prev[1], minHour, maxHour);
      return [Math.min(nextMin, nextMax), Math.max(nextMin, nextMax)];
    });
  }, [baseItems, minHour, maxHour, minRaceLength, maxRaceLength]);

  const performanceRows = useMemo(() => {
    const rows = performanceData?.rows ?? [];
    const search = statsSearch.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) => row.label.toLowerCase().includes(search));
  }, [performanceData, statsSearch]);

  const visibleRecommendations = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    const [raceMin, raceMax] = raceLengthRange ?? [minRaceLength, maxRaceLength];
    const [hourMin, hourMax] = hourRange ?? [minHour, maxHour];
    const riskSelections = filterRiskLevels;

    const filtered = baseItems.filter((item) => {
      if (search) {
        const haystack = `${item.seriesName} ${item.trackName}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (filterSetup === "fixed" && !item.isFixedSetup) return false;
      if (filterSetup === "open" && item.isFixedSetup) return false;

      const irMatch = riskSelections[item.iratingRisk];
      const srMatch = riskSelections[item.srRisk];
      if (!irMatch && !srMatch) return false;

      if (item.raceLengthMin < raceMin || item.raceLengthMin > raceMax) {
        return false;
      }
      if (
        item.timeSlotLocalHour < hourMin ||
        item.timeSlotLocalHour > hourMax
      ) {
        return false;
      }

      return true;
    });

    const sorted = filtered.slice().sort((a, b) => {
      let delta = 0;
      switch (sortKey) {
        case "score":
          delta = a.score - b.score;
          break;
        case "raceLengthMin":
          delta = a.raceLengthMin - b.raceLengthMin;
          break;
        case "timeSlotLocalHour":
          delta = a.timeSlotLocalHour - b.timeSlotLocalHour;
          break;
        case "srRisk":
          delta = riskRank(a.srRisk) - riskRank(b.srRisk);
          break;
        case "iratingRisk":
          delta = riskRank(a.iratingRisk) - riskRank(b.iratingRisk);
          break;
      }
      return sortDir === "asc" ? delta : -delta;
    });

    return sorted;
  }, [
    baseItems,
    filterRiskLevels,
    filterSetup,
    hourRange,
    maxHour,
    maxRaceLength,
    minHour,
    minRaceLength,
    raceLengthRange,
    searchText,
    sortDir,
    sortKey,
  ]);

  const activeFilterCount = useMemo(() => {
    if (baseItems.length === 0) return 0;
    let count = 0;
    if (sortKey !== DEFAULT_SORT_KEY || sortDir !== DEFAULT_SORT_DIR) count += 1;
    if (filterSetup !== DEFAULT_SETUP) count += 1;
    if (searchText.trim().length > 0) count += 1;
    if (
      filterRiskLevels.low !== DEFAULT_RISK_FILTERS.low ||
      filterRiskLevels.medium !== DEFAULT_RISK_FILTERS.medium ||
      filterRiskLevels.high !== DEFAULT_RISK_FILTERS.high
    ) {
      count += 1;
    }
    const [raceMin, raceMax] = raceLengthRange ?? [minRaceLength, maxRaceLength];
    if (raceMin !== minRaceLength || raceMax !== maxRaceLength) count += 1;
    const [hourMin, hourMax] = hourRange ?? [minHour, maxHour];
    if (hourMin !== minHour || hourMax !== maxHour) count += 1;
    return count;
  }, [
    baseItems.length,
    filterRiskLevels,
    filterSetup,
    hourRange,
    maxHour,
    maxRaceLength,
    minHour,
    minRaceLength,
    raceLengthRange,
    searchText,
    sortDir,
    sortKey,
  ]);

  const displayWeekStart = data?.weekStartDate ?? null;

  const clearFilters = useCallback(() => {
    setSortKey(DEFAULT_SORT_KEY);
    setSortDir(DEFAULT_SORT_DIR);
    setFilterSetup(DEFAULT_SETUP);
    setFilterRiskLevels(DEFAULT_RISK_FILTERS);
    setSearchText("");
    setRaceLengthRange([minRaceLength, maxRaceLength]);
    setHourRange([minHour, maxHour]);
  }, [maxHour, maxRaceLength, minHour, minRaceLength]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Weekly Recommendations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick races that maximize upside while managing iRating/SR risk.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <ThemeToggle />
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-xs font-medium text-muted-foreground">Mode</div>
            <div className="flex items-center gap-3">
              <Select value={mode} onValueChange={(v) => setMode(v as RiskMode)}>
                <SelectTrigger className="h-10 w-[190px]">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden max-w-[280px] text-xs text-muted-foreground sm:block">
                {modeMeta.hint}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm">
                {activeFilterCount > 0
                  ? `Filters (${activeFilterCount})`
                  : "Filters"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="w-[min(720px,94vw)] p-0">
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Search</div>
                  <Input
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Series or track"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Sort by</div>
                    <Select
                      value={sortKey}
                      onValueChange={(value) => setSortKey(value as SortKey)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Score</SelectItem>
                        <SelectItem value="srRisk">SR Risk</SelectItem>
                        <SelectItem value="iratingRisk">iRating Risk</SelectItem>
                        <SelectItem value="raceLengthMin">Race Length</SelectItem>
                        <SelectItem value="timeSlotLocalHour">Start Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Order</div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={sortDir === "desc" ? "secondary" : "ghost"}
                        onClick={() => setSortDir("desc")}
                      >
                        Desc
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={sortDir === "asc" ? "secondary" : "ghost"}
                        onClick={() => setSortDir("asc")}
                      >
                        Asc
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Setup</div>
                  <Select
                    value={filterSetup}
                    onValueChange={(value) => setFilterSetup(value as SetupFilter)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All setups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Risk levels
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                      <label key={level} className="flex items-center gap-2">
                        <Checkbox
                          checked={filterRiskLevels[level]}
                          onCheckedChange={(checked) =>
                            setFilterRiskLevels((prev) => ({
                              ...prev,
                              [level]: checked === true,
                            }))
                          }
                        />
                        <span className="text-muted-foreground">
                          {riskLabel(level)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Race length (min)</span>
                    <span className="tabular-nums">
                      {(raceLengthRange ?? [minRaceLength, maxRaceLength])[0]}–
                      {(raceLengthRange ?? [minRaceLength, maxRaceLength])[1]}
                    </span>
                  </div>
                  <Slider
                    min={minRaceLength}
                    max={maxRaceLength}
                    step={1}
                    value={raceLengthRange ?? [minRaceLength, maxRaceLength]}
                    onValueChange={(value) => {
                      if (value.length < 2) return;
                      setRaceLengthRange([value[0], value[1]]);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Start hour</span>
                    <span className="tabular-nums">
                      {(hourRange ?? [minHour, maxHour])[0]}–
                      {(hourRange ?? [minHour, maxHour])[1]}
                    </span>
                  </div>
                  <Slider
                    min={minHour}
                    max={maxHour}
                    step={1}
                    value={hourRange ?? [minHour, maxHour]}
                    onValueChange={(value) => {
                      if (value.length < 2) return;
                      setHourRange([value[0], value[1]]);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="text-xs text-muted-foreground">
            {searchText.trim() ? `Searching “${searchText.trim()}”` : "Search"}
          </div>
        </div>
      <div className="text-xs text-muted-foreground">
        {baseItems.length === 0
          ? "No sessions"
          : visibleRecommendations.length === baseItems.length
            ? `${baseItems.length} sessions`
            : `${visibleRecommendations.length} of ${baseItems.length} sessions`}
      </div>
    </div>

    <div className="mt-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base font-medium">
                Performance Summary
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {performanceData?.window.label ?? "Current + Previous Season"}
              </div>
            </div>
            <Select
              value={performanceView}
              onValueChange={(value) =>
                setPerformanceView(value as PerformanceView)
              }
            >
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="series">Series scores</SelectItem>
                <SelectItem value="track">Track scores</SelectItem>
                <SelectItem value="combo">Series + Track scores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={statsSearch}
              onChange={(event) => setStatsSearch(event.target.value)}
              placeholder="Search series or track"
              className="h-9 sm:max-w-[260px]"
            />
            <div className="text-xs text-muted-foreground">
              {statsLoading
                ? "Loading…"
                : statsErr
                  ? "Unable to load performance"
                  : `${performanceRows.length} rows`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {statsErr ? (
            <div className="text-sm text-muted-foreground">{statsErr}</div>
          ) : statsLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading performance summary…
            </div>
          ) : performanceRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No data for this view in the selected window.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Starts</TableHead>
                  <TableHead className="text-right">Avg Finish</TableHead>
                  <TableHead className="text-right">Inc/Race</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.starts}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.avgFinish.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.incPerRace.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>

      {/* Table Card */}
      <Card className="mt-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-medium">
            {displayWeekStart ? `Week starting ${displayWeekStart}` : "This week"}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {loading
              ? "Loading…"
              : err
                ? "Unable to load recommendations"
                : `${visibleRecommendations.length} sessions`}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Series</TableHead>
                  <TableHead className="w-[28%]">Track</TableHead>
                  <TableHead className="w-[14%]">Time</TableHead>
                  <TableHead className="w-[12%]">Score</TableHead>
                  <TableHead className="w-[24%]">Risk</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Loading recommendations…
                    </TableCell>
                  </TableRow>
                ) : err ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{err}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fetchRecommendations(mode)}
                        >
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : baseItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No recommendations found.
                    </TableCell>
                  </TableRow>
                ) : visibleRecommendations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>No results match these filters.</span>
                        <Button size="sm" variant="secondary" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRecommendations.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelected(row);
                        setOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{row.seriesName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.trackName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatHour(row.timeSlotLocalHour)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(row.score)} className="tabular-nums">
                          {row.score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass(row.iratingRisk)}`} />
                            <span>iR: {riskLabel(row.iratingRisk)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass(row.srRisk)}`} />
                            <span>SR: {riskLabel(row.srRisk)}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer (Dialog) */}
      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <div className="text-xs text-muted-foreground">
                  {formatHour(selected.timeSlotLocalHour)} • {selected.raceLengthMin}m •{" "}
                  {selected.isFixedSetup ? "Fixed" : "Open"}
                </div>
                <DialogTitle className="text-lg">
                  {selected.seriesName} — {selected.trackName}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">
                      {selected.score}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">iRating Risk</div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass(selected.iratingRisk)}`} />
                      {riskLabel(selected.iratingRisk)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">SR Risk</div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass(selected.srRisk)}`} />
                      {riskLabel(selected.srRisk)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="text-sm font-medium">Expected Finish</div>
                <div className="text-sm text-muted-foreground">
                  {selected.expectedFinishDeltaPositions >= 0 ? "+" : ""}
                  {selected.expectedFinishDeltaPositions.toFixed(1)} positions vs grid
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="text-sm font-medium">Notes</div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {selected.notes?.length ? (
                    selected.notes.slice(0, 6).map((n, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                        <span>{n}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No notes available.</li>
                  )}
                </ul>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="text-sm font-medium">Score Breakdown</div>
                <Bar label="Performance" value={selected.breakdown.performance} />
                <Bar label="Safety" value={selected.breakdown.safety} />
                <Bar label="Consistency" value={selected.breakdown.consistency} />
                <Bar label="Predictability" value={selected.breakdown.predictability} />
                <Bar label="Familiarity" value={selected.breakdown.familiarity} />
              </div>

              <div className="pt-3 text-xs text-muted-foreground">
                (Fatigue/attrition/volatility are currently modeled as penalties; we’ll visualize them next.)
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
