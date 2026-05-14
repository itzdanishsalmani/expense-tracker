import Home from "@/components/home";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import Profile from "@/components/profile";
const Tab = createBottomTabNavigator();

function MainTabNavigator() {

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        popToTopOnBlur: true,
        tabBarStyle: {
          height: 60,
        //   backgroundColor: colors.surface,
          borderTopWidth: 1,
        //   borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          height: 60,
          paddingVertical: 10,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Octicons
              name={focused ? "home-fill" : "home"}
              size={24}
            //   color={focused ? colors.tabIconSelected : colors.tabIconDefault}
            />
          ),
        }}

      />
      <Tab.Screen
        name="MyLibraryTab"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "library" : "library-outline"}
              size={24}
            //   color={focused ? colors.tabIconSelected : colors.tabIconDefault}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default MainTabNavigator;