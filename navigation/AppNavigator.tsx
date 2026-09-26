import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import MonthTransactions from "@/components/MonthTransactions";
import AllTransactions from "@/components/allTransactions";
import Login from "@/components/Login";
import Signup from "@/components/Signup";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/authContext";

// Define the full param list for type-safe navigation
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Signup: undefined;
  // App screens
  MainTabNavigator: undefined;
  MonthTransactions: undefined;
  AllTransactions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't render navigator until auth state is resolved
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {isAuthenticated ? (
          // ── App Screens ──────────────────────────────────────
          <>
            <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
            <Stack.Screen name="MonthTransactions" component={MonthTransactions} />
            <Stack.Screen name="AllTransactions" component={AllTransactions} />
          </>
        ) : (
          // ── Auth Screens ─────────────────────────────────────
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
