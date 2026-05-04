import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  BarlowCondensed_700Bold,
  BarlowCondensed_900Black,
} from "@expo-google-fonts/barlow-condensed";
import { Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans";
import { View } from "react-native";

export default function RootLayout() {
  const [loaded] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_900Black,
    Caveat_400Regular,
    Caveat_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}
