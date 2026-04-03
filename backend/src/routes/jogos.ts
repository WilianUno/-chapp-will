import { Router } from "express";

import { env } from "../config/env";
import { FootballDataError, fetchFootballData } from "../lib/football-data";
import { requireAuth } from "../middleware/auth";

const jogosRouter = Router();

type JsonRecord = Record<string, unknown>;
type StandingForm = "up" | "down" | "stable";

type FeaturedMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  matchTime: string;
  venue: string;
  sortKey: number;
};

type JogosOverviewResponse = {
  competition: string;
  updatedAt: string;
  featuredMatches: Omit<FeaturedMatch, "sortKey">[];
  standings: {
    position: number;
    team: string;
    points: number;
    games: number;
    form: StandingForm;
  }[];
};

const OVERVIEW_CACHE_TTL_MS = 5 * 60 * 1000;

let overviewCache: {
  data: JogosOverviewResponse;
  expiresAt: number;
} | null = null;

function toRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function getTeamAliases(teamName: string): string[] {
  const aliases = [teamName];
  const normalized = normalizeText(teamName);

  if (normalized === "chapecoense") {
    aliases.push("chapecoense af", "associacao chapecoense de futebol");
  }

  return aliases.map(normalizeText);
}

function isTargetTeam(name: string, aliases: string[]): boolean {
  const normalized = normalizeText(name);
  return aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized));
}

function formatMatchTime(date: Date | null): string {
  if (!date) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getMatchStatus(status: string | null): string {
  switch (status) {
    case "IN_PLAY":
    case "PAUSED":
      return "Ao vivo";
    case "FINISHED":
      return "Encerrado";
    case "SCHEDULED":
    case "TIMED":
      return "Próximo jogo";
    case "POSTPONED":
      return "Adiado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status ?? "Agendado";
  }
}

function parseFormTrend(form: unknown): StandingForm {
  if (typeof form !== "string" || !form.trim()) {
    return "stable";
  }

  const tokens = form.split(/[,\s]+/).filter(Boolean);
  const lastToken = tokens.at(-1)?.toUpperCase();

  if (lastToken === "W") {
    return "up";
  }

  if (lastToken === "L") {
    return "down";
  }

  return "stable";
}

function toFeaturedMatch(match: JsonRecord): FeaturedMatch {
  const homeTeam = toRecord(match.homeTeam);
  const awayTeam = toRecord(match.awayTeam);
  const score = toRecord(match.score);
  const fullTime = toRecord(score?.fullTime);
  const utcDate = toStringValue(match.utcDate);
  const parsedDate = utcDate ? new Date(utcDate) : null;
  const id = toNumberValue(match.id) ?? `${toStringValue(homeTeam?.name) ?? "home"}-${toStringValue(awayTeam?.name) ?? "away"}-${utcDate ?? "sem-data"}`;

  return {
    id: String(id),
    homeTeam: toStringValue(homeTeam?.shortName) ?? toStringValue(homeTeam?.name) ?? "Mandante",
    awayTeam: toStringValue(awayTeam?.shortName) ?? toStringValue(awayTeam?.name) ?? "Visitante",
    homeScore: toNumberValue(fullTime?.home) ?? 0,
    awayScore: toNumberValue(fullTime?.away) ?? 0,
    status: getMatchStatus(toStringValue(match.status)),
    matchTime: formatMatchTime(parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null),
    venue: toStringValue(match.venue) ?? "Local indisponível",
    sortKey: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : 0,
  };
}

function buildFeaturedMatches(matches: JsonRecord[], aliases: string[]) {
  const filteredMatches = matches.filter((match) => {
    const homeTeam = toRecord(match.homeTeam);
    const awayTeam = toRecord(match.awayTeam);
    const homeName = toStringValue(homeTeam?.name) ?? "";
    const awayName = toStringValue(awayTeam?.name) ?? "";

    return isTargetTeam(homeName, aliases) || isTargetTeam(awayName, aliases);
  });

  const mappedMatches = filteredMatches.map(toFeaturedMatch);
  const now = Date.now();

  const liveMatch = mappedMatches
    .filter((match) => match.status === "Ao vivo")
    .sort((a, b) => a.sortKey - b.sortKey)
    .at(0);
  const previousMatch = mappedMatches
    .filter((match) => match.sortKey <= now && match.status !== "Ao vivo")
    .sort((a, b) => b.sortKey - a.sortKey)
    .at(0);
  const nextMatches = mappedMatches
    .filter((match) => match.sortKey > now)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 2);

  const uniqueMatches = new Map<string, Omit<FeaturedMatch, "sortKey">>();

  for (const match of [liveMatch, previousMatch, ...nextMatches]) {
    if (!match) {
      continue;
    }

    const { sortKey: _sortKey, ...safeMatch } = match;
    if (!uniqueMatches.has(safeMatch.id)) {
      uniqueMatches.set(safeMatch.id, safeMatch);
    }
  }

  return [...uniqueMatches.values()];
}

