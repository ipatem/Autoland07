import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiPost, setToken } from "../../src/api";
import { colors } from "../../src/theme";

export default function AdminLogin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Câmpuri lipsă", "Completează emailul și parola.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ access_token: string }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      await setToken(res.access_token);
      router.replace("/admin/dashboard");
    } catch (e: any) {
      Alert.alert("Autentificare eșuată", e?.message || "Verifică datele.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-button" onPress={() => router.replace("/")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>ÎNAPOI</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>{"// AUTENTIFICARE"}</Text>
          <Text style={styles.title}>PANOU ADMIN</Text>
          <Text style={styles.subtitle}>Acces rezervat angajatului Autoland 07.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              testID="email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="email@autoland07.ro"
              placeholderTextColor={colors.textDisabled}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <Text style={[styles.label, { marginTop: 24 }]}>PAROLĂ</Text>
            <TextInput
              testID="password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDisabled}
              style={styles.input}
              secureTextEntry
            />

            <TouchableOpacity
              testID="login-button"
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>AUTENTIFICARE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  backText: {
    fontFamily: "BarlowCondensed_700Bold",
    color: "#fff",
    letterSpacing: 2,
    marginLeft: 8,
    fontSize: 12,
  },
  body: { padding: 24, paddingTop: 40 },
  kicker: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.brand,
    letterSpacing: 3,
    fontSize: 13,
  },
  title: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    fontSize: 48,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: 15,
  },
  form: { marginTop: 40 },
  label: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    fontFamily: "IBMPlexSans_400Regular",
    color: "#fff",
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.textDisabled,
    paddingVertical: 10,
  },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 36,
  },
  btnText: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    fontSize: 16,
    letterSpacing: 3,
  },
});
