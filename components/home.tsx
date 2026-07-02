import Cards from "@/components/cards";
import { requestNotificationPermissions } from "@/utils/notification";
import { ParsedExpense } from "@/utils/smsParser";
import { useCallback, useEffect, useState } from "react";
import { Modal, NativeModules, Pressable, ScrollView, Text, View, DeviceEventEmitter, TouchableOpacity } from "react-native";
import { initDB, getAllTransactions, updateTransactionCategory } from "@/utils/db";
import Fontisto from '@expo/vector-icons/Fontisto';
import { useNavigation } from "@react-navigation/native";
import { colors, typography } from "@/utils/theme";
const CATEGORIES: ParsedExpense["category"][] = ["food", "travelling", "shopping", "others"];

export default function Home() {
    const navigation = useNavigation<any>();
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
            <ScrollView style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
                <Text style={{ ...typography.title, color: colors.text, marginBottom: 10 }}>Hello, User</Text>
                <Text style={{ ...typography.body, color: colors.textMuted }}>Track. Understand. Save better</Text>

                <View style={{ backgroundColor: colors.brand, marginTop:20, padding: 16, borderRadius: 12, }}>

                    <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
                    >

                        <View>
                            <Text style={{ ...typography.label, color: '#fff' }}>
                                Today's Spend
                            </Text>
                            <Text
                                style={{ ...typography.title, color: '#fff', marginTop: 12 }}
                            >
                                Rs. {totalSpent.toFixed(2)}
                            </Text>
                        </View>


                        <Fontisto name="wallet" size={42} color="#fff" />
                    </View>
                </View>

                <View
                style={{
                    marginTop:12,
                    flexDirection:'row',
                    justifyContent:'space-between',
                    alignItems:'center'
                }}
                >

                <Text style={{ ...typography.section, marginVertical: 10, color: colors.text }}>Recent Expenses</Text>
                
                <TouchableOpacity
                    onPress={() => navigation.navigate("AllTransactions")}
                >
                <Text style={{ ...typography.label, color: colors.brand }}>See all</Text>
                    
                </TouchableOpacity>
                </View>

                {isScanning ? (
                    <Text style={{ marginTop: 20, color: colors.brand }}>Loading expenses...</Text>
                ) : expenses.length === 0 ? (
                    <Text style={{ marginTop: 20, color: colors.textMuted }}>No recent expenses found in your database.</Text>
                ) : (

                        expenses.slice(0, 5).map((item) => (
                            <Cards
                                key={item.id}
                                merchant={`${item.merchant !== 'Unknown' ? ` ${item.merchant}` : ''}`}
                                category={`${item.category}`}
                                amount={`Rs. ${item.amount}`}
                                date={`${new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' })} ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                onPress={() => setSelectedExpense(item)}
                            />
                        ))
                )
                }
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
                        backgroundColor: colors.warning,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text style={{ ...typography.button, color: "white" }}>
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
                        backgroundColor: isScanning ? "#8abfff" : colors.brand,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text style={{ ...typography.button, color: "white" }}>
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
                    style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }}
                    onPress={() => setSelectedExpense(null)}
                >
                    <Pressable style={{ backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                        <Text style={{ ...typography.section, marginBottom: 6, color: colors.text }}>Edit category</Text>
                        {selectedExpense ? (
                            <Text style={{ color: colors.textMuted, marginBottom: 18 }}>
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
                                        backgroundColor: isSelected ? colors.brand : colors.surfaceMuted,
                                    }}
                                >
                                    <Text style={{ ...typography.label, color: isSelected ? "white" : colors.text }}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                </Pressable>
                            );
                        })}

                        <Pressable onPress={() => setSelectedExpense(null)} style={{ paddingVertical: 14, alignItems: "center" }}>
                            <Text style={{ ...typography.label, color: colors.brand }}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
