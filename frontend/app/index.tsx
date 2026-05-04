import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiGet, apiPost } from "../src/api";
import { colors, statusLabels } from "../src/theme";

interface Settings {
  phone: string;
  email: string;
  address: string;
  schedule_weekday: string;
  schedule_saturday: string;
  schedule_sunday: string;
  status: "open" | "break" | "closed";
  status_message: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  color: string;
  created_at: string;
}

const HERO_IMG =
  "https://images.pexels.com/photos/8985664/pexels-photo-8985664.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const POSTIT_ROTATIONS = ["-3deg", "2deg", "-1deg", "4deg", "-2deg", "3deg", "-4deg", "1deg"];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [vin, setVin] = useState("");
  const [carModel, setCarModel] = useState("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        apiGet<Settings>("/settings"),
        apiGet<Review[]>("/reviews"),
      ]);
      setSettings(s);
      setReviews(r);
    } catch (e: any) {
      console.warn("load error", e?.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!name.trim() || !problem.trim()) {
      Alert.alert("Câmpuri lipsă", "Numele și descrierea problemei sunt obligatorii.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/inquiries", {
        name: name.trim(),
        contact: contact.trim() || undefined,
        vin: vin.trim() || undefined,
        car_model: carModel.trim() || undefined,
        problem: problem.trim(),
      });
      setSuccess(true);
      setName("");
      setContact("");
      setVin("");
      setCarModel("");
      setProblem("");
    } catch (e: any) {
      Alert.alert("Eroare", e?.message || "Nu am putut trimite cererea.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!settings) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const statusColor =
    settings.status === "open"
      ? colors.open
      : settings.status === "break"
      ? colors.break
      : colors.closed;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}
        <ImageBackground source={{ uri: HERO_IMG }} style={styles.hero}>
          <LinearGradient
            colors={["rgba(10,10,10,0.4)", "rgba(10,10,10,0.85)", "rgba(10,10,10,1)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.topbar}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>AUTOLAND</Text>
                <View style={styles.logoSeven}>
                  <Text style={styles.logoSevenText}>07</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="admin-link"
                style={styles.adminLink}
                onPress={() => router.push("/admin/login")}
              >
                <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.adminLinkText}>ADMIN</Text>
              </TouchableOpacity>
            </View>

            <View testID="store-status-badge" style={[styles.statusBadge, { borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabels[settings.status]}
              </Text>
            </View>

            <Text style={styles.heroTitle}>PIESE AUTO{"\n"}IMPORT.</Text>
            <Text style={styles.heroSubtitle}>SOLUȚII RAPIDE PENTRU MAȘINA TA.</Text>
            <Text style={styles.heroBy}>~ Mihai Ipate · Buzău</Text>
          </View>
        </ImageBackground>

        {/* CONTACT STRIP */}
        <View style={styles.contactStrip}>
          <ContactRow icon="call" label="TELEFON" value={settings.phone} accent />
          <View style={styles.divider} />
          <ContactRow icon="mail" label="EMAIL" value={settings.email} />
          <View style={styles.divider} />
          <ContactRow icon="location" label="ADRESĂ" value={settings.address} />
          <View style={styles.divider} />
          <View style={styles.scheduleBlock}>
            <View style={styles.scheduleHead}>
              <Ionicons name="time" size={16} color={colors.brand} />
              <Text style={styles.contactLabel}>PROGRAM</Text>
            </View>
            <Text style={styles.scheduleLine}>Luni – Vineri  ·  {settings.schedule_weekday}</Text>
            <Text style={styles.scheduleLine}>Sâmbătă        ·  {settings.schedule_saturday}</Text>
            <Text style={styles.scheduleLine}>Duminică       ·  {settings.schedule_sunday}</Text>
            {!!settings.status_message && (
              <Text style={styles.statusMessage}>{settings.status_message}</Text>
            )}
          </View>
        </View>

        {/* INQUIRY FORM */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{"// 01"}</Text>
          <Text style={styles.sectionTitle}>SCRIE PROBLEMA</Text>
          <Text style={styles.sectionSub}>
            Trimite seria de șasiu (VIN), modelul mașinii sau orice detaliu care ne ajută să găsim
            piesa potrivită.
          </Text>

          {success ? (
            <View testID="inquiry-success" style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={36} color={colors.open} />
              <Text style={styles.successTitle}>CEREREA A FOST TRIMISĂ</Text>
              <Text style={styles.successText}>
                Mihai te va contacta în cel mai scurt timp pe datele de contact lăsate.
              </Text>
              <TouchableOpacity
                testID="send-another-button"
                style={styles.secondaryBtn}
                onPress={() => setSuccess(false)}
              >
                <Text style={styles.secondaryBtnText}>TRIMITE ALTĂ CERERE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Field label="NUME *">
                <TextInput
                  testID="name-input"
                  value={name}
                  onChangeText={setName}
                  placeholder="Numele tău"
                  placeholderTextColor={colors.textDisabled}
                  style={styles.input}
                />
              </Field>
              <Field label="TELEFON / EMAIL (OPȚIONAL)">
                <TextInput
                  testID="contact-input"
                  value={contact}
                  onChangeText={setContact}
                  placeholder="07xx... sau email@... (ca să te putem contacta)"
                  placeholderTextColor={colors.textDisabled}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>
              <View style={isWide ? styles.row2 : undefined}>
                <View style={isWide ? { flex: 1, marginRight: 16 } : undefined}>
                  <Field label="SERIE ȘASIU (VIN)">
                    <TextInput
                      testID="vin-input"
                      value={vin}
                      onChangeText={(t) => setVin(t.toUpperCase())}
                      placeholder="WVWZZZ1KZAW..."
                      placeholderTextColor={colors.textDisabled}
                      style={[styles.input, styles.inputMono]}
                      autoCapitalize="characters"
                      maxLength={17}
                    />
                  </Field>
                </View>
                <View style={isWide ? { flex: 1 } : undefined}>
                  <Field label="MODEL / AN">
                    <TextInput
                      testID="model-input"
                      value={carModel}
                      onChangeText={setCarModel}
                      placeholder="ex: VW Golf 5 1.9 TDI 2008"
                      placeholderTextColor={colors.textDisabled}
                      style={styles.input}
                    />
                  </Field>
                </View>
              </View>
              <Field label="DESCRIE PROBLEMA *">
                <TextInput
                  testID="problem-textarea"
                  value={problem}
                  onChangeText={setProblem}
                  placeholder="Ce piesă cauți sau ce problemă ai?"
                  placeholderTextColor={colors.textDisabled}
                  style={[styles.input, styles.textarea]}
                  multiline
                  numberOfLines={5}
                />
              </Field>
              <TouchableOpacity
                testID="submit-inquiry-button"
                style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>TRIMITE CEREREA</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* REVIEWS WALL */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={styles.sectionKicker}>{"// 02"}</Text>
          <Text style={styles.sectionTitle}>CE SPUN CLIENȚII</Text>
          <Text style={styles.sectionSub}>
            Mesaje primite de la oameni care au găsit piesa potrivită la noi.
          </Text>

          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyText}>Încă nu sunt recenzii. Fii primul!</Text>
            </View>
          ) : (
            <View style={styles.postitGrid}>
              {reviews.map((r, idx) => (
                <PostIt key={r.id} review={r} index={idx} wide={isWide} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>AUTOLAND 07</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} · Magazin piese auto import</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIconWrap}>
        <Ionicons name={icon} size={18} color={accent ? colors.brand : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, accent && { color: colors.brand }]}>{value}</Text>
      </View>
    </View>
  );
}

function PostIt({ review, index, wide }: { review: Review; index: number; wide: boolean }) {
  const bg = colors.postIt[review.color] || colors.postIt.yellow;
  const rotation = POSTIT_ROTATIONS[index % POSTIT_ROTATIONS.length];
  return (
    <View
      testID="review-post-it"
      style={[
        styles.postit,
        {
          backgroundColor: bg,
          transform: [{ rotate: rotation }],
          width: wide ? "31%" : "47%",
        },
      ]}
    >
      <View style={styles.postitPin} />
      <Text style={styles.postitText} numberOfLines={6}>
        “{review.text}”
      </Text>
      <View style={styles.postitFoot}>
        <Text style={styles.postitName}>— {review.name}</Text>
        <Text style={styles.postitStars}>{"★".repeat(review.rating)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  hero: { minHeight: 520, justifyContent: "flex-end" },
  heroContent: { padding: 24, paddingBottom: 40 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  logoBox: { flexDirection: "row", alignItems: "center" },
  logoText: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 26,
    color: "#fff",
    letterSpacing: 2,
  },
  logoSeven: {
    backgroundColor: colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
    transform: [{ skewX: "-12deg" }],
  },
  logoSevenText: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 1,
    transform: [{ skewX: "12deg" }],
  },
  adminLink: { flexDirection: "row", alignItems: "center", gap: 6 as any, padding: 8 },
  adminLinkText: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 24,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontFamily: "BarlowCondensed_700Bold", fontSize: 13, letterSpacing: 2 },
  heroTitle: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 64,
    lineHeight: 64,
    color: "#fff",
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    color: colors.brand,
    letterSpacing: 2,
    marginTop: 8,
  },
  heroBy: {
    fontFamily: "Caveat_400Regular",
    fontSize: 22,
    color: colors.textSecondary,
    marginTop: 12,
  },

  contactStrip: { paddingHorizontal: 24, paddingVertical: 24, backgroundColor: colors.surface },
  contactRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, gap: 12 as any },
  contactIconWrap: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
  },
  contactValue: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 16,
    color: "#fff",
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: colors.border },
  scheduleBlock: { paddingVertical: 14 },
  scheduleHead: { flexDirection: "row", alignItems: "center", gap: 8 as any, marginBottom: 8 },
  scheduleLine: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 14,
    color: "#fff",
    marginVertical: 2,
    marginLeft: 50,
  },
  statusMessage: {
    fontFamily: "Caveat_400Regular",
    fontSize: 18,
    color: colors.break,
    marginTop: 8,
    marginLeft: 50,
  },

  section: { paddingHorizontal: 24, paddingVertical: 56 },
  sectionKicker: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.brand,
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 42,
    color: "#fff",
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },

  form: { gap: 4 as any },
  row2: { flexDirection: "row" },
  field: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    color: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: colors.textDisabled,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  inputMono: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", letterSpacing: 1 },
  textarea: { minHeight: 100, textAlignVertical: "top" },

  primaryBtn: {
    flexDirection: "row",
    backgroundColor: colors.brand,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 12 as any,
  },
  primaryBtnText: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    fontSize: 17,
    letterSpacing: 3,
    marginRight: 12,
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  secondaryBtnText: {
    fontFamily: "BarlowCondensed_700Bold",
    color: "#fff",
    fontSize: 14,
    letterSpacing: 2,
    textAlign: "center",
  },

  successBox: {
    borderWidth: 1,
    borderColor: colors.open,
    padding: 24,
    alignItems: "center",
  },
  successTitle: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 1,
    marginTop: 12,
  },
  successText: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  postitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16 as any,
    justifyContent: "flex-start",
    marginTop: 8,
  },
  postit: {
    padding: 18,
    minHeight: 180,
    marginBottom: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 6 },
    elevation: 6,
  },
  postitPin: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    left: "45%",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: "#000",
  },
  postitText: {
    fontFamily: "Caveat_400Regular",
    fontSize: 18,
    color: "#1a1a1a",
    lineHeight: 22,
    flex: 1,
  },
  postitFoot: { marginTop: 12 },
  postitName: { fontFamily: "Caveat_700Bold", fontSize: 16, color: "#1a1a1a" },
  postitStars: { fontSize: 14, color: "#f59e0b", marginTop: 2, letterSpacing: 2 },

  emptyReviews: {
    paddingVertical: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyText: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },

  footer: { paddingHorizontal: 24, paddingVertical: 32, alignItems: "center" },
  footerBrand: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    fontSize: 28,
    letterSpacing: 4,
  },
  footerText: { fontFamily: "IBMPlexSans_400Regular", color: colors.textDisabled, fontSize: 12, marginTop: 6 },
});
