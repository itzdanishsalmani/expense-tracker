
import AppNavigator from "@/navigation/AppNavigator";
import * as Notifications from 'expo-notifications';
import React, { useEffect } from "react";
import { DeviceEventEmitter, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getTransactionsByDateRange, insertTransactions } from "./utils/db";
import { parseNotificationToExpense } from "./utils/notificationParser";

type NativeNotificationEvent = {
  title?: string;
  text?: string;
  body?: string;
  packageName?: string;
  postTime?: number;
};

const handleNotification = async (source: string, data: {
  title?: string | null;
  body?: string | null;
  date?: number;
  packageName?: string | null;
}) => {
  console.log("[NotificationDebug] received", {
    source,
    packageName: data.packageName,
    title: data.title,
    body: data.body,
    date: data.date ? new Date(data.date).toISOString() : undefined,
  });

  if (!data.body) {
    console.log("[NotificationDebug] skipped: empty notification body", { source, title: data.title });
    return;
  }

  const parsed = parseNotificationToExpense({
    title: data.title || '',
    body: data.body || '',
    date: data.date || Date.now(),
  });
  console.log("[NotificationDebug] parser result", parsed);
  if (!parsed) {
    console.log("[NotificationDebug] skipped: parser did not detect an expense", {
      source,
      packageName: data.packageName,
    });
    return;
  }

  // Deduplication: check for SMS/notification within 15 minutes, same amount
  const fifteenMin = 15 * 60 * 1000;
  const possibleDuplicates = await getTransactionsByDateRange(parsed.date - fifteenMin, parsed.date + fifteenMin);
  const duplicateTx = possibleDuplicates.find(tx => tx.amount === parsed.amount);
  console.log("[NotificationDebug] duplicate check", {
    parsedId: parsed.id,
    amount: parsed.amount,
    possibleDuplicateCount: possibleDuplicates.length,
    duplicateId: duplicateTx?.id,
  });
  
  if (duplicateTx) {
    // Notification has priority over SMS. If duplicate exists, overwrite it with notification data.
    // We delete the old SMS transaction and insert the notification one to replace it.
    const db = await import('./utils/db').then(m => m.getDB());
    await db.runAsync('DELETE FROM transactions WHERE id = ?', duplicateTx.id);
    await insertTransactions([parsed]);
    console.log("[NotificationDebug] replaced duplicate transaction", {
      deletedId: duplicateTx.id,
      insertedId: parsed.id,
    });
  } else {
    await insertTransactions([parsed]);
    console.log("[NotificationDebug] inserted transaction", { insertedId: parsed.id });
  }
};

// Native Android NotificationListenerService event for system notifications.
DeviceEventEmitter.addListener("PaymentNotification", async (event: NativeNotificationEvent) => {
  await handleNotification("native-notification-listener", {
    title: event.title,
    body: event.text || event.body,
    date: event.postTime || Date.now(),
    packageName: event.packageName,
  });
});

export default function App() {
  useEffect(() => {
    // Expo notification listener only receives notifications delivered to this app.
    const expoSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const content = notification.request?.content;
      await handleNotification("expo-notifications", {
        title: content?.title || '',
        body: content?.body || '',
        date: Date.now(),
      });
    });

    return () => {
      expoSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* <AuthProvider> */}
        <SafeAreaView
          edges={["top", "left", "right", "bottom"]}
          style={{ flex: 1 }}
        >
          <StatusBar />
          <AppNavigator />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

