import * as Clipboard from "expo-clipboard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  ListRenderItemInfo,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedEnter } from "@/components/animated-enter";
import { StateCard } from "@/components/state-card";
import { ChapeTheme } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getCarteirinhaOverview } from "@/services/carteirinha.service";
import type { CarteirinhaOverview } from "@/types/carteirinha";

type CardSide = "front" | "qr";

type CardPage = {
  id: string;
  side: CardSide;
};

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");
const USER_AVATAR = require("../../assets/images/personagem.png");
const pages: CardPage[] = [
  { id: "frente", side: "front" },
  { id: "verso", side: "qr" },
];

export default function CarteirinhaScreen() {
  const layout = useResponsiveLayout();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<CarteirinhaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const listRef = useRef<FlatList<CardPage>>(null);

  useEffect(() => {
    void loadCarteirinha();
  }, []);

  async function loadCarteirinha(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);
      const response = await getCarteirinhaOverview();
      setData(response);
      setIsRemoved(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar carteirinha";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onMomentumEnd(event: { nativeEvent: { contentOffset: { x: number } } }) {
    const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(next);
  }

  function goTo(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }

  async function handleExport() {
    if (!data) {
      return;
    }

    await Share.share({
      message: [
        "Carteirinha CHApp",
        `Nome: ${data.memberName}`,
        `Matrícula: ${data.memberNumber}`,
        `Plano: ${data.planName}`,
        `Validade: ${data.validUntil}`,
        `QR: ${data.qrCode}`,
      ].join("\n"),
    });
  }

  async function handleCopyQrCode() {
    if (!data) {
      return;
    }

    await Clipboard.setStringAsync(data.qrCode);
    Alert.alert("QR copiado", "O código da carteirinha foi copiado para a área de transferência.");
  }

  function handleRemoveCard() {
    Alert.alert("Remover carteirinha", "Deseja remover a carteirinha desta sessão do app?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => setIsRemoved(true),
      },
    ]);
  }

  const infoCards = useMemo(
    () => [
      { label: "status", value: data?.status ?? "Ativa" },
      { label: "plano", value: data?.planName ?? "Sócio Torcedor" },
      { label: "sócio desde", value: data?.memberSince ?? "--" },
    ],
    [data?.memberSince, data?.planName, data?.status]
  );
  const slideWidth = layout.width;
  const slidePadding = layout.screenPadding + 4;
  const cardWidth = Math.max(0, layout.width - slidePadding * 2);
  const isCompact = layout.isCompact;

  function renderCardPage({ item }: ListRenderItemInfo<CardPage>) {
    if (!data) {
      return null;
    }

    if (item.side === "front") {
      return (
        <View style={[styles.slide, { width: slideWidth, paddingHorizontal: slidePadding }]}>
          <View style={[styles.memberCard, layout.isSmallPhone && styles.memberCardCompact, { width: cardWidth }]}>
            <View style={styles.memberCardGlow} />

            <View style={styles.memberHeader}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>{data.status}</Text>
              </View>
              <Text style={styles.memberPlan}>{data.planName}</Text>
            </View>

            <View style={[styles.memberMain, layout.isSmallPhone && styles.memberMainCompact]}>
              <View style={styles.memberInfoColumn}>
                <Text style={styles.memberLabel}>Nome do sócio</Text>
                <Text style={[styles.memberValue, layout.isSmallPhone && styles.memberValueCompact]}>
                  {data.memberName}
                </Text>

                <Text style={[styles.memberLabel, styles.fieldSpacing]}>Matrícula</Text>
                <View style={styles.inlineValueBox}>
                  <Text style={styles.inlineValueText}>{data.memberNumber}</Text>
                </View>

                <Text style={[styles.memberLabel, styles.fieldSpacing]}>Validade</Text>
                <Text style={styles.memberSmallValue}>{data.validUntil}</Text>

                <Text style={[styles.memberLabel, styles.fieldSpacing]}>Sócio desde</Text>
                <Text style={styles.memberSmallValue}>{data.memberSince}</Text>
              </View>

              <View style={[styles.memberSideColumn, layout.isSmallPhone && styles.memberSideColumnCompact]}>
                <View style={styles.photoWrap}>
                  <Image source={CHAPE_BADGE} style={styles.photoImage} />
                </View>
                <Image source={CHAPE_BADGE} style={styles.clubSeal} />
                <Text style={styles.clubNameText}>{data.clubName}</Text>
              </View>
            </View>

            <View style={[styles.memberFooter, layout.isSmallPhone && styles.memberFooterCompact]}>
              <View style={styles.qrPreviewBox}>
                <MaterialIcons name="qr-code-2" size={52} color={ChapeTheme.colors.primaryBright} />
              </View>
              <View style={styles.memberFooterCopy}>
                <Text style={styles.memberFooterEyebrow}>Documento digital</Text>
                <Text style={styles.memberFooterText}>Use o verso para visualizar e compartilhar o QR code.</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.slide, { width: slideWidth, paddingHorizontal: slidePadding }]}>
        <View style={[styles.memberCard, styles.qrCard, layout.isSmallPhone && styles.memberCardCompact, { width: cardWidth }]}>
          <View style={styles.memberCardGlow} />

          <Text style={[styles.qrTitle, layout.isSmallPhone && styles.qrTitleCompact]}>Validação rápida</Text>
          <Text style={styles.qrSubtitle}>Apresente este código para identificação digital.</Text>

          <View style={[styles.bigQrBox, layout.isSmallPhone && styles.bigQrBoxCompact]}>
            <MaterialIcons
              name="qr-code-2"
              size={layout.isSmallPhone ? 148 : 180}
              color={ChapeTheme.colors.primaryBright}
            />
          </View>

          <Text style={styles.qrCodeText}>{data.qrCode}</Text>
        </View>
      </View>
    );
  }

  const emptyStateVisible = !loading && !errorMessage && isRemoved;

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
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadCarteirinha(true)} tintColor="#f7f5eb" />
          }
        >
          <View style={styles.profilePill}>
            <Image source={USER_AVATAR} style={styles.avatar} />
            <View style={styles.profileCopy}>
              <Text style={styles.profileEyebrow}>Sócio torcedor</Text>
              <Text numberOfLines={1} style={styles.profileName}>{user?.name ?? "Torcedor"}</Text>
            </View>
          </View>

          <AnimatedEnter delay={40}>
            <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Carteirinha digital</Text>
            <Text style={[styles.heroTitle, layout.isSmallPhone && styles.heroTitleCompact]}>
              Documento de acesso com leitura mais premium
            </Text>
            <Text style={styles.heroSubtitle}>
              Frente e verso em destaque, informações resumidas e ações organizadas para uso rápido.
            </Text>

            <View style={[styles.infoRow, isCompact && styles.stackColumn]}>
              {infoCards.map((item) => (
                <View key={item.label} style={[styles.infoCard, isCompact && styles.fullWidthCard]}>
                  <Text style={styles.infoValue}>{item.value}</Text>
                  <Text style={styles.infoLabel}>{item.label}</Text>
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
                title="Carregando carteirinha"
                description="Montando a frente, o verso e as ações principais do documento digital."
              />
            </AnimatedEnter>
          ) : null}

          {!loading && errorMessage ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="wifi-off"
                title="Falha ao carregar carteirinha"
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={() => void loadCarteirinha()}
              />
            </AnimatedEnter>
          ) : null}

          {emptyStateVisible ? (
            <AnimatedEnter delay={90}>
              <StateCard
                icon="credit-card-off"
                title="Carteirinha removida"
                description="A carteirinha foi ocultada apenas desta sessão. Você pode baixar novamente quando quiser."
                actionLabel="Baixar novamente"
                onAction={() => void loadCarteirinha()}
              />
            </AnimatedEnter>
          ) : null}

          {!loading && !errorMessage && !isRemoved ? (
            <>
              <AnimatedEnter delay={120} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Visualização</Text>
                <Text style={styles.sectionTitle}>Frente e verso da carteirinha</Text>
              </AnimatedEnter>

              <AnimatedEnter delay={150}>
                <FlatList
                  ref={listRef}
                  data={pages}
                  horizontal
                  pagingEnabled
                  keyExtractor={(item) => item.id}
                  renderItem={renderCardPage}
                  showsHorizontalScrollIndicator={false}
                  getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
                  onMomentumScrollEnd={onMomentumEnd}
                  style={[styles.carousel, { marginHorizontal: -layout.screenPadding }]}
                />
              </AnimatedEnter>

              <AnimatedEnter delay={190} style={styles.paginationRow}>
                {pages.map((page, index) => (
                  <TouchableOpacity key={page.id} style={styles.paginationButton} onPress={() => goTo(index)}>
                    <View style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive]} />
                    <Text style={[styles.paginationLabel, currentIndex === index && styles.paginationLabelActive]}>
                      {index === 0 ? "Frente" : "Verso"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </AnimatedEnter>

              <AnimatedEnter delay={220} style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Ações</Text>
                <Text style={styles.sectionTitle}>Ferramentas da carteirinha</Text>
              </AnimatedEnter>

              <View style={styles.actionsColumn}>
                <AnimatedEnter delay={250}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => void handleExport()}>
                    <View style={styles.actionIconWrap}>
                      <MaterialIcons name="share" size={18} color={ChapeTheme.colors.accent} />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={styles.actionTitle}>{data?.actions.exportLabel ?? "Exportar"}</Text>
                      <Text style={styles.actionSubtitle}>Compartilhe os dados da carteirinha com rapidez.</Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedEnter>

                <AnimatedEnter delay={300}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => void handleCopyQrCode()}>
                    <View style={styles.actionIconWrap}>
                      <MaterialIcons name="content-copy" size={18} color={ChapeTheme.colors.accent} />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={styles.actionTitle}>{data?.actions.copyLabel ?? "Copiar QR Code"}</Text>
                      <Text style={styles.actionSubtitle}>Copie o código e use em outros fluxos quando precisar.</Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedEnter>

                <AnimatedEnter delay={350}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleRemoveCard}>
                    <View style={[styles.actionIconWrap, styles.actionIconDanger]}>
                      <MaterialIcons name="delete-outline" size={18} color={ChapeTheme.colors.danger} />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={styles.actionTitle}>{data?.actions.removeLabel ?? "Remover Carteirinha"}</Text>
                      <Text style={styles.actionSubtitle}>Oculta a carteirinha apenas desta sessão do app.</Text>
                    </View>
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
  },
  orbTop: {
    width: 240,
    height: 240,
    top: -70,
    right: -46,
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  orbBottom: {
    width: 300,
    height: 300,
    bottom: 90,
    left: -150,
    backgroundColor: "rgba(123, 216, 255, 0.07)",
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
  infoRow: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  stackColumn: {
    flexDirection: "column",
  },
  infoCard: {
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
  infoValue: {
    color: ChapeTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoLabel: {
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
  carousel: {
    marginHorizontal: -20,
  },
  slide: {
    paddingHorizontal: 24,
  },
  memberCard: {
    minHeight: 460,
    borderRadius: 30,
    padding: 22,
    overflow: "hidden",
    backgroundColor: "#f2f6ec",
    ...ChapeTheme.shadow,
  },
  memberCardCompact: {
    minHeight: 0,
    padding: 18,
  },
  qrCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  memberCardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 83, 45, 0.06)",
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(20, 83, 45, 0.08)",
  },
  memberBadgeText: {
    color: ChapeTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  memberPlan: {
    color: "#3f5545",
    fontSize: 13,
    fontWeight: "700",
  },
  memberMain: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  memberMainCompact: {
    flexDirection: "column",
  },
  memberInfoColumn: {
    flex: 1,
  },
  memberLabel: {
    color: "#6f7d72",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  memberValue: {
    marginTop: 6,
    color: "#102015",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  memberValueCompact: {
    fontSize: 24,
    lineHeight: 29,
  },
  memberSmallValue: {
    marginTop: 6,
    color: "#102015",
    fontSize: 18,
    fontWeight: "700",
  },
  fieldSpacing: {
    marginTop: 22,
  },
  inlineValueBox: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(20, 83, 45, 0.08)",
  },
  inlineValueText: {
    color: "#102015",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  memberSideColumn: {
    width: 112,
    alignItems: "center",
  },
  memberSideColumnCompact: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  photoWrap: {
    width: 96,
    height: 96,
    padding: 5,
    borderRadius: 48,
    backgroundColor: "#ffffff",
    ...ChapeTheme.shadow,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  clubSeal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginTop: 18,
  },
  clubNameText: {
    marginTop: 14,
    color: "#294032",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  memberFooter: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  memberFooterCompact: {
    marginTop: 24,
    alignItems: "flex-start",
  },
  qrPreviewBox: {
    width: 92,
    height: 92,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 83, 45, 0.08)",
  },
  memberFooterCopy: {
    flex: 1,
  },
  memberFooterEyebrow: {
    color: ChapeTheme.colors.primaryBright,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  memberFooterText: {
    marginTop: 6,
    color: "#536257",
    fontSize: 14,
    lineHeight: 20,
  },
  qrTitle: {
    color: "#102015",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  qrTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  qrSubtitle: {
    marginTop: 10,
    color: "#536257",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  bigQrBox: {
    marginTop: 24,
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 83, 45, 0.08)",
  },
  bigQrBoxCompact: {
    width: 200,
    height: 200,
  },
  qrCodeText: {
    marginTop: 22,
    color: "#294032",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  paginationRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(247, 245, 235, 0.24)",
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: ChapeTheme.colors.accent,
  },
  paginationLabel: {
    color: ChapeTheme.colors.textSubtle,
    fontSize: 13,
    fontWeight: "600",
  },
  paginationLabelActive: {
    color: ChapeTheme.colors.text,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: ChapeTheme.radii.md,
    backgroundColor: "rgba(8, 28, 17, 0.88)",
    borderWidth: 1,
    borderColor: ChapeTheme.colors.border,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  actionIconDanger: {
    backgroundColor: "rgba(255, 137, 116, 0.08)",
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: ChapeTheme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actionSubtitle: {
    marginTop: 6,
    color: ChapeTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
