import { getTransactionsByDateRange, initDB, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type MonthTransactionsParams = {
  monthKey: string;
  label: string;
};

const CATEGORIES: ParsedExpense["category"][] = ["food", "travelling", "shopping", "others"];

export default function MonthTransactions() {
  const navigation = useNavigation();
  const route = useRoute();
  const { monthKey, label } = route.params as MonthTransactionsParams;
  const [transactions, setTransactions] = useState<ParsedExpense[]>([]);
  const [total, setTotal] = useState(0);

  const refreshMonthTransactions = useCallback(async () => {
    await initDB();
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 1).getTime() - 1;
    const rows = await getTransactionsByDateRange(start, end);

    setTransactions(rows);
    setTotal(rows.reduce((sum, item) => sum + item.amount, 0));
  }, [monthKey]);

  useFocusEffect(
    useCallback(() => {
      const fetchMonthTransactions = async () => {
        try {
          await refreshMonthTransactions();
        } catch (err) {
          console.error("Error fetching month transactions:", err);
        }
      };

      fetchMonthTransactions();
    }, [refreshMonthTransactions])
  );

  const handleCategoryChange = async (id: string, category: ParsedExpense["category"]) => {
    await updateTransactionCategory(id, category);
    setTransactions((currentTransactions) =>
      currentTransactions.map((item) =>
        item.id === id ? { ...item, category } : item
      )
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f2f2f6" }}>
      <View style={{ padding: 20, paddingTop: 28 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 18 }}>
          <Text style={{ color: "#007AFF", fontSize: 16, fontWeight: "600" }}>Back</Text>
        </Pressable>

        <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 6 }}>{label}</Text>
        <Text style={{ fontSize: 16, color: "gray", marginBottom: 20 }}>
          {transactions.length} transactions found
        </Text>

        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Month Total</Text>
          <Text style={{ fontSize: 30, fontWeight: "bold" }}>Rs. {total.toFixed(2)}</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16 }}>
            <Text style={{ color: "gray", textAlign: "center" }}>No transactions found for this month.</Text>
          </View>
        ) : (
          transactions.map((item) => (
            <View key={item.id} style={{ backgroundColor: "white", padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: "700" }}>
                  {item.merchant !== "Unknown" ? item.merchant : item.category.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>Rs. {item.amount.toFixed(2)}</Text>
              </View>
              <Text style={{ color: "gray", marginBottom: 10 }}>
                {new Date(item.date).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} • {item.category}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((category) => {
                  const isSelected = item.category === category;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => handleCategoryChange(item.id, category)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 18,
                        backgroundColor: isSelected ? "#007AFF" : "#f2f2f6",
                      }}
                    >
                      <Text style={{ color: isSelected ? "white" : "#111", fontSize: 13, fontWeight: "600" }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
