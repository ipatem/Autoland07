import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiGet, apiPost } from "../../src/api";
import { colors } from "../../src/theme";

export default function ReviewSubmit() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await apiGet<{ name: string; ok: boolean }>(`/reviews/check/${token}`);
        setName(res.name);
        setValid(true);
      } catch (e: any) {
        setErrorMsg(e?.message || "Link invalid");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (!text.trim()) {
      Alert.alert("Spune-ne câteva cuvinte", "Te rugăm scrie un mesaj scurt.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/reviews", { token, rating, text: text.trim() });
      setDone(true);
    } catch (e: any) {
      Alert.alert("Eroare", e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!valid) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, padding: 24 }]}>
        <Ionicons name="warning-outline" size={56} color={colors.closed} />
        <Text style={styles.errorTitle}>LINK INVALID</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>ÎNAPOI ACASĂ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, padding: 24 }]}>
        <Ionicons name="checkmark-circle" size={72} color={colors.open} />
        <Text style={styles.thanksTitle}>MULȚUMIM!</Text>
        <Text style={styles.thanksText}>
          Părerea ta a fost adăugată ca post-it pe site. O apreciem mult!
        </Text>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>VEZI PE SITE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, padding: 24, paddingBottom: 48 }}>
        <Text style={styles.kicker}>{"// LASĂ O PĂRERE"}</Text>
        <Text style={styles.title}>SALUT, {name.toUpperCase()}!</Text>
        <Text style={styles.subtitle}>
          Spune-ne în câteva cuvinte cum a fost experiența cu Autoland 07. Mesajul tău va apărea pe site ca un
          post-it lipit pe perete.
        </Text>

        <Text style={styles.label}>EVALUARE</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} testID={`star-${n}`} onPress={() => setRating(n)} style={styles.starBtn}>
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={36}
                color={n <= rating ? "#F59E0B" : colors.textDisabled}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 24 }]}>MESAJUL TĂU</Text>
        <TextInput
          testID="review-text-input"
          value={text}
          onChangeText={setText}
          placeholder="ex: Am găsit piesa în 5 minute, recomand!"
          placeholderTextColor={colors.textDisabled}
          style={styles.textarea}
          multiline
          numberOfLines={5}
          maxLength={400}
        />
        <Text style={styles.counter}>{text.length}/400</Text>

        <TouchableOpacity
          testID="submit-review-button"
          style={[styles.btn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>TRIMITE PĂREREA</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  kicker: { fontFamily: "BarlowCondensed_700Bold", color: colors.brand, fontSize: 13, letterSpacing: 3 },
  title: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 40, letterSpacing: -0.5, marginTop: 4 },
  subtitle: { fontFamily: "IBMPlexSans_400Regular", color: colors.textSecondary, marginTop: 8, fontSize: 15, lineHeight: 22 },
  label: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 32,
    marginBottom: 8,
  },
  starsRow: { flexDirection: "row", gap: 4 as any },
  starBtn: { padding: 4, marginRight: 4 },
  textarea: {
    fontFamily: "IBMPlexSans_400Regular",
    color: "#fff",
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.textDisabled,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  counter: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textDisabled,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  btn: {
    flexDirection: "row",
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 10 as any,
  },
  btnText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 17, letterSpacing: 3, marginRight: 10 },

  errorTitle: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 28, letterSpacing: 1, marginTop: 16 },
  errorText: { fontFamily: "IBMPlexSans_400Regular", color: colors.textSecondary, marginTop: 8, textAlign: "center" },
  homeBtn: { borderWidth: 2, borderColor: "#fff", paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  homeBtnText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", letterSpacing: 3 },

  thanksTitle: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 36, letterSpacing: 1, marginTop: 16 },
  thanksText: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
