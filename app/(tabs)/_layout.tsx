import { Redirect, Tabs, useSegments } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import { ChapeTheme } from "@/constants/theme";

export default function TabLayout() {
  const { status, isAuthenticated } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 6);
  const currentTab = segments[1] ?? "index";
  const inLogin = currentTab === "index";

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: ChapeTheme.colors.page }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated && !inLogin) {
    return <Redirect href="/" />;
  }

  if (isAuthenticated && inLogin) {
    return <Redirect href="/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: ChapeTheme.colors.page,
        },
        tabBarActiveTintColor: ChapeTheme.colors.accent,
        tabBarInactiveTintColor: ChapeTheme.colors.textSubtle,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 62 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopWidth: 0,
          backgroundColor: "rgba(5, 22, 13, 0.96)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.28,
          shadowRadius: 22,
          elevation: 18,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.25,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="historia"
        options={{
          title: "História",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="titulos"
        options={{
          title: "Títulos",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jogos"
        options={{
          title: "Jogos",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="carteirinha"
        options={{
          title: "Carteirinha",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
