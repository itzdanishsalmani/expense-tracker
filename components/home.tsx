import Cards from "@/components/cards";
import { requestNotificationPermissions } from "@/utils/notification";
import { ParsedExpense } from "@/utils/smsParser";
import { useCallback, useEffect, useState } from "react";
import { Modal, NativeModules, Pressable, ScrollView, Text, View, DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDB, insertTransactions, getAllTransactions, updateTransactionCategory } from "@/utils/db";
import Fontisto from '@expo/vector-icons/Fontisto';
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

    const loadExpenses = useCallback(async () => {
        try {
            setIsScanning(true);
            // Initialize SQLite DB
            await initDB();

            await requestNotificationPermissions();

            // Render from SQLite database
            await refreshExpenseList();
        } catch (err) {
            console.error("Error fetching expenses:", err);
        } finally {
            setIsScanning(false);
        }
    }, [refreshExpenseList]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const handleCategoryChange = async (category: ParsedExpense["category"]) => {
        if (!selectedExpense) return;

        await updateTransactionCategory(selectedExpense.id, category);

        const updatedExpenses = expenses.map((expense) =>
            expense.id === selectedExpense.id ? { ...expense, category } : expense
        );

        setExpenses(updatedExpenses);
        setSelectedExpense(null);
    };

    const triggerFakeNotification = () => {
        // Subtract a random amount of hours (1 to 48) to avoid the 15-minute deduplication logic in App.tsx
        const randomHoursAgo = Math.floor(Math.random() * 48) + 1;
        const fakeTime = Date.now() - (randomHoursAgo * 60 * 60 * 1000);

        DeviceEventEmitter.emit("PaymentNotification", {
            title: "Test Bank",
            text: "Rs. 10 spent at FakeStore",
            packageName: "com.test.bank",
            postTime: fakeTime,
        });
        setTimeout(() => loadExpenses(), 800);
    };

    return (
        <>
            <ScrollView style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Hello, User</Text>
                <Text>Track. Understand. Save better</Text>

                <View style={{ backgroundColor: '#6366F1', padding: 16, borderRadius: 12, }}>

                    <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
                    >

                        <View>

                            <Text style={{ color: '#fff' }}>
                                Today's Spend
                            </Text>
                            <Text
                                style={{ marginTop: 12, color: '#fff', fontSize: 28 }}
                            >
                                Rs. {totalSpent.toFixed(2)}
                            </Text>
                        </View>


                        <Fontisto name="wallet" size={42} color="#fff" />
                    </View>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "600", marginVertical: 10 }}>Recent Expenses</Text>

                {isScanning ? (
                    <Text style={{ marginTop: 20, color: "#007AFF" }}>Loading expenses...</Text>
                ) : expenses.length === 0 ? (
                    <Text style={{ marginTop: 20, color: "gray" }}>No recent expenses found in your database.</Text>
                ) : (
                    expenses.map((item) => (
                        <Cards
                            key={item.id}
                            merchant={`${item.merchant !== 'Unknown' ? ` ${item.merchant}` : ''}`}
                            category={`${item.category}`}
                            amount={`Rs. ${item.amount}`}
                            date={`${new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' })} ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            onPress={() => setSelectedExpense(item)}
                        />
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={{
                position: "absolute",
                right: 20,
                bottom: 24,
                flexDirection: "row",
                gap: 12
            }}>
                <Pressable
                    disabled={isScanning}
                    onPress={triggerFakeNotification}
                    style={{
                        minWidth: 72,
                        height: 52,
                        borderRadius: 26,
                        paddingHorizontal: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#FF9500",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
                        Fake 10 Rs
                    </Text>
                </Pressable>

                <Pressable
                    disabled={isScanning}
                    onPress={() => loadExpenses()}
                    style={{
                        minWidth: 72,
                        height: 52,
                        borderRadius: 26,
                        paddingHorizontal: 16,
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
                        {isScanning ? "Refreshing" : "Refresh"}
                    </Text>
                </Pressable>
            </View>

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
