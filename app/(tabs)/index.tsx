import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const isRegisterMode = mode === "register";

  const handleSubmit = async () => {
    if (email === "" || password === "") {
      Alert.alert("Erro", "Por favor, preencha todos os campos!");
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

      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar";
      Alert.alert(isRegisterMode ? "Erro no cadastro" : "Erro no login", message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
  };

  return (
    <View style={styles.container}>
      {/* Escudo da Chapecoense */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/chape_simbolo.jpg")}
          style={styles.logo}
        />
        <Text style={styles.title}>CHApp</Text>
      </View>

      {/* Campos de Entrada */}
      <View style={styles.inputContainer}>
        {isRegisterMode ? (
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder="Usuário/Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {!isRegisterMode ? (
          <TouchableOpacity>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Botões Entrar e Criar Conta */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.buttonText}>{isRegisterMode ? "Cadastrar" : "Entrar"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} disabled={loading} onPress={toggleMode}>
          <Text style={styles.buttonText}>{isRegisterMode ? "Voltar ao Login" : "Criar uma Conta"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Login Social Google */}
      <TouchableOpacity style={styles.googleButton} disabled={loading}>
        <Image
          source={require("../../assets/images/logoGoole.png")}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Entre com uma conta Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00421a", // Verde oficial
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  forgotText: {
    color: "#ccc",
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 25,
    width: "48%",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 25,
    width: "48%",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: "#fff",
    width: "100%",
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: "contain",
  },
  googleButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
});
