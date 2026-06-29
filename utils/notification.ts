import { Alert, Linking, NativeModules } from "react-native";

export async function requestNotificationPermissions(): Promise<boolean> {
  const { SmsReader } = NativeModules;
  
  if (SmsReader && SmsReader.hasNotificationPermission) {
    const hasPermission = await SmsReader.hasNotificationPermission();
    if (hasPermission) {
      return true; // Already granted, no need to ask
    }
  }

  Alert.alert(
    "Notification Access",
    "Enable notification access for expense tracking.",
    [
      {
        text: "Open Settings",
        onPress: async () => {
          await Linking.sendIntent(
            "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
          );
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