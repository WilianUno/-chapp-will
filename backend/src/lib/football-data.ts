import { env } from "../config/env";

type JsonRecord = Record<string, unknown>;

export class FootballDataError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FootballDataError";
    this.status = status;
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const record = data as JsonRecord;
  const message = record.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

export async function fetchFootballData(path: string): Promise<unknown> {
  if (!env.footballDataToken) {
    throw new Error("Configure FOOTBALL_DATA_TOKEN em backend/.env para carregar os jogos da Chapecoense.");
  }

  const baseUrl = env.footballDataBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "X-Auth-Token": env.footballDataToken,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let responseData: unknown = null;

    try {
      responseData = (await response.json()) as unknown;
    } catch {
      responseData = null;
    }

    const defaultMessage = `football-data.org respondeu com HTTP ${response.status} em ${path}.`;
    const upstreamMessage = getErrorMessage(responseData, defaultMessage);

    if (response.status === 401) {
      throw new FootballDataError(
        "FOOTBALL_DATA_TOKEN invalido ou expirado no backend. Gere um novo token em football-data.org e atualize backend/.env.",
        response.status
      );
    }

    if (response.status === 403) {
      throw new FootballDataError(
        "FOOTBALL_DATA_TOKEN sem permissao para acessar este recurso da Serie B no football-data.org. Verifique o plano/token da conta.",
        response.status
      );
    }

    if (response.status === 429) {
      throw new FootballDataError(
        "Limite de requisicoes do football-data.org atingido. Aguarde um pouco e tente novamente.",
        response.status
      );
    }

    throw new FootballDataError(upstreamMessage, response.status);
  }

  return (await response.json()) as unknown;
}
