import React from "react";
import Home from "@/components/home";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Profile from "@/components/profile";
import Settings from "@/components/Settings";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const Tab = createBottomTabNavigator();

function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: insets.bottom > 0 ? insets.bottom + 4 : 14 }
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const renderIcon = () => {
            const iconColor = isFocused ? colors.brand : "#94A3B8";
            const iconSize = 23;

            if (route.name === "HomeTab") {
              return (
                <Ionicons
                  name={isFocused ? "home" : "home-outline"}
                  size={iconSize}
                  color={iconColor}
                />
              );
            } else if (route.name === "MyLibraryTab") {
              return (
                <Ionicons
                  name={isFocused ? "pie-chart" : "pie-chart-outline"}
                  size={iconSize}
                  color={iconColor}
                />
              );
            } else if (route.name === "ProfileTab") {
              return (
                <Ionicons
                  name={isFocused ? "settings" : "settings-outline"}
                  size={iconSize}
                  color={iconColor}
                />
              );
            }
            return null;
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {renderIcon()}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={Home} />
      <Tab.Screen name="MyLibraryTab" component={Profile} />
      <Tab.Screen name="ProfileTab" component={Settings} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBarContainer: {
    width: 200,
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});

export default MainTabNavigator;
