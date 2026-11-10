import { Alert, Linking, NativeModules, Platform } from "react-native";

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  const { SmsReader } = NativeModules;
  
  if (SmsReader && SmsReader.hasNotificationPermission) {
    try {
      const hasPermission = await SmsReader.hasNotificationPermission();
      if (hasPermission) {
        return true; // Already granted, no need to ask
      }
    } catch (e) {
      console.warn("Error checking notification permission:", e);
    }
  }

  Alert.alert(
    "Notification Access",
    "Enable notification access for expense tracking.",
    [
      {
        text: "Open Settings",
        onPress: async () => {
          try {
            await Linking.sendIntent(
              "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
            );
          } catch (e) {
            console.warn("Error opening notification settings:", e);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel"
      }
    ]
  );

  return false;
}