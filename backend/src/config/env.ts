import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function optionalNullable(name: string): string | null {
  return process.env[name] ?? null;
}

export const env = {
  port: Number(optional("PORT", "3333")),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  footballDataBaseUrl: optional("FOOTBALL_DATA_BASE_URL", "https://api.football-data.org/v4"),
  footballDataToken: optionalNullable("FOOTBALL_DATA_TOKEN"),
  footballDataCompetitionCode: optional("FOOTBALL_DATA_COMPETITION_CODE", "BSA"),
  footballDataTeamName: optional("FOOTBALL_DATA_TEAM_NAME", "Chapecoense"),
};
