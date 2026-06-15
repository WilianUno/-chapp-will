import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedEnter } from "@/components/animated-enter";
import { StateCard } from "@/components/state-card";
import { useAuth } from "@/contexts/auth-context";
import { ChapeTheme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getHistoriaOverview } from "@/services/historia.service";
import { getJogosOverview } from "@/services/jogos.service";
import { getTitulosOverview } from "@/services/titulos.service";
import type { HistoriaOverview } from "@/types/historia";
import type { JogosOverview } from "@/types/jogos";
import type { TitulosOverview } from "@/types/titulos";

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");
const USER_AVATAR = require("../../assets/images/personagem.png");

type HomeData = {
  historia: HistoriaOverview | null;
  jogos: JogosOverview | null;
  titulos: TitulosOverview | null;
};

type Shortcut = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: "/historia" | "/titulos" | "/jogos" | "/carteirinha";
};

const shortcuts: Shortcut[] = [
  {
    title: "Títulos",
    subtitle: "Reviva as principais conquistas do clube.",
    icon: "emoji-events",
    route: "/titulos",
  },
  {
    title: "Jogos",
    subtitle: "Veja placares, próximos confrontos e tabela.",
    icon: "stadium",
    route: "/jogos",
  },
  {
    title: "Carteirinha",
    subtitle: "Acesse sua identidade de sócio em segundos.",
    icon: "badge",
    route: "/carteirinha",
  },
];