function buildStandings(payload: unknown) {
  const record = toRecord(payload);
  const standings = toArray(record?.standings)
    .map((entry) => toRecord(entry))
    .filter((entry): entry is JsonRecord => entry !== null);

  const totalStanding =
    standings.find((entry) => toStringValue(entry.type)?.toUpperCase() === "TOTAL") ?? standings.at(0) ?? null;

  const table = toArray(totalStanding?.table)
    .map((entry) => toRecord(entry))
    .filter((entry): entry is JsonRecord => entry !== null);

  return table.map((entry) => {
    const team = toRecord(entry.team);

    return {
      position: toNumberValue(entry.position) ?? 0,
      team: toStringValue(team?.shortName) ?? toStringValue(team?.name) ?? "Time indefinido",
      points: toNumberValue(entry.points) ?? 0,
      games: toNumberValue(entry.playedGames) ?? 0,
      form: parseFormTrend(entry.form),
    };
  });
}

function buildMatchesPath() {
  const now = new Date();
  const dateFrom = new Date(now);
  const dateTo = new Date(now);

  dateFrom.setDate(dateFrom.getDate() - 180);
  dateTo.setDate(dateTo.getDate() + 180);

  const from = dateFrom.toISOString().slice(0, 10);
  const to = dateTo.toISOString().slice(0, 10);

  return `/competitions/${env.footballDataCompetitionCode}/matches?dateFrom=${from}&dateTo=${to}`;
}

async function buildOverview(): Promise<JogosOverviewResponse> {
  const [standingsPayload, matchesPayload] = await Promise.all([
    fetchFootballData(`/competitions/${env.footballDataCompetitionCode}/standings`),
    fetchFootballData(buildMatchesPath()),
  ]);

  const matchesRecord = toRecord(matchesPayload);
  const competitionRecord = toRecord(standingsPayload);
  const matches = toArray(matchesRecord?.matches)
    .map((entry) => toRecord(entry))
    .filter((entry): entry is JsonRecord => entry !== null);
  const aliases = getTeamAliases(env.footballDataTeamName);

  return {
    competition: toStringValue(competitionRecord?.name) ?? "Campeonato Brasileiro Série B",
    updatedAt: new Date().toISOString(),
    featuredMatches: buildFeaturedMatches(matches, aliases),
    standings: buildStandings(standingsPayload),
  };
}

jogosRouter.get("/overview", requireAuth, async (_req, res) => {
  const now = Date.now();

  if (overviewCache && overviewCache.expiresAt > now) {
    return res.json(overviewCache.data);
  }

  try {
    const overview = await buildOverview();
    overviewCache = {
      data: overview,
      expiresAt: now + OVERVIEW_CACHE_TTL_MS,
    };

    return res.json(overview);
  } catch (error) {
    if (error instanceof FootballDataError && error.status === 429 && overviewCache) {
      return res.json(overviewCache.data);
    }

    const message = error instanceof Error ? error.message : "Falha ao carregar jogos";
    return res.status(502).json({ message });
  }
});

export { jogosRouter };
