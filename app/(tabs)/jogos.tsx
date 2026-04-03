import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/auth-context";
import { getJogosOverview } from "@/services/jogos.service";
import type { FeaturedMatch, JogosOverview, StandingForm } from "@/types/jogos";

const CHAPE_BADGE = require("../../assets/images/chape_simbolo.jpg");

export default function JogosScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<JogosOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadJogos();
  }, []);

  async function loadJogos(showRefreshing = false) {
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
  }

  function renderFormIcon(form: StandingForm) {
    if (form === "up") {
      return <MaterialIcons name="arrow-drop-up" size={16} color="#5fae66" />;
    }
    if (form === "down") {
      return <MaterialIcons name="arrow-drop-down" size={16} color="#dc6d6d" />;
    }
    return <MaterialIcons name="remove" size={14} color="#9aa39a" />;
  }

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

  function renderTeamBadge(teamName: string) {
    if (isChapeTeam(teamName)) {
      return <Image source={CHAPE_BADGE} style={styles.teamLogo} />;
    }

    return (
      <View style={styles.opponentBadge}>
        <MaterialIcons name="sports-soccer" size={14} color="#566056" />
      </View>
    );
  }

  const featuredMatches = data?.featuredMatches ?? [];
  const standings = data?.standings ?? [];

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../../assets/images/chape_simbolo.jpg")}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadJogos(true)} tintColor="#f5f5f0" />
          }
        >
          <View style={styles.headerBar}>
            <Image source={require("../../assets/images/chape_simbolo.jpg")} style={styles.avatar} />
            <Text style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
          </View>

          {loading ? (
            <View style={styles.feedbackCard}>
              <ActivityIndicator size="large" color="#f5f5f0" />
              <Text style={styles.feedbackText}>Carregando jogos e classificacao...</Text>
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View style={styles.feedbackCard}>
              <MaterialIcons name="wifi-off" size={30} color="#f5f5f0" />
              <Text style={styles.feedbackText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => void loadJogos()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loading && !errorMessage ? (
            <>
              <View style={styles.scoresRow}>
                {featuredMatches.length ? (
                  featuredMatches.map((match, index) => {
                    const variant = getMatchVariant(match);

                    return (
                      <View
                        key={match.id}
                        style={[
                          styles.scoreCard,
                          variant === "live" && styles.scoreCardLive,
                          variant === "upcoming" && styles.scoreCardUpcoming,
                        ]}
                      >
                        <View style={styles.matchMeta}>
                          <View style={[styles.matchBadge, variant === "live" && styles.matchBadgeLive]}>
                            <Text style={[styles.matchBadgeText, variant === "live" && styles.matchBadgeTextLive]}>
                              {getMatchBadge(match, index)}
                            </Text>
                          </View>
                          <Text style={styles.matchTime}>{match.matchTime}</Text>
                        </View>
                        <Text style={styles.matchStatus}>{match.status}</Text>
                        <View style={styles.scoreLine}>
                          <View style={styles.teamBlock}>
                            {renderTeamBadge(match.homeTeam)}
                            <Text style={styles.teamName}>{match.homeTeam}</Text>
                          </View>
                          <Text style={styles.scoreNumber}>{match.homeScore}</Text>
                          <Text style={styles.scoreDivider}>x</Text>
                          <Text style={styles.scoreNumber}>{match.awayScore}</Text>
                          <View style={[styles.teamBlock, styles.teamBlockRight]}>
                            <Text style={styles.teamNameRight}>{match.awayTeam}</Text>
                            {renderTeamBadge(match.awayTeam)}
                          </View>
                        </View>
                        <Text style={styles.venueText}>{match.venue}</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyMatchesCard}>
                    <MaterialIcons name="event-busy" size={26} color="#f5f5f0" />
                    <Text style={styles.feedbackText}>Nenhum jogo encontrado para a Chape nesse período.</Text>
                  </View>
                )}
              </View>

              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>{data?.competition ?? "Campeonato"}</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#f5f5f0" />
              </View>

              <Text style={styles.updatedAt}>
                Atualizado em {new Date(data?.updatedAt ?? "").toLocaleString("pt-BR")}
              </Text>

              <View style={styles.tableCard}>
                <View style={styles.tableTopRow}>
                  <Text style={[styles.tableTopText, styles.colTeam]}>Classificacao</Text>
                  <Text style={[styles.tableTopText, styles.colPts]}>P</Text>
                  <Text style={[styles.tableTopText, styles.colGames]}>J</Text>
                </View>

                {standings.map((item) => (
                  <View
                    key={`${item.position}-${item.team}`}
                    style={[styles.row, item.team === "Chapecoense" && styles.rowHighlight]}
                  >
                    <Text style={styles.position}>{item.position}</Text>
                    <Text style={styles.team}>{item.team}</Text>
                    {renderFormIcon(item.form)}
                    <Text style={styles.points}>{item.points}</Text>
                    <Text style={styles.games}>{item.games}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#073b1a",
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 42, 18, 0.86)",
  },
  content: {
    paddingBottom: 44,
  },
  headerBar: {
    marginTop: 46,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#0c5a2a",
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14381f",
  },
  feedbackCard: {
    marginTop: 44,
    marginHorizontal: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    gap: 12,
  },
  feedbackText: {
    color: "#f5f5f0",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: "#f5f5f0",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#14381f",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scoresRow: {
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  scoreCard: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(12, 90, 42, 0.08)",
  },
  scoreCardLive: {
    borderColor: "rgba(12, 90, 42, 0.45)",
    shadowColor: "#0c5a2a",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  scoreCardUpcoming: {
    backgroundColor: "rgba(236, 244, 237, 0.98)",
  },
  matchMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#eaf1eb",
  },
  matchBadgeLive: {
    backgroundColor: "#0c5a2a",
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0c5a2a",
    textTransform: "uppercase",
  },
  matchBadgeTextLive: {
    color: "#f5f5f0",
  },
  matchStatus: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "600",
    color: "#566056",
  },
  matchTime: {
    fontSize: 11,
    color: "#566056",
  },
  scoreLine: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  teamBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamBlockRight: {
    justifyContent: "flex-end",
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4ddd2",
  },
  opponentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4ddd2",
    backgroundColor: "#f2f5f2",
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#253225",
  },
  teamNameRight: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#253225",
    textAlign: "right",
  },
  scoreNumber: {
    fontSize: 30,
    fontWeight: "800",
    color: "#202420",
    lineHeight: 34,
  },
  scoreDivider: {
    fontSize: 16,
    fontWeight: "700",
    color: "#566056",
  },
  venueText: {
    marginTop: 8,
    fontSize: 11,
    color: "#566056",
  },
  emptyMatchesCard: {
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    gap: 10,
  },
  tableHeader: {
    marginTop: 24,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tableTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#f5f5f0",
  },
  updatedAt: {
    marginTop: 6,
    paddingHorizontal: 40,
    color: "#cfe0d0",
    fontSize: 11,
  },
  tableCard: {
    marginTop: 10,
    marginHorizontal: 32,
    backgroundColor: "rgba(245, 245, 245, 0.96)",
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 9,
  },
  tableTopRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableTopText: {
    fontSize: 8,
    color: "#909890",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5.5,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },
  rowHighlight: {
    backgroundColor: "rgba(43, 159, 75, 0.18)",
    borderRadius: 6,
  },
  position: {
    width: 18,
    fontSize: 10,
    fontWeight: "700",
    color: "#7a7a7a",
    textAlign: "center",
  },
  team: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: "#253225",
  },
  points: {
    width: 22,
    fontSize: 10,
    color: "#374237",
    textAlign: "center",
  },
  games: {
    width: 22,
    fontSize: 10,
    color: "#374237",
    textAlign: "center",
  },
  colTeam: {
    flex: 1,
  },
  colPts: {
    width: 22,
    textAlign: "center",
  },
  colGames: {
    width: 22,
    textAlign: "center",
  },
});