export default function HomeScreen() {
  const layout = useResponsiveLayout();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [data, setData] = useState<HomeData>({
    historia: null,
    jogos: null,
    titulos: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadHome();
  }, []);

  async function loadHome(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);

      const [historiaResult, jogosResult, titulosResult] = await Promise.allSettled([
        getHistoriaOverview(),
        getJogosOverview(),
        getTitulosOverview(),
      ]);

      const nextState: HomeData = {
        historia: historiaResult.status === "fulfilled" ? historiaResult.value : null,
        jogos: jogosResult.status === "fulfilled" ? jogosResult.value : null,
        titulos: titulosResult.status === "fulfilled" ? titulosResult.value : null,
      };

      const hasAnyContent = nextState.historia || nextState.jogos || nextState.titulos;
      if (!hasAnyContent) {
        throw new Error("Não foi possível carregar o painel inicial.");
      }

      setData(nextState);

      const firstRejected = [historiaResult, jogosResult, titulosResult].find(
        (result) => result.status === "rejected"
      );
      setErrorMessage(firstRejected?.status === "rejected" ? "Alguns blocos podem estar desatualizados." : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a home";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const heroMatch = data.jogos?.featuredMatches[0] ?? null;
  const historyHighlight = data.historia?.timeline[0] ?? null;
  const isCompact = layout.isCompact;

  const statCards = useMemo(
    () => [
      {
        value: data.historia?.foundedAt ?? "1973",
        label: "fundação",
      },
      {
        value: String(data.titulos?.trophies.length ?? 0).padStart(2, "0"),
        label: "títulos em destaque",
      },
      {
        value: data.jogos?.competition ?? "calendário",
        label: "competição atual",
      },
    ],
    [data.historia?.foundedAt, data.jogos?.competition, data.titulos?.trophies.length]
  );

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
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadHome(true)} tintColor="#f7f5eb" />
          }
        >
          <View style={styles.topBar}>
            <View style={styles.profilePill}>
              <Image source={USER_AVATAR} style={styles.avatar} />
              <View style={styles.profileCopy}>
                <Text style={styles.profileEyebrow}>Nação alviverde</Text>
                <Text numberOfLines={1} style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => void signOut()}>
              <MaterialIcons name="logout" size={18} color={ChapeTheme.colors.text} />
            </TouchableOpacity>
          </View>

          <AnimatedEnter delay={40}>
            <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="verified" size={16} color={ChapeTheme.colors.accent} />
              <Text style={styles.heroBadgeText}>App oficial do torcedor</Text>
            </View>

            <Text style={[styles.heroTitle, layout.isSmallPhone && styles.heroTitleCompact]}>
              Vamo, vamo, Chape.
            </Text>
            <Text style={styles.heroSubtitle}>
              Uma home com cara de clube: mais hierarquia, informação rápida e uma entrada visualmente mais forte.
            </Text>

            <View style={[styles.heroActions, isCompact && styles.stackColumn]}>
              <TouchableOpacity style={[styles.primaryButton, isCompact && styles.fullWidthButton]} onPress={() => router.push("/titulos")}>
                <Text style={styles.primaryButtonText}>Ver títulos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, isCompact && styles.fullWidthButton]} onPress={() => router.push("/jogos")}>
                <Text style={styles.secondaryButtonText}>Abrir jogos</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.statsRow, isCompact && styles.stackColumn]}>
              {statCards.map((item) => (
                <View key={item.label} style={[styles.statCard, isCompact && styles.fullWidthCard]}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            </View>
          </AnimatedEnter>

          {loading ? (
            <AnimatedEnter delay={90}>
              <StateCard
                loading
                title="Montando a nova home"
                description="Organizando atalhos, panorama do clube e destaques principais para você."
              />
            </AnimatedEnter>
          ) : null}

          {!loading && errorMessage === "Não foi possível carregar o painel inicial." ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="wifi-off"
                title="Painel indisponível"
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={() => void loadHome()}
              />
            </AnimatedEnter>
          ) : null}

          {!loading ? (
            <>
              {errorMessage && errorMessage !== "Não foi possível carregar o painel inicial." ? (
                <AnimatedEnter delay={100} style={styles.inlineNotice}>
                  <MaterialIcons name="info-outline" size={16} color={ChapeTheme.colors.accent} />
                  <Text style={styles.inlineNoticeText}>{errorMessage}</Text>
                </AnimatedEnter>
              ) : null}

              <AnimatedEnter delay={120} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Acesso rápido</Text>
                <Text style={styles.sectionTitle}>O que você quer ver agora?</Text>
              </AnimatedEnter>

              <View style={styles.shortcutsGrid}>
                {shortcuts.map((shortcut, index) => (
                  <AnimatedEnter key={shortcut.title} delay={150 + index * 50}>
                    <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push(shortcut.route)}>
                      <View style={styles.shortcutIconWrap}>
                        <MaterialIcons name={shortcut.icon} size={20} color={ChapeTheme.colors.accent} />
                      </View>
                      <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                      <Text style={styles.shortcutSubtitle}>{shortcut.subtitle}</Text>
                    </TouchableOpacity>
                  </AnimatedEnter>
                ))}
              </View>

              <AnimatedEnter delay={260} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Panorama</Text>
                <Text style={styles.sectionTitle}>Momento do clube</Text>
              </AnimatedEnter>

              <AnimatedEnter delay={300} style={styles.storyCard}>
                <Text style={styles.storyLabel}>Partida em foco</Text>
                <Text style={styles.storyHeadline}>
                  {heroMatch
                    ? `${heroMatch.homeTeam} x ${heroMatch.awayTeam}`
                    : "Calendário sendo atualizado para a torcida"}
                </Text>
                <Text style={styles.storyBody}>
                  {heroMatch
                    ? `${heroMatch.status} · ${heroMatch.matchTime} · ${heroMatch.venue}`
                    : "Assim que os dados estiverem disponíveis, a agenda dos jogos aparece aqui com prioridade."}
                </Text>
              </AnimatedEnter>

              <View style={[styles.dualRow, isCompact && styles.stackColumn]}>
                <AnimatedEnter delay={340} style={[styles.infoCard, styles.infoCardLarge, isCompact && styles.fullWidthCard]}>
                  <Text style={styles.storyLabel}>Identidade</Text>
                  <Text style={styles.infoTitle}>{data.historia?.clubName ?? "Associação Chapecoense de Futebol"}</Text>
                  <Text style={styles.infoBody}>
                    {historyHighlight
                      ? `${historyHighlight.year} · ${historyHighlight.title}`
                      : "A história do clube continua como um dos pilares centrais da experiência."}
                  </Text>
                  <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/historia")}>
                    <Text style={styles.linkButtonText}>Explorar história</Text>
                  </TouchableOpacity>
                </AnimatedEnter>

                <AnimatedEnter delay={390} style={[styles.infoCard, isCompact && styles.fullWidthCard]}>
                  <Text style={styles.storyLabel}>Socio</Text>
                  <Text style={styles.infoTitle}>Carteirinha digital</Text>
                  <Text style={styles.infoBody}>
                    Acesse sua identificação, QR code e compartilhamento em uma interface mais limpa.
                  </Text>
                  <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/carteirinha")}>
                    <Text style={styles.linkButtonText}>Abrir carteirinha</Text>
                  </TouchableOpacity>
                </AnimatedEnter>
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
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  orbTop: {
    width: 220,
    height: 220,
    top: -56,
    right: -48,
  },
  orbBottom: {
    width: 280,
    height: 280,
    left: -110,
    bottom: 60,
    backgroundColor: "rgba(211, 181, 109, 0.07)",
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  profilePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.92)",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: ChapeTheme.colors.primary,
  },
  profileEyebrow: {
    fontSize: 11,
    color: ChapeTheme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  profileName: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#102015",
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(247, 245, 235, 0.14)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginTop: 22,
    padding: 24,
    borderRadius: ChapeTheme.radii.lg,
    backgroundColor: "rgba(13, 48, 28, 0.86)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.borderStrong,
    ...ChapeTheme.shadow,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.08)",
  },
  heroBadgeText: {
    color: ChapeTheme.colors.accentSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 18,
    color: ChapeTheme.colors.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
  },
  heroTitleCompact: {
    fontSize: 31,
    lineHeight: 37,
  },
  heroSubtitle: {
    marginTop: 12,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroActions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  stackColumn: {
    flexDirection: "column",
  },
  fullWidthButton: {
    width: "100%",
    flex: 0,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: ChapeTheme.colors.accent,
    borderRadius: ChapeTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#102015",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: ChapeTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
    backgroundColor: "rgba(247, 245, 235, 0.04)",
  },
  secondaryButtonText: {
    color: ChapeTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  statsRow: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 92,
    padding: 14,
    borderRadius: ChapeTheme.radii.sm,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
    justifyContent: "space-between",
  },
  fullWidthCard: {
    width: "100%",
    flex: 0,
  },
  statValue: {
    color: ChapeTheme.colors.text,
    fontSize: 20,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statLabel: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
  inlineNotice: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: ChapeTheme.radii.sm,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
  },
  inlineNoticeText: {
    flex: 1,
    color: ChapeTheme.colors.textMuted,
    fontSize: 13,
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
    letterSpacing: 1.6,
  },
  sectionTitle: {
    marginTop: 6,
    color: ChapeTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  shortcutsGrid: {
    gap: 12,
  },
  shortcutCard: {
    padding: 18,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(8, 28, 17, 0.88)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
    ...ChapeTheme.shadow,
  },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  shortcutTitle: {
    marginTop: 14,
    color: ChapeTheme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  shortcutSubtitle: {
    marginTop: 8,
    color: ChapeTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  storyCard: {
    padding: 22,
    borderRadius: ChapeTheme.radii.lg,
    backgroundColor: "rgba(18, 64, 37, 0.92)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.borderStrong,
  },
  storyLabel: {
    color: ChapeTheme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  storyHeadline: {
    marginTop: 10,
    color: ChapeTheme.colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
  storyBody: {
    marginTop: 10,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  dualRow: {
    marginTop: 12,
    gap: 12,
  },
  infoCard: {
    padding: 20,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(247, 245, 235, 0.05)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
  },
  infoCardLarge: {
    backgroundColor: "rgba(247, 245, 235, 0.08)",
  },
  infoTitle: {
    marginTop: 10,
    color: ChapeTheme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  infoBody: {
    marginTop: 10,
    color: ChapeTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  linkButtonText: {
    color: ChapeTheme.colors.accentSoft,
    fontSize: 13,
    fontWeight: "700",
  },
});
