import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  ListRenderItemInfo,
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
import { getTitulosOverview } from "@/services/titulos.service";
import type { TitulosOverview, Trophy } from "@/types/titulos";

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");
const USER_AVATAR = require("../../assets/images/personagem.png");
const TROPHY_IMAGES: Record<string, ImageSourcePropType> = {
  "sul-americana-2016": require("../../assets/images-titulos/copa-sul-americana-2016.webp"),
  "catarinense-2020": require("../../assets/images-titulos/campeonato-catarinense-2020.jpg"),
  "serie-b-2013": require("../../assets/images-titulos/brasileiro-serie-b.jpg"),
};
const TROPHY_ACCENTS: Record<string, string> = {
  "sul-americana-2016": "#d3b56d",
  "catarinense-2020": "#d7f06a",
  "serie-b-2013": "#7bd8ff",
};

function getTrophyImage(trophy: Trophy) {
  return TROPHY_IMAGES[trophy.id] ?? CHAPE_BADGE;
}

function getTrophyAccent(trophy: Trophy) {
  return TROPHY_ACCENTS[trophy.id] ?? ChapeTheme.colors.accent;
}

export default function TitulosScreen() {
  const layout = useResponsiveLayout();
  const { user } = useAuth();
  const [data, setData] = useState<TitulosOverview | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRef = useRef<FlatList<Trophy>>(null);

  useEffect(() => {
    void loadTitulos();
  }, []);

  async function loadTitulos(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);
      const response = await getTitulosOverview();
      setData(response);
      setCurrentIndex(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar títulos";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const trophies = data?.trophies ?? [];
  const activeTrophy = trophies[currentIndex] ?? null;
  const slideWidth = layout.width;
  const slidePadding = layout.screenPadding + 4;
  const contentCardWidth = Math.max(0, layout.width - slidePadding * 2);

  function goTo(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(nextIndex, trophies.length - 1));
    listRef.current?.scrollToIndex({ index: boundedIndex, animated: true });
    setCurrentIndex(boundedIndex);
  }

  function onMomentumEnd(event: { nativeEvent: { contentOffset: { x: number } } }) {
    const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(next);
  }

  const trophyMeta = useMemo(() => {
    if (!activeTrophy) {
      return null;
    }

    return {
      accent: getTrophyAccent(activeTrophy),
      image: getTrophyImage(activeTrophy),
    };
  }, [activeTrophy]);

  function renderTrophy({ item }: ListRenderItemInfo<Trophy>) {
    const accent = getTrophyAccent(item);

    return (
      <View style={[styles.slide, { width: slideWidth, paddingHorizontal: slidePadding }]}>
        <View style={[styles.trophyCard, { width: contentCardWidth }]}>
          <ImageBackground
            source={getTrophyImage(item)}
            resizeMode="cover"
            style={[styles.trophyMedia, layout.isSmallPhone && styles.trophyMediaCompact]}
          >
            <View style={styles.trophyMediaShade} />
            <View style={[styles.imageTag, { borderColor: `${accent}88` }]}>
              <MaterialIcons name="photo-library" size={14} color={accent} />
              <Text style={[styles.imageTagText, { color: accent }]}>arquivo da conquista</Text>
            </View>
            <View style={styles.imageBottomCopy}>
              <Text style={styles.imageYear}>{item.year}</Text>
              <Text style={[styles.imageTitle, layout.isSmallPhone && styles.imageTitleCompact]}>{item.title}</Text>
            </View>
          </ImageBackground>

          <View style={styles.trophyBody}>
            <View style={styles.trophyHeaderRow}>
              <View style={[styles.yearBadge, { backgroundColor: `${accent}22` }]}>
                <Text style={[styles.yearBadgeText, { color: accent }]}>{item.year}</Text>
              </View>
              <View style={styles.headerLine} />
            </View>

            <Text style={[styles.trophyName, layout.isSmallPhone && styles.trophyNameCompact]}>{item.title}</Text>
            <Text style={styles.trophyQuote}>&quot;{item.quote}&quot;</Text>
            <Text style={styles.trophyDescription}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  }

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
              paddingBottom: layout.bottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadTitulos(true)} tintColor="#f7f5eb" />
          }
        >
          <View style={[styles.headerBar, { paddingHorizontal: layout.screenPadding }]}>
            <View style={styles.profilePill}>
              <Image source={USER_AVATAR} style={styles.avatar} />
              <View style={styles.profileCopy}>
                <Text style={styles.profileEyebrow}>Galeria alviverde</Text>
                <Text numberOfLines={1} style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
              </View>
            </View>
          </View>

          <AnimatedEnter delay={40}>
            <View style={[styles.heroCard, { marginHorizontal: layout.screenPadding }]}>
            <Text style={styles.heroEyebrow}>Títulos em destaque</Text>
            <Text style={styles.heroTitle}>{data?.clubName ?? "Associação Chapecoense de Futebol"}</Text>
            <Text style={styles.heroSubtitle}>
              Uma vitrine mais editorial para valorizar contexto, imagem e memória de cada conquista.
            </Text>

            <View style={[styles.heroFooter, layout.isSmallPhone && styles.heroFooterCompact]}>
              <View>
                <Text style={styles.heroFooterLabel}>Total exibido</Text>
                <Text style={styles.heroFooterValue}>{String(trophies.length).padStart(2, "0")} conquistas</Text>
              </View>

              {data?.updatedAt ? (
                <View style={styles.updatedPill}>
                  <MaterialIcons name="schedule" size={14} color={ChapeTheme.colors.textMuted} />
                  <Text style={styles.updatedText}>
                    {new Date(data.updatedAt).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              ) : null}
            </View>
            </View>
          </AnimatedEnter>

          {loading ? (
            <AnimatedEnter delay={90}>
              <StateCard
                loading
                title="Carregando galeria"
                description="Preparando as conquistas da Chape com imagem, contexto e navegação por destaque."
              />
            </AnimatedEnter>
          ) : null}

          {!loading && errorMessage ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="wifi-off"
                title="Falha ao carregar títulos"
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={() => void loadTitulos()}
              />
            </AnimatedEnter>
          ) : null}

          {!loading && !errorMessage ? (
            <>
              {activeTrophy && trophyMeta ? (
                <AnimatedEnter delay={120} style={[styles.highlightStrip, { marginHorizontal: layout.screenPadding }]}>
                  <View style={[styles.highlightDot, { backgroundColor: trophyMeta.accent }]} />
                  <Text style={styles.highlightText}>
                    Em foco: {activeTrophy.title} {activeTrophy.year}
                  </Text>
                </AnimatedEnter>
              ) : null}

              <AnimatedEnter delay={150}>
                <FlatList
                  ref={listRef}
                  data={trophies}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTrophy}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onMomentumEnd}
                  getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
                  style={styles.carousel}
                />
              </AnimatedEnter>

              <AnimatedEnter delay={200} style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.arrowButton, currentIndex === 0 && styles.arrowButtonDisabled]}
                  disabled={currentIndex === 0}
                  onPress={() => goTo(currentIndex - 1)}
                >
                  <MaterialIcons name="chevron-left" size={22} color={ChapeTheme.colors.text} />
                </TouchableOpacity>

                <View style={styles.pagination}>
                  {trophies.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.paginationDot,
                        index === currentIndex && styles.paginationDotActive,
                        index === currentIndex && activeTrophy
                          ? { backgroundColor: getTrophyAccent(activeTrophy) }
                          : null,
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.arrowButton, currentIndex === trophies.length - 1 && styles.arrowButtonDisabled]}
                  disabled={currentIndex === trophies.length - 1}
                  onPress={() => goTo(currentIndex + 1)}
                >
                  <MaterialIcons name="chevron-right" size={22} color={ChapeTheme.colors.text} />
                </TouchableOpacity>
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
    opacity: 0.12,
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
    top: -80,
    right: -40,
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  orbBottom: {
    width: 260,
    height: 260,
    bottom: 120,
    left: -120,
    backgroundColor: "rgba(123, 216, 255, 0.08)",
  },
  content: {
    paddingTop: 26,
    paddingBottom: 120,
  },
  headerBar: {
    paddingHorizontal: 20,
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
    marginHorizontal: 20,
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
  heroSubtitle: {
    marginTop: 10,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroFooter: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  heroFooterCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  heroFooterLabel: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroFooterValue: {
    marginTop: 4,
    color: ChapeTheme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  updatedPill: {
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
    marginHorizontal: 20,
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
  highlightStrip: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: ChapeTheme.radii.sm,
    backgroundColor: "rgba(247, 245, 235, 0.06)",
  },
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  highlightText: {
    flex: 1,
    color: ChapeTheme.colors.textMuted,
    fontSize: 13,
  },
  carousel: {
    marginTop: 16,
  },
  slide: {
    paddingHorizontal: 24,
  },
  trophyCard: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(8, 28, 17, 0.96)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
    ...ChapeTheme.shadow,
  },
  trophyMedia: {
    height: 320,
    justifyContent: "space-between",
    padding: 18,
  },
  trophyMediaCompact: {
    height: 260,
  },
  trophyMediaShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 18, 11, 0.48)",
  },
  imageTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(5, 18, 11, 0.48)",
    borderWidth: 1,
  },
  imageTagText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  imageBottomCopy: {
    position: "relative",
    zIndex: 1,
  },
  imageYear: {
    color: "#f2f4eb",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  imageTitle: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  imageTitleCompact: {
    fontSize: 25,
    lineHeight: 30,
  },
  trophyBody: {
    padding: 22,
  },
  trophyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: ChapeTheme.radii.pill,
  },
  yearBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ChapeTheme.colors.border,
  },
  trophyName: {
    marginTop: 16,
    color: ChapeTheme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  trophyNameCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  trophyQuote: {
    marginTop: 10,
    color: ChapeTheme.colors.accentSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  trophyDescription: {
    marginTop: 12,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  controlsRow: {
    marginTop: 18,
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 245, 235, 0.08)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
  },
  arrowButtonDisabled: {
    opacity: 0.28,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(247, 245, 235, 0.18)",
  },
  paginationDotActive: {
    width: 28,
  },
});
