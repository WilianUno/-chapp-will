import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedEnter } from "@/components/animated-enter";
import { StateCard } from "@/components/state-card";
import { ChapeTheme } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getJogosOverview } from "@/services/jogos.service";
import type { FeaturedMatch, JogosOverview, RecentForm, Standing } from "@/types/jogos";

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");
const USER_AVATAR = require("../../assets/images/personagem.png");

export default function JogosScreen() {
  const layout = useResponsiveLayout();
  const { user } = useAuth();
  const [data, setData] = useState<JogosOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCompetitionFilter, setSelectedCompetitionFilter] = useState("all");

  const loadJogos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);
      const response = await getJogosOverview();
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar jogos";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadJogos();
  }, [loadJogos]);

  function isChapeTeam(teamName: string) {
    const normalized = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized.includes("chapecoense") || normalized.includes("chape");
  }

  function getMatchVariant(match: FeaturedMatch) {
    const normalizedStatus = match.status.toLowerCase();

    if (normalizedStatus.includes("ao vivo")) {
      return "live";
    }

    if (normalizedStatus.includes("encerrado")) {
      return "finished";
    }

    return "upcoming";
  }

  function getMatchBadge(match: FeaturedMatch, index: number) {
    const variant = getMatchVariant(match);

    if (variant === "live") {
      return "Ao vivo";
    }

    if (variant === "finished") {
      return index === 0 ? "Último jogo" : "Encerrado";
    }

    return index === 0 ? "Próximo jogo" : "Na sequência";
  }

  function getTeamBadgeSource(teamName: string, crestUrl?: string | null): ImageSourcePropType | null {
    if (isChapeTeam(teamName)) {
      return CHAPE_BADGE;
    }

    if (crestUrl) {
      return { uri: crestUrl };
    }

    return null;
  }

  const featuredMatches = useMemo(() => data?.featuredMatches ?? [], [data?.featuredMatches]);
  const standings = data?.standings ?? [];
  const isCompact = layout.isCompact;
  const seasonLabel = new Date(data?.updatedAt ?? Date.now()).getFullYear().toString();
  const leagueLabel = data?.competition ?? "Brasileirão Série A";
  const competitionFilters = useMemo(() => {
    const uniqueCompetitions = new Map<string, { key: string; label: string }>();

    for (const match of featuredMatches) {
      const key = match.competitionCode ?? match.competitionName;

      if (!uniqueCompetitions.has(key)) {
        uniqueCompetitions.set(key, {
          key,
          label: match.competitionName,
        });
      }
    }

    return [{ key: "all", label: "Todas" }, ...uniqueCompetitions.values()];
  }, [featuredMatches]);
  const filteredFeaturedMatches =
    selectedCompetitionFilter === "all"
      ? featuredMatches
      : featuredMatches.filter((match) => (match.competitionCode ?? match.competitionName) === selectedCompetitionFilter);

  const chapeStanding = standings.find((item) => isChapeTeam(item.team));
  const standingsSummary = [
    { label: "competição", value: data?.competition ?? "Calendário" },
    { label: "jogos em foco", value: String(featuredMatches.length).padStart(2, "0") },
    { label: "posição atual", value: chapeStanding ? `${chapeStanding.position}º` : "--" },
  ];

  useEffect(() => {
    if (!competitionFilters.some((competition) => competition.key === selectedCompetitionFilter)) {
      setSelectedCompetitionFilter("all");
    }
  }, [competitionFilters, selectedCompetitionFilter]);

  return (
    <View style={styles.root}>
      <ImageBackground source={CHAPE_BADGE} resizeMode="cover" style={styles.background} imageStyle={styles.bgImage}>
        <View style={styles.overlay} />
        <View style={[styles.orb, styles.orbTop]} />
        <View style={[styles.orb, styles.orbBottom]} />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.topPadding,
              paddingHorizontal: layout.screenPadding,
              paddingBottom: layout.bottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadJogos(true)} tintColor="#f7f5eb" />
          }
        >
          <View style={styles.profilePill}>
            <Image source={USER_AVATAR} style={styles.avatar} />
            <View style={styles.profileCopy}>
              <Text style={styles.profileEyebrow}>Central de jogos</Text>
              <Text numberOfLines={1} style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
            </View>
          </View>

          <AnimatedEnter delay={40}>
            <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Agenda e classificação</Text>
            <Text style={[styles.heroTitle, layout.isSmallPhone && styles.heroTitleCompact]}>
              {data?.competition ?? "Acompanhe a campanha da Chape"}
            </Text>
            <Text style={styles.heroSubtitle}>
              Cards de partidas com leitura mais direta e tabela com hierarquia melhor para acompanhar o momento do clube.
            </Text>

            <View style={[styles.summaryRow, isCompact && styles.stackColumn]}>
              {standingsSummary.map((item) => (
                <View key={item.label} style={[styles.summaryCard, isCompact && styles.fullWidthCard]}>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {data?.updatedAt ? (
              <View style={styles.updatedPill}>
                <MaterialIcons name="schedule" size={14} color={ChapeTheme.colors.textMuted} />
                <Text style={styles.updatedText}>
                  Atualizado em {new Date(data.updatedAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ) : null}
            </View>
          </AnimatedEnter>

          {loading ? (
            <AnimatedEnter delay={90}>
              <StateCard
                loading
                title="Carregando jogos"
                description="Buscando agenda em destaque e classificação da competição."
              />
            </AnimatedEnter>
          ) : null}

          {!loading && errorMessage ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="wifi-off"
                title="Falha ao carregar jogos"
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={() => void loadJogos()}
              />
            </AnimatedEnter>
          ) : null}

          {!loading && !errorMessage ? (
            <>
              <AnimatedEnter delay={120} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Partidas</Text>
                <Text style={styles.sectionTitle}>Recorte mais importante do calendário</Text>
              </AnimatedEnter>

              {competitionFilters.length > 1 ? (
                <AnimatedEnter delay={135} style={styles.matchFiltersWrap}>
                  {competitionFilters.map((competition) => (
                    <Pressable
                      key={competition.key}
                      style={[
                        styles.matchFilterChip,
                        selectedCompetitionFilter === competition.key && styles.matchFilterChipActive,
                      ]}
                      onPress={() => setSelectedCompetitionFilter(competition.key)}
                    >
                      <Text
                        style={[
                          styles.matchFilterChipText,
                          selectedCompetitionFilter === competition.key && styles.matchFilterChipTextActive,
                        ]}
                      >
                        {competition.label}
                      </Text>
                    </Pressable>
                  ))}
                </AnimatedEnter>
              ) : null}

              <View style={styles.matchesColumn}>
                {filteredFeaturedMatches.length ? (
                  filteredFeaturedMatches.map((match, index) => {
                    const variant = getMatchVariant(match);

                    return (
                      <AnimatedEnter
                        key={match.id}
                        delay={150 + index * 50}
                        style={[
                          styles.matchCard,
                          variant === "live" && styles.matchCardLive,
                          variant === "upcoming" && styles.matchCardUpcoming,
                        ]}
                      >
                        <View style={styles.matchHeader}>
                          <View style={[styles.matchBadge, variant === "live" && styles.matchBadgeLive]}>
                            <Text style={[styles.matchBadgeText, variant === "live" && styles.matchBadgeTextLive]}>
                              {getMatchBadge(match, index)}
                            </Text>
                          </View>
                          <Text style={styles.matchTime}>{match.matchTime}</Text>
                        </View>

                        <View style={styles.matchCompetitionRow}>
                          <Text style={styles.matchCompetitionText}>
                            {match.competitionCode ? `${match.competitionName} • ${match.competitionCode}` : match.competitionName}
                          </Text>
                        </View>

                        <Text style={styles.matchStatus}>{match.status}</Text>

                        <View style={[styles.matchScoreRow, layout.isSmallPhone && styles.matchScoreRowCompact]}>
                          <TeamBlock
                            align="left"
                            logo={<TeamBadge source={getTeamBadgeSource(match.homeTeam, match.homeTeamCrest)} />}
                            name={match.homeTeam}
                          />
                          <View style={styles.scoreCenter}>
                            <Text style={[styles.scoreValue, layout.isSmallPhone && styles.scoreValueCompact]}>
                              {match.homeScore}
                            </Text>
                            <Text style={styles.scoreDivider}>x</Text>
                            <Text style={[styles.scoreValue, layout.isSmallPhone && styles.scoreValueCompact]}>
                              {match.awayScore}
                            </Text>
                          </View>
                          <TeamBlock
                            align="right"
                            logo={<TeamBadge source={getTeamBadgeSource(match.awayTeam, match.awayTeamCrest)} />}
                            name={match.awayTeam}
                          />
                        </View>

                        <View style={styles.venueRow}>
                          <MaterialIcons name="place" size={14} color={ChapeTheme.colors.textSubtle} />
                          <Text style={styles.venueText}>{match.venue}</Text>
                        </View>
                      </AnimatedEnter>
                    );
                  })
                ) : (
                  <AnimatedEnter delay={150}>
                    <StateCard
                      icon="event-busy"
                      title="Nenhum jogo encontrado"
                      description="Não apareceu nenhuma partida da Chape para a competição selecionada."
                    />
                  </AnimatedEnter>
                )}
              </View>

              <AnimatedEnter delay={320} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Tabela</Text>
                <Text style={styles.sectionTitle}>Classificação</Text>
              </AnimatedEnter>

              <AnimatedEnter delay={360} style={styles.tableCard}>
                <View style={styles.tableFiltersRow}>
                  <TableFilter label="Liga" value={leagueLabel} />
                  <TableFilter label="Temporada" value={seasonLabel} />
                </View>

                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderText, styles.colPosition]}>#</Text>
                  <Text style={[styles.tableHeaderText, styles.colTeam]}>Clube</Text>
                  <Text style={[styles.tableHeaderText, styles.colGoalsAgainst]}>GC</Text>
                  <Text style={[styles.tableHeaderText, styles.colGoalDifference]}>SG</Text>
                  <Text style={[styles.tableHeaderText, styles.colLastFive]}>Últimas 5</Text>
                </View>

                {standings.map((item) => (
                  <StandingRow key={`${item.position}-${item.team}`} item={item} highlight={isChapeTeam(item.team)} />
                ))}
              </AnimatedEnter>
            </>
          ) : null}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function TeamBlock({
  align,
  logo,
  name,
}: {
  align: "left" | "right";
  logo: React.ReactNode;
  name: string;
}) {
  return (
    <View style={[styles.teamBlock, align === "right" && styles.teamBlockRight]}>
      {align === "left" ? logo : null}
      <Text style={[styles.teamName, align === "right" && styles.teamNameRight]}>{name}</Text>
      {align === "right" ? logo : null}
    </View>
  );
}

function TeamBadge({ source }: { source: ImageSourcePropType | null }) {
  const [failed, setFailed] = useState(false);

  if (!source || failed) {
    return (
      <View style={styles.opponentBadge}>
        <MaterialIcons name="sports-soccer" size={14} color={ChapeTheme.colors.textSubtle} />
      </View>
    );
  }

  return <Image source={source} style={styles.teamLogo} onError={() => setFailed(true)} />;
}

function TableFilter({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableFilter}>
      <Text style={styles.tableFilterLabel}>{label}</Text>
      <View style={styles.tableFilterValueRow}>
        <Text numberOfLines={1} style={styles.tableFilterValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StandingCrest({ teamName, crest }: { teamName: string; crest?: string | null }) {
  const [failed, setFailed] = useState(false);
  const isChape = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("chapecoense");

  if ((!crest && !isChape) || failed) {
    return (
      <View style={styles.standingCrestFallback}>
        <MaterialIcons name="shield" size={14} color={ChapeTheme.colors.textSubtle} />
      </View>
    );
  }

  return (
    <Image
      source={isChape ? CHAPE_BADGE : { uri: crest }}
      style={styles.standingCrest}
      onError={() => setFailed(true)}
    />
  );
}

function StandingFormDot({ result }: { result: RecentForm }) {
  const isWin = result === "W";
  const isLoss = result === "L";
  const iconName = isWin ? "check" : isLoss ? "close" : "remove";

  return (
    <View
      style={[
        styles.formDot,
        isWin && styles.formDotWin,
        isLoss && styles.formDotLoss,
        result === "D" && styles.formDotDraw,
      ]}
    >
      <MaterialIcons
        name={iconName}
        size={12}
        color={isWin ? "#0f301c" : isLoss ? "#fff2ef" : "#f3f2f8"}
      />
    </View>
  );
}

function getFormSlots(lastFive: RecentForm[]) {
  const normalized = lastFive.slice(-5);

  if (normalized.length >= 5) {
    return normalized;
  }

  return [...Array<RecentForm | null>(5 - normalized.length).fill(null), ...normalized];
}

function StandingRow({
  item,
  highlight,
}: {
  item: Standing;
  highlight: boolean;
}) {
  return (
    <View style={[styles.tableRow, highlight && styles.tableRowHighlight]}>
      <Text style={[styles.tableCell, styles.colPosition]}>{item.position}</Text>
      <View style={styles.colTeam}>
        <View style={styles.teamCellWrap}>
          <StandingCrest teamName={item.team} crest={item.crest} />
          <View style={styles.teamCellTextWrap}>
            <Text numberOfLines={1} style={[styles.tableCell, styles.teamCellText, highlight && styles.teamHighlight]}>
              {item.team}
            </Text>
            <Text style={styles.teamCellMeta}>{item.points} pts</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.tableCell, styles.colGoalsAgainst]}>{item.goalsAgainst}</Text>
      <Text style={[styles.tableCell, styles.colGoalDifference]}>
        {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
      </Text>
      <View style={styles.colLastFive}>
        <View style={styles.lastFiveWrap}>
          {getFormSlots(item.lastFive).map((result, index) =>
            result ? (
              <StandingFormDot key={`${item.team}-${index}-${result}`} result={result} />
            ) : (
              <View key={`${item.team}-${index}-empty`} style={[styles.formDot, styles.formDotEmpty]} />
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ChapeTheme.colors.page,
  },
  background: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ChapeTheme.colors.overlay,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTop: {
    width: 240,
    height: 240,
    top: -70,
    right: -46,
    backgroundColor: "rgba(123, 216, 255, 0.08)",
  },
  orbBottom: {
    width: 300,
    height: 300,
    bottom: 70,
    left: -150,
    backgroundColor: "rgba(215, 240, 106, 0.07)",
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  profilePill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.92)",
  },
  profileCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: ChapeTheme.colors.primary,
  },
  profileEyebrow: {
    fontSize: 11,
    color: ChapeTheme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  profileName: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#102015",
  },
  heroCard: {
    marginTop: 20,
    padding: 24,
    borderRadius: ChapeTheme.radii.lg,
    backgroundColor: "rgba(13, 48, 28, 0.86)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.borderStrong,
    ...ChapeTheme.shadow,
  },
  heroEyebrow: {
    color: ChapeTheme.colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 10,
    color: ChapeTheme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  heroSubtitle: {
    marginTop: 10,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  stackColumn: {
    flexDirection: "column",
  },
  summaryCard: {
    flex: 1,
    minHeight: 96,
    padding: 14,
    borderRadius: ChapeTheme.radii.sm,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
    justifyContent: "space-between",
  },
  fullWidthCard: {
    width: "100%",
    flex: 0,
  },
  summaryValue: {
    color: ChapeTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryLabel: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  updatedPill: {
    alignSelf: "flex-start",
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
  },
  updatedText: {
    color: ChapeTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  feedbackCard: {
    marginTop: 20,
    padding: 24,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: ChapeTheme.colors.surfaceMuted,
    alignItems: "center",
    gap: 12,
  },
  feedbackText: {
    color: ChapeTheme.colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: ChapeTheme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: ChapeTheme.radii.pill,
  },
  retryText: {
    color: "#102015",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: ChapeTheme.colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    marginTop: 6,
    color: ChapeTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  matchesColumn: {
    gap: 12,
  },
  matchFiltersWrap: {
    marginBottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  matchFilterChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(247, 245, 235, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchFilterChipActive: {
    backgroundColor: "rgba(215, 240, 106, 0.18)",
    borderColor: "rgba(215, 240, 106, 0.32)",
  },
  matchFilterChipText: {
    color: ChapeTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  matchFilterChipTextActive: {
    color: ChapeTheme.colors.text,
  },
  matchCard: {
    padding: 18,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(8, 28, 17, 0.88)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
  },
  matchCardLive: {
    borderColor: "rgba(99, 212, 130, 0.5)",
    backgroundColor: "rgba(11, 41, 24, 0.96)",
  },
  matchCardUpcoming: {
    backgroundColor: "rgba(16, 52, 31, 0.92)",
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.08)",
  },
  matchBadgeLive: {
    backgroundColor: "rgba(99, 212, 130, 0.16)",
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: ChapeTheme.colors.accentSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  matchBadgeTextLive: {
    color: "#d9ffe6",
  },
  matchTime: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
  },
  matchStatus: {
    marginTop: 10,
    color: ChapeTheme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  matchCompetitionRow: {
    marginTop: 12,
  },
  matchCompetitionText: {
    color: ChapeTheme.colors.gold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchScoreRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  matchScoreRowCompact: {
    gap: 8,
  },
  teamBlock: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamBlockRight: {
    alignItems: "center",
  },
  teamLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: ChapeTheme.colors.borderStrong,
  },
  opponentBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    color: ChapeTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  teamNameRight: {
    textAlign: "center",
  },
  scoreCenter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  scoreValue: {
    color: ChapeTheme.colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
  },
  scoreValueCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  scoreDivider: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 18,
    fontWeight: "700",
  },
  venueRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  venueText: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 12,
  },
  emptyMatchesCard: {
    padding: 24,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
    alignItems: "center",
    gap: 10,
  },
  tableCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "rgba(17, 18, 21, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...ChapeTheme.shadow,
  },
  tableFiltersRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tableFilter: {
    flex: 1,
    minWidth: 0,
  },
  tableFilterLabel: {
    color: "rgba(255, 255, 255, 0.48)",
    fontSize: 11,
    marginBottom: 6,
  },
  tableFilterValueRow: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tableFilterValue: {
    flex: 1,
    color: ChapeTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  tableHeaderText: {
    color: "rgba(255, 255, 255, 0.48)",
    fontSize: 10,
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tableRowHighlight: {
    backgroundColor: "rgba(94, 126, 255, 0.12)",
  },
  tableCell: {
    color: ChapeTheme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  teamHighlight: {
    color: "#f8fbff",
    fontWeight: "800",
  },
  colPosition: {
    width: 26,
    textAlign: "center",
  },
  colTeam: {
    flex: 1,
  },
  colGoalsAgainst: {
    width: 34,
    textAlign: "center",
  },
  colGoalDifference: {
    width: 38,
    textAlign: "center",
  },
  colLastFive: {
    width: 98,
    alignItems: "flex-end",
  },
  teamCellWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamCellTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  teamCellText: {
    fontSize: 14,
  },
  teamCellMeta: {
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.42)",
    fontSize: 11,
    fontWeight: "600",
  },
  standingCrest: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  standingCrestFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  lastFiveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  formDot: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(195, 199, 208, 0.3)",
  },
  formDotWin: {
    backgroundColor: "#5ad276",
  },
  formDotLoss: {
    backgroundColor: "#ff554f",
  },
  formDotDraw: {
    backgroundColor: "#8d8699",
  },
  formDotEmpty: {
    backgroundColor: "rgba(195, 199, 208, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
});
