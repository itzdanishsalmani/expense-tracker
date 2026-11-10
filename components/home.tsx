import Cards from "@/components/cards";
import { useAuth } from "@/context/authContext";
import { getAllTransactions, initDB, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import { SyncDatabase } from "@/utils/syncDatabase";
import { colors, typography } from "@/utils/theme";
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { requestNotificationPermissions } from "@/utils/notification";

import { CATEGORY_IDS as CATEGORIES } from "@/constants/categories";

export default function Home() {
    const navigation = useNavigation<any>();
    const { userData } = useAuth()
    const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<ParsedExpense | null>(null);

    const refreshExpenseList = useCallback(async () => {
        // Fetch the 10 most recent transactions overall for the list
        const allExpenses = await getAllTransactions();
        const recentExpenses = allExpenses.slice(0, 10);
        
        setExpenses(recentExpenses);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Calculate total spent today from all expenses
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

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [loadExpenses])
    );

    useEffect(() => {
        const sync = async () => {
            await SyncDatabase();
            // Refresh the list just in case new transactions were pulled down from the server
            await refreshExpenseList();
        };
        sync();
    }, [refreshExpenseList])


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

    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <LinearGradient
                colors={['#7C3AED', '#854be9ff', '#FFFFFF']}
                style={{ paddingTop: insets.top + 16, padding: 16, paddingBottom: 16 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                    <View>
                        <Text style={{ ...typography.title, color: '#FFFFFF', fontSize: 20 }}>Hello, {userData?.name || 'Danish'} 👋</Text>
                        <Text style={{ ...typography.body, color: '#E9D8FD', fontSize: 12 }}>Track. Understand. Save better</Text>
                    </View>
                   

                <LinearGradient
                    colors={['#7C3AED', '#7C3AED', '#A78BFA']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ marginTop: 20, padding: 16, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={{ ...typography.label, color: '#fff', opacity: 0.9, fontWeight: '400', fontSize: 12 }}>
                                Today's Spend
                            </Text>
                            <Text style={{ ...typography.title, color: '#fff', marginTop: 4, fontSize: 26 }}>
                                Rs. {totalSpent.toFixed(2)}
                            </Text>
                            <Text style={{ ...typography.caption, color: '#E9D8FD', marginTop: 2, fontSize: 11 }}>
                                No transactions yet today
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 10 }}>Today</Text>
                            <Ionicons name="chevron-down" size={10} color="#fff" />
                        </View>
                    </View>

                    <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.8 }}>
                        <Ionicons name="wallet" size={80} color="rgba(255,255,255,0.2)" />
                    </View>
                </LinearGradient>
            </LinearGradient>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isScanning}
                        onRefresh={loadExpenses}
                        colors={[colors.brand]}
                        tintColor={colors.brand}
                    />
                }
            >
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AddTransaction')}
                    activeOpacity={0.85}
                    style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: colors.brand, 
                        paddingVertical: 14, 
                        paddingHorizontal: 18, 
                        borderRadius: 16, 
                        marginTop: 14,
                        marginBottom: 16,
                        shadowColor: colors.brand, 
                        shadowOffset: { width: 0, height: 4 }, 
                        shadowOpacity: 0.25, 
                        shadowRadius: 8, 
                        elevation: 4 
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 12, 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <Entypo name="plus" size={22} color="#fff" />
                        </View>
                        <View>
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Add Transaction</Text>
                            <Text style={{ color: '#E9D8FD', fontSize: 12, marginTop: 2 }}>Record a new expense manually</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.85)" />
                </TouchableOpacity>

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                    }}
                >

                    <Text style={{ ...typography.section, marginVertical: 10, color: colors.text }}>Recent Expenses</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("AllTransactions")}
                    >
                        <Text style={{ ...typography.label, color: colors.brand }}>View all</Text>

                    </TouchableOpacity>
                </View>

                {isScanning ? (
                    <Text style={{ marginTop: 20, color: colors.brand }}>Loading expenses...</Text>
                ) : expenses.length === 0 ? (
                    <Text style={{ marginTop: 20, color: colors.textMuted }}>No recent expenses found in your database.</Text>
                ) : (

                    expenses.slice(0, 10).map((item) => (
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


        </View>
    );
}
