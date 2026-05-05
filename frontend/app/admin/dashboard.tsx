import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiGet, apiPost, apiPut, apiDelete, clearToken, getToken } from "../../src/api";
import { colors, statusLabels } from "../../src/theme";

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

interface Inquiry {
  id: string;
  name: string;
  contact: string;
  vin?: string | null;
  car_model?: string | null;
  problem: string;
  status: string;
  review_token?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  color: string;
  created_at: string;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<"inquiries" | "reviews" | "settings">("inquiries");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ new: number; total: number }>({ new: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [shareModal, setShareModal] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, i, st, rv] = await Promise.all([
        apiGet<Settings>("/settings"),
        apiGet<Inquiry[]>("/admin/inquiries", true),
        apiGet<{ new: number; total: number }>("/admin/inquiries/stats", true),
        apiGet<Review[]>("/admin/reviews", true),
      ]);
      setSettings(s);
      setSettingsDraft(s);
      setInquiries(i);
      setStats(st);
      setReviews(rv);
    } catch (e: any) {
      if (String(e?.message || "").includes("Token") || String(e?.message || "").includes("Neaut")) {
        await clearToken();
        router.replace("/admin/login");
        return;
      }
      console.warn("dashboard load", e?.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (!t) {
        router.replace("/admin/login");
        return;
      }
      load();
    })();
  }, [load, router]);

  // Auto-refresh inquiries every 20s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [i, st] = await Promise.all([
          apiGet<Inquiry[]>("/admin/inquiries", true),
          apiGet<{ new: number; total: number }>("/admin/inquiries/stats", true),
        ]);
        setInquiries(i);
        setStats(st);
      } catch {}
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const logout = async () => {
    await clearToken();
    router.replace("/");
  };

  const updateStatus = async (status: "open" | "break" | "closed") => {
    if (!settingsDraft) return;
    setSettingsDraft({ ...settingsDraft, status });
    try {
      const updated = await apiPut<Settings>("/admin/settings", { status }, true);
      setSettings(updated);
    } catch (e: any) {
      Alert.alert("Eroare", e?.message);
    }
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;
    setSavingSettings(true);
    try {
      const updated = await apiPut<Settings>("/admin/settings", settingsDraft, true);
      setSettings(updated);
      setSettingsDraft(updated);
      Alert.alert("Salvat", "Setările au fost actualizate.");
    } catch (e: any) {
      Alert.alert("Eroare", e?.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const resolveInquiry = async (id: string) => {
    try {
      const updated = await apiPost<Inquiry>(`/admin/inquiries/${id}/resolve`, {}, true);
      setInquiries((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setStats((s) => ({ ...s, new: Math.max(0, s.new - 1) }));
      setShareModal(updated);
    } catch (e: any) {
      Alert.alert("Eroare", e?.message);
    }
  };

  const deleteInquiry = async (id: string) => {
    const confirmed =
      Platform.OS === "web"
        ? // eslint-disable-next-line no-alert
          (typeof window !== "undefined" && window.confirm("Sigur ștergi această cerere?"))
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Șterge cerere", "Sigur ștergi această cerere?", [
              { text: "Anulează", style: "cancel", onPress: () => resolve(false) },
              { text: "Șterge", style: "destructive", onPress: () => resolve(true) },
            ]),
          );
    if (!confirmed) return;
    try {
      await apiDelete(`/admin/inquiries/${id}`);
      setInquiries((prev) => prev.filter((x) => x.id !== id));
      setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
    } catch (e: any) {
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        window.alert("Eroare: " + (e?.message || ""));
      } else {
        Alert.alert("Eroare", e?.message);
      }
    }
  };

  const deleteReview = async (id: string) => {
    const confirmed =
      Platform.OS === "web"
        ? // eslint-disable-next-line no-alert
          (typeof window !== "undefined" && window.confirm("Sigur ștergi această recenzie?"))
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Șterge recenzie", "Sigur ștergi această recenzie?", [
              { text: "Anulează", style: "cancel", onPress: () => resolve(false) },
              { text: "Șterge", style: "destructive", onPress: () => resolve(true) },
            ]),
          );
    if (!confirmed) return;
    try {
      await apiDelete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        window.alert("Eroare: " + (e?.message || ""));
      } else {
        Alert.alert("Eroare", e?.message);
      }
    }
  };

  if (loading || !settings || !settingsDraft) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const reviewLink = (token: string) => `${BACKEND_URL}/review/${token}`;

  const shareReviewLink = async (inq: Inquiry) => {
    if (!inq.review_token) return;
    const link = reviewLink(inq.review_token);
    const message = `Salut ${inq.name}! Am rezolvat cererea ta la Autoland 07. Te rog lasă-ne o părere scurtă: ${link}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerKicker}>{"// PANOU ADMIN"}</Text>
          <Text style={styles.headerTitle}>AUTOLAND 07</Text>
        </View>
        <TouchableOpacity testID="logout-button" onPress={logout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* STATUS TOGGLE */}
      <View style={styles.statusBar}>
        <Text style={styles.statusBarLabel}>STATUS MAGAZIN</Text>
        <View style={styles.statusRow}>
          <StatusButton
            testID="admin-status-toggle-open"
            label="ÎN MAGAZIN"
            color={colors.open}
            active={settings.status === "open"}
            onPress={() => updateStatus("open")}
          />
          <StatusButton
            testID="admin-status-toggle-break"
            label="PAUZĂ"
            color={colors.break}
            active={settings.status === "break"}
            onPress={() => updateStatus("break")}
          />
          <StatusButton
            testID="admin-status-toggle-closed"
            label="PLECAT"
            color={colors.closed}
            active={settings.status === "closed"}
            onPress={() => updateStatus("closed")}
          />
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TabBtn
          testID="tab-inquiries"
          label={`CERERI ${stats.new > 0 ? `(${stats.new} NOI)` : ""}`}
          active={tab === "inquiries"}
          onPress={() => setTab("inquiries")}
          badge={stats.new}
        />
        <TabBtn
          testID="tab-reviews"
          label={`RECENZII (${reviews.length})`}
          active={tab === "reviews"}
          onPress={() => setTab("reviews")}
        />
        <TabBtn
          testID="tab-settings"
          label="SETĂRI"
          active={tab === "settings"}
          onPress={() => setTab("settings")}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {tab === "inquiries" ? (
          inquiries.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={56} color={colors.textDisabled} />
              <Text style={styles.emptyText}>Nu sunt cereri momentan.</Text>
            </View>
          ) : (
            inquiries.map((inq) => (
              <InquiryCard
                key={inq.id}
                inquiry={inq}
                onResolve={() => resolveInquiry(inq.id)}
                onDelete={() => deleteInquiry(inq.id)}
                onShare={() => shareReviewLink(inq)}
              />
            ))
          )
        ) : tab === "reviews" ? (
          reviews.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={colors.textDisabled} />
              <Text style={styles.emptyText}>Nu sunt recenzii momentan.</Text>
            </View>
          ) : (
            reviews.map((r) => (
              <ReviewRow key={r.id} review={r} onDelete={() => deleteReview(r.id)} />
            ))
          )
        ) : (
          <SettingsForm
            draft={settingsDraft}
            onChange={setSettingsDraft}
            onSave={saveSettings}
            saving={savingSettings}
          />
        )}
      </ScrollView>

      {/* SHARE REVIEW MODAL */}
      <Modal visible={!!shareModal} transparent animationType="fade" onRequestClose={() => setShareModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.open} />
            <Text style={styles.modalTitle}>CERERE REZOLVATĂ</Text>
            <Text style={styles.modalText}>
              Trimite-i lui {shareModal?.name} link-ul de mai jos pentru a lăsa o părere care va apărea pe site
              ca post-it.
            </Text>
            {shareModal?.review_token && (
              <View style={styles.linkBox}>
                <Text testID="review-link-text" style={styles.linkText} numberOfLines={1}>
                  {reviewLink(shareModal.review_token)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              testID="share-review-button"
              style={styles.modalBtn}
              onPress={() => shareModal && shareReviewLink(shareModal)}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.modalBtnText}>TRIMITE PE WHATSAPP / SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShareModal(null)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>ÎNCHIDE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabBtn({
  testID,
  label,
  active,
  onPress,
  badge,
}: {
  testID: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity testID={testID} style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && { color: "#fff" }]}>{label}</Text>
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatusButton({
  testID,
  label,
  color,
  active,
  onPress,
}: {
  testID: string;
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[
        styles.statusBtn,
        active && { backgroundColor: color, borderColor: color },
      ]}
    >
      <View style={[styles.statusBtnDot, { backgroundColor: color }]} />
      <Text style={[styles.statusBtnText, active && { color: "#000" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReviewRow({ review, onDelete }: { review: Review; onDelete: () => void }) {
  const date = new Date(review.created_at);
  const dateStr = date.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
  const palette: Record<string, string> = {
    yellow: "#FEF08A",
    pink: "#FBCFE8",
    cyan: "#BAE6FD",
    green: "#D9F99D",
  };
  return (
    <View testID={`review-${review.id}`} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: palette[review.color] || "#fff" }]}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{review.name}</Text>
          <Text style={styles.cardContact}>{"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}</Text>
        </View>
        <TouchableOpacity
          testID={`delete-review-${review.id}`}
          style={styles.deleteBtn}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.closed} />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardProblem}>"{review.text}"</Text>
      <Text style={styles.cardDate}>{dateStr}</Text>
    </View>
  );
}

function InquiryCard({
  inquiry,
  onResolve,
  onDelete,
  onShare,
}: {
  inquiry: Inquiry;
  onResolve: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const isNew = inquiry.status === "new";
  const date = new Date(inquiry.created_at);
  const dateStr = date.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });

  return (
    <View testID={`inquiry-${inquiry.id}`} style={[styles.card, isNew && styles.cardNew]}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{inquiry.name}</Text>
          <Text style={styles.cardContact}>{inquiry.contact}</Text>
        </View>
        <View style={[styles.statusPill, isNew ? styles.pillNew : styles.pillResolved]}>
          <Text style={[styles.pillText, !isNew && { color: colors.open }]}>
            {isNew ? "NOU" : "REZOLVAT"}
          </Text>
        </View>
      </View>

      {(inquiry.vin || inquiry.car_model) && (
        <View style={styles.metaRow}>
          {!!inquiry.vin && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>VIN</Text>
              <Text style={styles.metaValueMono}>{inquiry.vin}</Text>
            </View>
          )}
          {!!inquiry.car_model && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>MODEL</Text>
              <Text style={styles.metaValue}>{inquiry.car_model}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.cardProblem}>{inquiry.problem}</Text>
      <Text style={styles.cardDate}>{dateStr}</Text>

      <View style={styles.cardActions}>
        {isNew ? (
          <TouchableOpacity
            testID={`resolve-button-${inquiry.id}`}
            style={styles.resolveBtn}
            onPress={onResolve}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.resolveBtnText}>MARCHEAZĂ REZOLVAT</Text>
          </TouchableOpacity>
        ) : (
          inquiry.review_token && (
            <TouchableOpacity
              testID={`share-button-${inquiry.id}`}
              style={styles.shareBtn}
              onPress={onShare}
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>TRIMITE LINK RECENZIE</Text>
            </TouchableOpacity>
          )
        )}
        <TouchableOpacity
          testID={`delete-button-${inquiry.id}`}
          style={styles.deleteBtn}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.closed} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingsForm({
  draft,
  onChange,
  onSave,
  saving,
}: {
  draft: Settings;
  onChange: (s: Settings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (k: keyof Settings, v: string) => onChange({ ...draft, [k]: v });
  return (
    <View style={{ padding: 24 }}>
      <SettingField label="TELEFON" value={draft.phone} onChange={(v) => set("phone", v)} testID="settings-phone" />
      <SettingField label="EMAIL" value={draft.email} onChange={(v) => set("email", v)} testID="settings-email" />
      <SettingField label="ADRESĂ" value={draft.address} onChange={(v) => set("address", v)} testID="settings-address" multiline />
      <SettingField
        label="PROGRAM LUNI–VINERI"
        value={draft.schedule_weekday}
        onChange={(v) => set("schedule_weekday", v)}
        testID="settings-weekday"
      />
      <SettingField
        label="PROGRAM SÂMBĂTĂ"
        value={draft.schedule_saturday}
        onChange={(v) => set("schedule_saturday", v)}
        testID="settings-saturday"
      />
      <SettingField
        label="PROGRAM DUMINICĂ"
        value={draft.schedule_sunday}
        onChange={(v) => set("schedule_sunday", v)}
        testID="settings-sunday"
      />
      <SettingField
        label="MESAJ STATUS (OPȚIONAL)"
        value={draft.status_message}
        onChange={(v) => set("status_message", v)}
        testID="settings-message"
        placeholder="ex: Revin în 30 min"
      />

      <TouchableOpacity
        testID="save-settings-button"
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SALVEAZĂ MODIFICĂRILE</Text>}
      </TouchableOpacity>
    </View>
  );
}

function SettingField({
  label,
  value,
  onChange,
  testID,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.settingLabel}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        style={[styles.settingInput, multiline && { minHeight: 60, textAlignVertical: "top" }]}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerKicker: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.brand,
    fontSize: 11,
    letterSpacing: 3,
  },
  headerTitle: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 24, letterSpacing: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBar: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  statusBarLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  statusRow: { flexDirection: "row", gap: 8 as any },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flex: 1,
    marginRight: 8,
  },
  statusBtnDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusBtnText: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 1,
    color: "#fff",
  },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brand },
  tabText: {
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.textSecondary,
    letterSpacing: 2,
    fontSize: 13,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 11 },

  empty: { padding: 60, alignItems: "center" },
  emptyText: { fontFamily: "IBMPlexSans_400Regular", color: colors.textSecondary, marginTop: 12 },

  card: {
    margin: 16,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardNew: { borderLeftWidth: 4, borderLeftColor: colors.brand },
  cardHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  cardName: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 20, letterSpacing: 0.5 },
  cardContact: { fontFamily: "IBMPlexSans_400Regular", color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  pillNew: { backgroundColor: colors.brand, borderColor: colors.brand },
  pillResolved: { backgroundColor: "transparent", borderColor: colors.open },
  pillText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", fontSize: 11, letterSpacing: 2 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 as any, marginBottom: 12 },
  metaChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  metaLabel: { fontFamily: "BarlowCondensed_700Bold", fontSize: 9, letterSpacing: 2, color: colors.textSecondary },
  metaValue: { fontFamily: "IBMPlexSans_500Medium", color: "#fff", fontSize: 13, marginTop: 2 },
  metaValueMono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#fff",
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 1,
  },

  cardProblem: {
    fontFamily: "IBMPlexSans_400Regular",
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  cardDate: { fontFamily: "IBMPlexSans_400Regular", color: colors.textDisabled, fontSize: 12 },

  cardActions: { flexDirection: "row", marginTop: 16, alignItems: "center" },
  resolveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.open,
    paddingVertical: 12,
    marginRight: 12,
  },
  resolveBtnText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", letterSpacing: 1.5, marginLeft: 8 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  shareBtnText: { fontFamily: "BarlowCondensed_700Bold", color: "#fff", letterSpacing: 1.5, marginLeft: 8, fontSize: 13 },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  settingLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  settingInput: {
    fontFamily: "IBMPlexSans_400Regular",
    color: "#fff",
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.textDisabled,
    paddingVertical: 10,
  },
  saveBtn: { backgroundColor: colors.brand, paddingVertical: 18, alignItems: "center", marginTop: 24 },
  saveBtnText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", letterSpacing: 3, fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", padding: 24, justifyContent: "center" },
  modalCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: "center" },
  modalTitle: {
    fontFamily: "BarlowCondensed_900Black",
    color: "#fff",
    fontSize: 24,
    letterSpacing: 1,
    marginTop: 12,
  },
  modalText: {
    fontFamily: "IBMPlexSans_400Regular",
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
  linkBox: {
    width: "100%",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 16,
  },
  linkText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: colors.brand, fontSize: 12 },
  modalBtn: {
    flexDirection: "row",
    backgroundColor: colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 16,
    width: "100%",
    justifyContent: "center",
  },
  modalBtnText: { fontFamily: "BarlowCondensed_900Black", color: "#fff", letterSpacing: 2, marginLeft: 8 },
  modalClose: { marginTop: 16, padding: 8 },
  modalCloseText: { fontFamily: "BarlowCondensed_700Bold", color: colors.textSecondary, letterSpacing: 2 },
});
