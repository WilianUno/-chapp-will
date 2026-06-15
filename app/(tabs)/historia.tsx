import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
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
import { getHistoriaOverview } from "@/services/historia.service";
import type { HistoriaOverview } from "@/types/historia";

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");
const USER_AVATAR = require("../../assets/images/personagem.png");

export default function HistoriaScreen() {
  const layout = useResponsiveLayout();
  const { user } = useAuth();
  const [data, setData] = useState<HistoriaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadHistoria();
  }, []);

  async function loadHistoria(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);
      const response = await getHistoriaOverview();
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar história";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      { label: "fundação", value: data?.foundedAt ?? "10 de maio de 1973" },
      { label: "cidade", value: data?.city ?? "Chapeco - SC" },
      { label: "marcos", value: String(data?.timeline.length ?? 0).padStart(2, "0") },
    ],
    [data?.city, data?.foundedAt, data?.timeline.length]
  );
  const isCompact = layout.isCompact;

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
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadHistoria(true)} tintColor="#f7f5eb" />
          }
        >
          <View style={styles.profilePill}>
            <Image source={USER_AVATAR} style={styles.avatar} />
            <View style={styles.profileCopy}>
              <Text style={styles.profileEyebrow}>Memória viva</Text>
              <Text numberOfLines={1} style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
            </View>
          </View>

          <AnimatedEnter delay={40}>
            <View style={styles.heroCard}>
              <View style={[styles.heroTop, layout.isSmallPhone && styles.heroTopCompact]}>
              <Image source={CHAPE_BADGE} style={styles.crest} />
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>História da Chape</Text>
                <Text style={[styles.heroTitle, layout.isSmallPhone && styles.heroTitleCompact]}>
                  {data?.clubName ?? "Associação Chapecoense de Futebol"}
                </Text>
                <Text style={styles.heroSubtitle}>
                  Uma linha do tempo mais clara, com melhor leitura dos marcos que constroem a identidade alviverde.
                </Text>
              </View>
            </View>

            <View style={[styles.summaryRow, isCompact && styles.stackColumn]}>
              {summaryCards.map((item) => (
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
                title="Carregando história"
                description="Resgatando os marcos mais importantes da trajetória alviverde."
              />
            </AnimatedEnter>
          ) : null}

          {!loading && errorMessage ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="wifi-off"
                title="Falha ao carregar história"
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={() => void loadHistoria()}
              />
            </AnimatedEnter>
          ) : null}

          {!loading && !errorMessage ? (
            <>
              <AnimatedEnter delay={120} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Linha do tempo</Text>
                <Text style={styles.sectionTitle}>Momentos que definem o clube</Text>
              </AnimatedEnter>

              <View style={styles.timelineList}>
                {data?.timeline.map((item, index) => (
                  <AnimatedEnter key={`${item.year}-${item.title}`} delay={150 + index * 45} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot} />
                      {index !== (data.timeline.length ?? 0) - 1 ? <View style={styles.timelineLine} /> : null}
                    </View>

                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineYear}>{item.year}</Text>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      <Text style={styles.timelineDesc}>{item.description}</Text>
                    </View>
                  </AnimatedEnter>
                ))}
              </View>

              <AnimatedEnter delay={330} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Conquistas</Text>
                <Text style={styles.sectionTitle}>Indicadores de grandeza</Text>
              </AnimatedEnter>

              <View style={[styles.achievementsGrid, isCompact && styles.stackColumn]}>
                {data?.achievements.map((achievement, index) => (
                  <AnimatedEnter
                    key={achievement.label}
                    delay={360 + index * 40}
                    style={[styles.achievementCard, isCompact && styles.fullWidthAchievement]}
                  >
                    <Text style={styles.achievementValue}>{achievement.value}</Text>
                    <Text style={styles.achievementLabel}>{achievement.label}</Text>
                  </AnimatedEnter>
                ))}
              </View>

              <AnimatedEnter delay={520} style={styles.quoteCard}>
                <MaterialIcons name="format-quote" size={26} color={ChapeTheme.colors.gold} />
                <Text style={styles.quoteText}>
                  &quot;{data?.footerQuote ?? "Que a nossa história jamais seja esquecida."}&quot;
                </Text>
              </AnimatedEnter>
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
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  orbBottom: {
    width: 280,
    height: 280,
    bottom: 120,
    left: -120,
    backgroundColor: "rgba(211, 181, 109, 0.07)",
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
  heroTop: {
    flexDirection: "row",
    gap: 16,
  },
  heroTopCompact: {
    flexDirection: "column",
  },
  crest: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: ChapeTheme.colors.borderStrong,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: ChapeTheme.colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 8,
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
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineRail: {
    alignItems: "center",
    width: 24,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ChapeTheme.colors.gold,
    borderWidth: 3,
    borderColor: ChapeTheme.colors.page,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: "rgba(247, 245, 235, 0.18)",
  },
  timelineCard: {
    flex: 1,
    padding: 18,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(8, 28, 17, 0.88)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
  },
  timelineYear: {
    color: ChapeTheme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  timelineTitle: {
    marginTop: 8,
    color: ChapeTheme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  timelineDesc: {
    marginTop: 8,
    color: ChapeTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  achievementCard: {
    width: "48%",
    minHeight: 128,
    padding: 18,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(211, 181, 109, 0.24)",
    justifyContent: "space-between",
  },
  fullWidthAchievement: {
    width: "100%",
  },
  achievementValue: {
    color: ChapeTheme.colors.gold,
    fontSize: 28,
    fontWeight: "800",
  },
  achievementLabel: {
    color: ChapeTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  quoteCard: {
    marginTop: 24,
    padding: 22,
    borderRadius: ChapeTheme.radii.lg,
    backgroundColor: "rgba(18, 64, 37, 0.92)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.borderStrong,
    gap: 10,
  },
  quoteText: {
    color: ChapeTheme.colors.text,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
  },
});
