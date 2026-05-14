import Cards from "@/components/cards";
import requestSMSPermission from "@/utils/notification";
import { parseAndCategorizeExpenses, ParsedExpense } from "@/utils/smsParser";
import { useCallback, useEffect, useState } from "react";
import { Modal, NativeModules, Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDB, insertTransactions, getAllTransactions, updateTransactionCategory } from "@/utils/db";

const CATEGORIES: ParsedExpense["category"][] = ["food", "travelling", "shopping", "others"];

export default function Home() {
    const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<ParsedExpense | null>(null);

    const refreshExpenseList = useCallback(async () => {
        const allExpenses = await getAllTransactions();
        setExpenses(allExpenses.slice(0, 50)); // Last 50 recent expenses

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaysExpenses = allExpenses.filter((item: ParsedExpense) => item.date >= todayStart.getTime());
        setTotalSpent(todaysExpenses.reduce((sum: number, item: ParsedExpense) => sum + item.amount, 0));

        return allExpenses;
    }, []);

    const fetchAndSyncSms = useCallback(async (forceFullScan = false) => {
        try {
            setIsScanning(true);
            // Initialize SQLite DB
            await initDB();

            const hasPermission = await requestSMSPermission();
            if (!hasPermission) return;

            // 1. Manage First Launch & Sync Dates
            let firstLaunchStr = await AsyncStorage.getItem('APP_FIRST_LAUNCH_DATE');
            let firstLaunchDate = firstLaunchStr ? parseInt(firstLaunchStr) : 0;

            if (!firstLaunchDate) {
                firstLaunchDate = Date.now();
                await AsyncStorage.setItem('APP_FIRST_LAUNCH_DATE', firstLaunchDate.toString());
            }

            let lastSyncStr = await AsyncStorage.getItem('LAST_SYNC_DATE');
            // The user only wants to read messages up to 7 days BEFORE the FIRST START DATE.
            let lastSyncDate = lastSyncStr ? parseInt(lastSyncStr) : (firstLaunchDate - (7 * 24 * 60 * 60 * 1000));
            if (forceFullScan) lastSyncDate = 0;

            // 2. Fetch SMS since the sync date. Manual scan uses timestamp 0 to refresh old rows too.
            const { SmsReader } = NativeModules;
            if (SmsReader && SmsReader.getSMS) {
                const rawSms = await SmsReader.getSMS(lastSyncDate);

                if (rawSms && rawSms.length > 0) {
                    const parsed = parseAndCategorizeExpenses(rawSms);
                    console.log(`Successfully extracted ${parsed.length} expense transactions to sync!`);
                    console.log("Sample parsed transaction:", parsed);

                    // Insert into SQLite
                    if (parsed.length > 0) {
                        await insertTransactions(parsed);
                    }
                }

                // Update the last sync date
                await AsyncStorage.setItem('LAST_SYNC_DATE', Date.now().toString());
            }

            // 3. Render from SQLite database
            let allExpenses = await refreshExpenseList();

            // If nothing was found from the 7-day window and the device has no past data,
            // do a deep scan (timestamp 0) to ensure the local device messages are processed.
            if (!forceFullScan && allExpenses.length === 0) {
                console.log("No expenses found in the last 7 days. Scanning all messages of local device...");
                if (SmsReader && SmsReader.getSMS) {
                    const deepRawSms = await SmsReader.getSMS(0);
                    if (deepRawSms && deepRawSms.length > 0) {
                        const deepParsed = parseAndCategorizeExpenses(deepRawSms);
                        if (deepParsed.length > 0) {
                            await insertTransactions(deepParsed);
                            await refreshExpenseList();
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error syncing and fetching expenses:", err);
        } finally {
            setIsScanning(false);
        }
    }, [refreshExpenseList]);

    useEffect(() => {
        fetchAndSyncSms();
    }, [fetchAndSyncSms]);

    const handleCategoryChange = async (category: ParsedExpense["category"]) => {
        if (!selectedExpense) return;

        await updateTransactionCategory(selectedExpense.id, category);

        const updatedExpenses = expenses.map((expense) =>
            expense.id === selectedExpense.id ? { ...expense, category } : expense
        );

        setExpenses(updatedExpenses);
        setSelectedExpense(null);
    };

    return (
        <>
            <ScrollView style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Hello, User</Text>
                <Text style={{ fontSize: 18, marginBottom: 20 }}>
                    Today you spent Rs. {totalSpent.toFixed(2)}.
                </Text>

                <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}>Recent Expenses</Text>

                {isScanning ? (
                    <Text style={{ marginTop: 20, color: "#007AFF" }}>Scanning messages of local device...</Text>
                ) : expenses.length === 0 ? (
                    <Text style={{ marginTop: 20, color: "gray" }}>No recent expenses found in your database.</Text>
                ) : (
                    expenses.map((item) => (
                        <Cards
                            key={item.id}
                            title={`${item.category.toUpperCase()}${item.merchant !== 'Unknown' ? ` • ${item.merchant}` : ''}`}
                            description={`Rs. ${item.amount} • ${new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' })} ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            onPress={() => setSelectedExpense(item)}
                        />
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <Pressable
                disabled={isScanning}
                onPress={() => fetchAndSyncSms(true)}
                style={{
                    position: "absolute",
                    right: 20,
                    bottom: 24,
                    minWidth: 72,
                    height: 52,
                    borderRadius: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isScanning ? "#8abfff" : "#007AFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 6,
                }}
            >
                <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
                    {isScanning ? "Scanning" : "Scan"}
                </Text>
            </Pressable>

            <Modal
                animationType="slide"
                transparent
                visible={selectedExpense !== null}
                onRequestClose={() => setSelectedExpense(null)}
            >
                <Pressable
                    style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}
                    onPress={() => setSelectedExpense(null)}
                >
                    <Pressable style={{ backgroundColor: "white", padding: 24, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 6 }}>Edit category</Text>
                        {selectedExpense ? (
                            <Text style={{ color: "gray", marginBottom: 18 }}>
                                Rs. {selectedExpense.amount} • {selectedExpense.merchant}
                            </Text>
                        ) : null}

                        {CATEGORIES.map((category) => {
                            const isSelected = selectedExpense?.category === category;
                            return (
                                <Pressable
                                    key={category}
                                    onPress={() => handleCategoryChange(category)}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 10,
                                        marginBottom: 10,
                                        backgroundColor: isSelected ? "#007AFF" : "#f2f2f6",
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: "600", color: isSelected ? "white" : "#111" }}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                </Pressable>
                            );
                        })}

                        <Pressable onPress={() => setSelectedExpense(null)} style={{ paddingVertical: 14, alignItems: "center" }}>
                            <Text style={{ color: "#007AFF", fontSize: 16, fontWeight: "600" }}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
