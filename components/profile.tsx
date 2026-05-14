import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import CategoryChart from "./CategoryChart";
import { getAllTransactions, initDB } from "@/utils/db";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ParsedExpense } from "@/utils/smsParser";

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF9500',
  travelling: '#007AFF',
  shopping: '#FF2D55',
  others: '#8E8E93'
};

type MonthlyExpenseData = {
  key: string;
  label: string;
  total: number;
  categories: Record<string, number>;
};

const createEmptyCategoryData = () => ({ food: 0, travelling: 0, shopping: 0, others: 0 });

const buildChartData = (categoryData: Record<string, number>) => (
  Object.entries(categoryData).map(([cat, val]) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: val,
    color: CATEGORY_COLORS[cat] || '#8E8E93'
  }))
);

const getMonthLabel = (date: Date) => (
  date.toLocaleDateString([], { month: "long", year: "numeric" })
);

export default function Profile() {
  const navigation = useNavigation<any>();
  const [categoryData, setCategoryData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseData[]>([]);
  const [totalParsed, setTotalParsed] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchAllExpenses = async () => {
        try {
          await initDB();
          const parsed = await getAllTransactions();
          setTotalParsed(parsed.length);

          const groupedCategories: Record<string, number> = createEmptyCategoryData();
          const groupedMonths = new Map<string, MonthlyExpenseData>();
          let total = 0;

          parsed.forEach((ex: ParsedExpense) => {
            const date = new Date(ex.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!groupedMonths.has(monthKey)) {
              groupedMonths.set(monthKey, {
                key: monthKey,
                label: getMonthLabel(date),
                total: 0,
                categories: createEmptyCategoryData(),
              });
            }

            const month = groupedMonths.get(monthKey)!;

            total += ex.amount;
            month.total += ex.amount;
            groupedCategories[ex.category] = (groupedCategories[ex.category] || 0) + ex.amount;
            month.categories[ex.category] = (month.categories[ex.category] || 0) + ex.amount;
          });

          setCategoryData(groupedCategories);
          setMonthlyData(Array.from(groupedMonths.values()).sort((a, b) => b.key.localeCompare(a.key)));
          setTotalSpent(total);
        } catch (err) {
          console.error("Error fetching historical SMS from DB for profile:", err);
        }
      }

      fetchAllExpenses();
    }, [])
  );

  const chartData = buildChartData(categoryData);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f2f2f6' }}>
      <View style={{ padding: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 5 }}>Profile & Insights</Text>
        <Text style={{ fontSize: 16, color: "gray", marginBottom: 30 }}>
          We have securely analyzed {totalParsed} transactions.
        </Text>

        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>All Scanned Expenses</Text>
          <Text style={{ fontSize: 30, fontWeight: "bold" }}>Rs. {totalSpent.toFixed(2)}</Text>
        </View>

        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Category Breakdown</Text>
          {chartData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, marginBottom: 40, color: 'gray' }}>No scanned expenses found.</Text>
          ) : (
            <CategoryChart data={chartData} />
          )}
        </View>

        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 14 }}>Month Wise</Text>
        {monthlyData.length === 0 ? (
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 40 }}>
            <Text style={{ textAlign: 'center', color: 'gray' }}>No monthly expenses found.</Text>
          </View>
        ) : (
          monthlyData.map((month) => {
            const monthChartData = buildChartData(month.categories);

            return (
              <Pressable
                key={month.key}
                onPress={() => navigation.navigate("MonthTransactions", { monthKey: month.key, label: month.label })}
                style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 }}
              >
                <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>{month.label}</Text>
                <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>Rs. {month.total.toFixed(2)}</Text>
                <CategoryChart data={monthChartData} size={150} strokeWidth={24} />
                <Text style={{ color: "#007AFF", textAlign: "center", fontWeight: "600" }}>View messages</Text>
              </Pressable>
            );
          })
        )}

      </View>
    </ScrollView>
  );
}
