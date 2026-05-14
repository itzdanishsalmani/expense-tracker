import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import MonthTransactions from "@/components/MonthTransactions";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  

  return (
    <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: "slide_from_right" }}
        >
          <Stack.Screen
            name="MainTabNavigator"
            component={MainTabNavigator}
            options={{ animation: "none" }}
          />

          <Stack.Screen
            name="MonthTransactions"
            component={MonthTransactions}
          />

        </Stack.Navigator>
      
    </NavigationContainer>
  );
}
