import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChapeTheme } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const CHAPE_BADGE = require("../../assets/images/chape_badge_official.png");

export default function LoginScreen() {
  const layout = useResponsiveLayout({ hasTabBar: false });
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const { signIn, signUp } = useAuth();

  const isRegisterMode = mode === "register";

  async function handleSubmit() {
    if (email === "" || password === "") {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (isRegisterMode && name.trim() === "") {
      Alert.alert("Erro", "Informe seu nome para criar a conta.");
      return;
    }

    try {
      setLoading(true);

      if (isRegisterMode) {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await signIn({ email: email.trim(), password });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar";
      Alert.alert(isRegisterMode ? "Erro no cadastro" : "Erro no login", message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
  }

  function keepFormActionsVisible() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={CHAPE_BADGE} resizeMode="cover" style={styles.background} imageStyle={styles.bgImage}>
        <View style={styles.overlay} />
        <View style={[styles.orb, styles.orbTop]} />
        <View style={[styles.orb, styles.orbBottom]} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView
            ref={scrollRef}
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: layout.topPadding,
                paddingHorizontal: layout.screenPadding,
                paddingBottom: layout.bottomPadding,
              },
            ]}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.hero}>
            <View style={styles.brandBadge}>
              <Image source={CHAPE_BADGE} style={styles.logo} />
              <View>
                <Text style={styles.brandEyebrow}>CHApp</Text>
                <Text style={styles.brandTitle}>A casa digital da torcida</Text>
              </View>
            </View>

            <Text style={[styles.title, layout.isSmallPhone && styles.titleCompact]}>
              Entre para viver a Chape com mais identidade visual e clareza.
            </Text>
            <Text style={styles.subtitle}>
              Acesso aos jogos, história, títulos e carteirinha em uma experiência mais consistente.
            </Text>

            <View style={[styles.featureRow, layout.isSmallPhone && styles.featureRowCompact]}>
              <View style={styles.featureItem}>
                <MaterialIcons name="emoji-events" size={18} color={ChapeTheme.colors.accent} />
                <Text style={styles.featureText}>Títulos com imagem</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="dashboard" size={18} color={ChapeTheme.colors.accent} />
                <Text style={styles.featureText}>Home renovada</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.modePill}>
              <Text style={styles.modePillText}>{isRegisterMode ? "Criar conta" : "Login do torcedor"}</Text>
            </View>

            <Text style={styles.formTitle}>{isRegisterMode ? "Cadastre sua conta" : "Acesse sua conta"}</Text>
            <Text style={styles.formSubtitle}>
              {isRegisterMode
                ? "Preencha os dados para entrar na nova experiência do app."
                : "Use seu e-mail para continuar para a home do torcedor."}
            </Text>

            <View style={styles.inputs}>
              {isRegisterMode ? (
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person-outline" size={18} color={ChapeTheme.colors.textSubtle} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo"
                    placeholderTextColor="#7a877d"
                    value={name}
                    onChangeText={setName}
                    onFocus={keepFormActionsVisible}
                    returnKeyType="next"
                    textContentType="name"
                  />
                </View>
              ) : null}

              <View style={styles.inputWrap}>
                <MaterialIcons name="mail-outline" size={18} color={ChapeTheme.colors.textSubtle} />
                <TextInput
                  style={styles.input}
                  placeholder="Usuário ou e-mail"
                  placeholderTextColor="#7a877d"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onFocus={keepFormActionsVisible}
                  returnKeyType="next"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={18} color={ChapeTheme.colors.textSubtle} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#7a877d"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={keepFormActionsVisible}
                  returnKeyType="done"
                  textContentType={isRegisterMode ? "newPassword" : "password"}
                />
              </View>
            </View>

            {!isRegisterMode ? <Text style={styles.helperText}>Esqueci minha senha</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#102015" />
              ) : (
                <Text style={styles.primaryButtonText}>{isRegisterMode ? "Cadastrar" : "Entrar"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} disabled={loading} onPress={toggleMode}>
              <Text style={styles.secondaryButtonText}>
                {isRegisterMode ? "Voltar para login" : "Criar uma conta"}
              </Text>
            </TouchableOpacity>

          </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.08,
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
    width: 260,
    height: 260,
    top: -80,
    right: -40,
    backgroundColor: "rgba(215, 240, 106, 0.08)",
  },
  orbBottom: {
    width: 320,
    height: 320,
    left: -140,
    bottom: 20,
    backgroundColor: "rgba(211, 181, 109, 0.08)",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 42,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  hero: {
    marginBottom: 22,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: ChapeTheme.colors.borderStrong,
  },
  brandEyebrow: {
    color: ChapeTheme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandTitle: {
    marginTop: 4,
    color: ChapeTheme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  title: {
    marginTop: 24,
    color: ChapeTheme.colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 29,
    lineHeight: 35,
  },
  subtitle: {
    marginTop: 12,
    color: ChapeTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  featureRow: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureRowCompact: {
    flexDirection: "column",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(247, 245, 235, 0.08)",
  },
  featureText: {
    color: ChapeTheme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    padding: 22,
    borderRadius: ChapeTheme.radii.lg,
    backgroundColor: "rgba(247, 245, 235, 0.94)",
    ...ChapeTheme.shadow,
  },
  modePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: "rgba(20, 83, 45, 0.08)",
  },
  modePillText: {
    color: ChapeTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formTitle: {
    marginTop: 16,
    color: "#102015",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  formSubtitle: {
    marginTop: 8,
    color: "#526255",
    fontSize: 14,
    lineHeight: 21,
  },
  inputs: {
    marginTop: 20,
    gap: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: ChapeTheme.radii.sm,
    backgroundColor: "#eef1e6",
    borderWidth: 1,
    borderColor: "rgba(20, 83, 45, 0.08)",
    paddingHorizontal: 14,
    minHeight: 56,
  },
  input: {
    flex: 1,
    color: "#102015",
    fontSize: 16,
  },
  helperText: {
    marginTop: 12,
    color: "#5d6c60",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: ChapeTheme.radii.pill,
    backgroundColor: ChapeTheme.colors.accent,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#102015",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: ChapeTheme.radii.pill,
    borderWidth: 1,
    borderColor: "rgba(20, 83, 45, 0.12)",
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: ChapeTheme.colors.primaryBright,
    fontSize: 14,
    fontWeight: "700",
  },
});
