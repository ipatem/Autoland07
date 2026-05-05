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
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiGet, apiPost } from "../src/api";
import { colors, statusLabels } from "../src/theme";
import Select from "../src/Select";
import { CAR_BRAND_LIST, modelsForBrand, CAR_YEARS, normalizeBrand, normalizeModel } from "../src/cars";

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

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/6KXoWbW8smUsgBKSA";

const FALLBACK_SETTINGS: Settings = {
  phone: "+40 753 017 291",
  email: "autoland07@yahoo.com",
  address: "Nicolae Titulescu nr. 78bis, 120159 Buzău, România",
  schedule_weekday: "08:30 - 17:00",
  schedule_saturday: "08:30 - 12:00",
  schedule_sunday: "Închis",
  status: "open",
  status_message: "",
};

function buildWhatsappLink(phone: string, body: string) {
  const num = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(body)}`;
}

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
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [inputMode, setInputMode] = useState<"dropdown" | "manual">("dropdown");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinResult, setVinResult] = useState<{
    label: string;
    success: boolean;
  } | null>(null);
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSubmittedEver, setHasSubmittedEver] = useState(false);
  const [lastInquiry, setLastInquiry] = useState<{
    name: string;
    contact: string;
    vin?: string;
    car_model?: string;
    problem: string;
  } | null>(null);

  // Public review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("autoland07_submitted").then((v) => {
      if (v === "1") setHasSubmittedEver(true);
    });
  }, []);

const FALLBACK_SETTINGS: Settings = {
  phone: "+40 753 017 291",
  email: "autoland07@yahoo.com",
  address: "Nicolae Titulescu nr. 78bis, 120159 Buzău, România",
  schedule_weekday: "08:30 - 17:00",
  schedule_saturday: "08:30 - 12:00",
  schedule_sunday: "Închis",
  status: "open",
  status_message: "",
};

  const load = useCallback(async () => {
    const [s, r] = await Promise.allSettled([
      apiGet<Settings>("/settings"),
      apiGet<Review[]>("/reviews"),
    ]);
    if (s.status === "fulfilled") {
      setSettings(s.value);
    } else if (!settings) {
      // First-load failure: render with safe defaults so UI is never stuck on spinner
      setSettings(FALLBACK_SETTINGS);
      console.warn("settings load failed, using fallback", s.reason?.message);
    }
    if (r.status === "fulfilled") {
      setReviews(r.value);
    } else {
      console.warn("reviews load failed", r.reason?.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!name.trim() || !contact.trim() || !problem.trim()) {
      Alert.alert("Câmpuri lipsă", "Numele, contactul (telefon/email) și descrierea problemei sunt obligatorii.");
      return;
    }
    setSubmitting(true);
    const carModelStr = [brand, model, year].filter(Boolean).join(" ").trim();
    try {
      await apiPost("/inquiries", {
        name: name.trim(),
        contact: contact.trim(),
        vin: vin.trim() || undefined,
        car_model: carModelStr || undefined,
        problem: problem.trim(),
      });
      setSuccess(true);
      setLastInquiry({
        name: name.trim(),
        contact: contact.trim(),
        vin: vin.trim() || undefined,
        car_model: carModelStr || undefined,
        problem: problem.trim(),
      });
      setHasSubmittedEver(true);
      AsyncStorage.setItem("autoland07_submitted", "1").catch(() => {});
      setName("");
      setContact("");
      setVin("");
      setBrand("");
      setModel("");
      setYear("");
      setProblem("");
    } catch (e: any) {
      Alert.alert("Eroare", e?.message || "Nu am putut trimite cererea.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (!reviewName.trim() || !reviewText.trim()) {
      Alert.alert("Câmpuri lipsă", "Numele și mesajul sunt obligatorii.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const created = await apiPost<Review>("/reviews/public", {
        name: reviewName.trim(),
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewSuccess(true);
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
    } catch (e: any) {
      Alert.alert("Eroare", e?.message || "Nu am putut trimite recenzia.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const sendInquiryOnWhatsapp = () => {
    if (!lastInquiry || !settings) return;
    const lines = [
      "*Cerere nouă Autoland 07*",
      `Nume: ${lastInquiry.name}`,
      `Contact: ${lastInquiry.contact}`,
    ];
    if (lastInquiry.vin) lines.push(`VIN: ${lastInquiry.vin}`);
    if (lastInquiry.car_model) lines.push(`Model: ${lastInquiry.car_model}`);
    lines.push("", `Problema: ${lastInquiry.problem}`);
    Linking.openURL(buildWhatsappLink(settings.phone, lines.join("\n"))).catch(() => {});
  };

  const decodeVin = async (vinValue: string) => {
    const v = vinValue.trim().toUpperCase();
    if (v.length < 11) {
      setVinResult(null);
      return;
    }
    setVinDecoding(true);
    setVinResult(null);
    try {
      const r = await apiGet<{
        make?: string | null;
        model?: string | null;
        year?: string | null;
      }>(`/vin/decode/${v}`);
      const matchedBrand = normalizeBrand(r.make ?? null);
      const matchedModel = normalizeModel(matchedBrand, r.model ?? null);
      // Fill in dropdowns if matches found
      if (matchedBrand) setBrand(matchedBrand);
      if (matchedModel) setModel(matchedModel);
      if (r.year && CAR_YEARS.includes(r.year)) setYear(r.year);
      const parts = [
        matchedBrand || r.make || "",
        matchedModel || r.model || "",
        r.year || "",
      ].filter(Boolean);
      setVinResult({
        success: !!matchedBrand || !!r.year,
        label: parts.length > 0 ? parts.join(" ") : "Decodat",
      });
    } catch (e: any) {
      setVinResult({ success: false, label: e?.message || "VIN nerecunoscut" });
    } finally {
      setVinDecoding(false);
    }
  };

  const onVinChange = (t: string) => {
    const upper = t.toUpperCase();
    setVin(upper);
    if (upper.length >= 11 && upper.length <= 17) {
      // Debounced trigger: simple — call after 800ms of inactivity
      // Using a closure-safe approach with setTimeout
      window.clearTimeout((onVinChange as any)._t);
      (onVinChange as any)._t = window.setTimeout(() => decodeVin(upper), 800);
    } else {
      setVinResult(null);
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
          <ContactRow
            icon="call"
            label="TELEFON"
            value={settings.phone}
            accent
            onPress={() => Linking.openURL(`tel:${settings.phone.replace(/\s/g, "")}`).catch(() => {})}
            testID="contact-phone"
          />
          <View style={styles.divider} />
          <ContactRow
            icon="mail"
            label="EMAIL"
            value={settings.email}
            onPress={() => Linking.openURL(`mailto:${settings.email}`).catch(() => {})}
            testID="contact-email"
          />
          <View style={styles.divider} />
          <ContactRow
            icon="location"
            label="ADRESĂ · DESCHIDE PE GOOGLE MAPS"
            value={settings.address}
            onPress={() => Linking.openURL(GOOGLE_MAPS_URL).catch(() => {})}
            testID="contact-address"
          />
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
                testID="forward-whatsapp-button"
                style={styles.waForwardBtn}
                onPress={sendInquiryOnWhatsapp}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                <Text style={styles.waForwardText}>TRIMITE ȘI PE WHATSAPP</Text>
              </TouchableOpacity>
              <Text style={styles.waHint}>
                📸  Poți atașa și o poză cu piesa veche în fereastra de WhatsApp care se va
                deschide — o imagine ne ajută să identificăm exact piesa potrivită.
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
              <Field label="TELEFON / EMAIL *">
                <TextInput
                  testID="contact-input"
                  value={contact}
                  onChangeText={setContact}
                  placeholder="07xx... sau email@..."
                  placeholderTextColor={colors.textDisabled}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>
              <View style={isWide ? styles.row2 : undefined}>
                <View style={isWide ? { flex: 1, marginRight: 16 } : undefined}>
                  <Field label="SERIE ȘASIU (VIN) - OPȚIONAL · DECODARE AUTOMATĂ">
                    <TextInput
                      testID="vin-input"
                      value={vin}
                      onChangeText={onVinChange}
                      placeholder="Scrie VIN-ul → completăm noi marca, modelul, anul"
                      placeholderTextColor={colors.textDisabled}
                      style={[styles.input, styles.inputMono]}
                      autoCapitalize="characters"
                      maxLength={17}
                    />
                  </Field>
                  {vinDecoding && (
                    <View style={styles.vinChip}>
                      <ActivityIndicator size="small" color={colors.brand} />
                      <Text style={styles.vinChipText}>Decodez VIN-ul...</Text>
                    </View>
                  )}
                  {!!vinResult && !vinDecoding && (
                    <View
                      testID="vin-result"
                      style={[
                        styles.vinChip,
                        { borderColor: vinResult.success ? colors.open : colors.break },
                      ]}
                    >
                      <Ionicons
                        name={vinResult.success ? "checkmark-circle" : "warning-outline"}
                        size={16}
                        color={vinResult.success ? colors.open : colors.break}
                      />
                      <Text style={styles.vinChipText}>
                        {vinResult.success ? "Recunoscut: " : ""}{vinResult.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modeToggleRow}>
                <Text style={styles.helperLine}>SAU SELECTEAZĂ MAȘINA TA ↓</Text>
                <View style={styles.modeToggle}>
                  <TouchableOpacity
                    testID="mode-dropdown"
                    onPress={() => setInputMode("dropdown")}
                    style={[styles.modeBtn, inputMode === "dropdown" && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeText, inputMode === "dropdown" && styles.modeTextActive]}>
                      DROPDOWN
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="mode-manual"
                    onPress={() => setInputMode("manual")}
                    style={[styles.modeBtn, inputMode === "manual" && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeText, inputMode === "manual" && styles.modeTextActive]}>
                      MANUAL
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {inputMode === "dropdown" ? (
                <View style={isWide ? styles.row3 : undefined}>
                  <View style={isWide ? { flex: 1, marginRight: 12 } : undefined}>
                    <Select
                      testID="brand-select"
                      label="MARCĂ"
                      value={brand}
                      placeholder="Alege marca"
                      options={CAR_BRAND_LIST}
                      onChange={(v) => {
                        setBrand(v);
                        setModel("");
                      }}
                    />
                  </View>
                  <View style={isWide ? { flex: 1, marginRight: 12 } : undefined}>
                    <Select
                      testID="model-select"
                      label="MODEL"
                      value={model}
                      placeholder={brand ? "Alege modelul" : "Alege întâi marca"}
                      options={brand ? modelsForBrand(brand) : []}
                      onChange={setModel}
                      disabled={!brand}
                    />
                  </View>
                  <View style={isWide ? { flex: 1 } : undefined}>
                    <Select
                      testID="year-select"
                      label="AN FABRICAȚIE"
                      value={year}
                      placeholder="Alege anul"
                      options={CAR_YEARS}
                      onChange={setYear}
                    />
                  </View>
                </View>
              ) : (
                <View style={isWide ? styles.row3 : undefined}>
                  <View style={isWide ? { flex: 1, marginRight: 12 } : undefined}>
                    <Field label="MARCĂ">
                      <TextInput
                        testID="brand-manual"
                        value={brand}
                        onChangeText={setBrand}
                        placeholder="ex: BMW"
                        placeholderTextColor={colors.textDisabled}
                        style={styles.input}
                      />
                    </Field>
                  </View>
                  <View style={isWide ? { flex: 1, marginRight: 12 } : undefined}>
                    <Field label="MODEL">
                      <TextInput
                        testID="model-manual"
                        value={model}
                        onChangeText={setModel}
                        placeholder="ex: Seria 5 530d"
                        placeholderTextColor={colors.textDisabled}
                        style={styles.input}
                      />
                    </Field>
                  </View>
                  <View style={isWide ? { flex: 1 } : undefined}>
                    <Field label="AN FABRICAȚIE">
                      <TextInput
                        testID="year-manual"
                        value={year}
                        onChangeText={setYear}
                        placeholder="ex: 2015"
                        placeholderTextColor={colors.textDisabled}
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </Field>
                  </View>
                </View>
              )}
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

          {/* PUBLIC REVIEW FORM */}
          <View style={styles.reviewFormBox}>
            <Text style={styles.reviewFormTitle}>LASĂ ȘI TU O PĂRERE</Text>
            <Text style={styles.reviewFormSub}>
              Apare instant pe perete ca post-it.
            </Text>
            {reviewSuccess ? (
              <View testID="review-success" style={styles.reviewSuccessBox}>
                <Ionicons name="checkmark-circle" size={28} color={colors.open} />
                <Text style={styles.reviewSuccessText}>Mulțumim! Părerea ta a apărut pe perete.</Text>
                <TouchableOpacity onPress={() => setReviewSuccess(false)}>
                  <Text style={styles.reviewSuccessLink}>SCRIE ALTĂ PĂRERE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput
                  testID="public-review-name"
                  value={reviewName}
                  onChangeText={setReviewName}
                  placeholder="Numele tău"
                  placeholderTextColor={colors.textDisabled}
                  style={styles.input}
                  maxLength={60}
                />
                <View style={styles.starsRowSmall}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      testID={`public-star-${n}`}
                      onPress={() => setReviewRating(n)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={n <= reviewRating ? "star" : "star-outline"}
                        size={28}
                        color={n <= reviewRating ? "#F59E0B" : colors.textDisabled}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  testID="public-review-text"
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="ex: Am găsit piesa rapid, recomand!"
                  placeholderTextColor={colors.textDisabled}
                  style={[styles.input, styles.textarea]}
                  multiline
                  maxLength={400}
                />
                <TouchableOpacity
                  testID="submit-public-review-button"
                  style={[styles.primaryBtn, reviewSubmitting && { opacity: 0.6 }]}
                  onPress={submitReview}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>LIPEȘTE PE PERETE</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

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

      {/* FLOATING WHATSAPP BUTTON - only after inquiry submitted */}
      {hasSubmittedEver && <WhatsappFab phone={settings.phone} />}
    </KeyboardAvoidingView>
  );
}

function WhatsappFab({ phone }: { phone: string }) {
  const waNumber = phone.replace(/[^0-9]/g, "");
  const open = () => {
    if (!waNumber) return;
    const msg = encodeURIComponent(
      "Salut! Am văzut siteul Autoland 07 și aș vrea să întreb despre o piesă."
    );
    const url = `https://wa.me/${waNumber}?text=${msg}`;
    Linking.openURL(url).catch(() => {});
  };
  return (
    <TouchableOpacity testID="whatsapp-fab" onPress={open} style={styles.waFab} activeOpacity={0.85}>
      <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      <Text style={styles.waFabText}>WHATSAPP</Text>
    </TouchableOpacity>
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
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper testID={testID} onPress={onPress} style={styles.contactRow} activeOpacity={0.7}>
      <View style={styles.contactIconWrap}>
        <Ionicons name={icon} size={18} color={accent ? colors.brand : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, accent && { color: colors.brand }]}>{value}</Text>
      </View>
      {!!onPress && <Ionicons name="open-outline" size={16} color={colors.textDisabled} />}
    </Wrapper>
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
  row3: { flexDirection: "row" },
  helperLine: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.textDisabled,
    fontSize: 11,
    letterSpacing: 2,
    marginVertical: 8,
    textAlign: "center",
  },
  modeToggleRow: { alignItems: "center", marginVertical: 12 },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceElevated,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 18 },
  modeBtnActive: { backgroundColor: colors.brand },
  modeText: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.textSecondary,
    letterSpacing: 2,
    fontSize: 12,
  },
  modeTextActive: { color: "#fff" },
  vinChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    gap: 6 as any,
  },
  vinChipText: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 13,
    color: "#fff",
    marginLeft: 6,
  },
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

  waFab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#25D366",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 32,
    shadowColor: "#25D366",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    gap: 8 as any,
  },
  waFabText: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    letterSpacing: 2,
    fontSize: 14,
    marginLeft: 8,
  },

  waForwardBtn: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    width: "100%",
    gap: 10 as any,
  },
  waForwardText: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    letterSpacing: 2,
    fontSize: 14,
    marginLeft: 8,
  },
  waHint: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  scrollHint: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.brand,
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 20,
    textAlign: "center",
  },

  reviewFormBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 32,
  },
  reviewFormTitle: {
    fontFamily: "BarlowCondensed_900Black",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 1,
  },
  reviewFormSub: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  starsRowSmall: { flexDirection: "row", marginTop: 14, marginBottom: 6 },
  reviewSuccessBox: { alignItems: "center", paddingVertical: 12 },
  reviewSuccessText: {
    fontFamily: "IBMPlexSans_500Medium",
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },
  reviewSuccessLink: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.brand,
    letterSpacing: 2,
    marginTop: 12,
  },
});
