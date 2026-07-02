import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import CategoryChart from "./CategoryChart";
import { getAllTransactions, initDB } from "@/utils/db";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ParsedExpense } from "@/utils/smsParser";
import { colors, typography } from "@/utils/theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 28 }}>
        <View style={{ backgroundColor: colors.brand, padding: 18, borderRadius: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>Insight</Text>
              <Text style={{ ...typography.title, color: "white", marginBottom: 6 }}>Profile overview</Text>
              <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)" }}>
                {totalParsed} transactions analyzed
              </Text>
            </View>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
            }}>
              <MaterialIcons name="auto-graph" size={26} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Fontisto name="wallet" size={16} color={colors.brand} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4 }}>Total Expense</Text>
            <Text style={{ ...typography.section, color: colors.text }}>Rs. {totalSpent.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ionicons name="list-outline" size={18} color={colors.text} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4 }}>Tracked Items</Text>
            <Text style={{ ...typography.section, color: colors.text }}>{totalParsed}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 18 }}>
          <Text style={{ ...typography.section, marginBottom: 10, color: colors.text }}>Category Breakdown</Text>
          {chartData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <Text style={{ ...typography.body, textAlign: 'center', marginTop: 40, marginBottom: 40, color: colors.textMuted }}>No scanned expenses found.</Text>
          ) : (
            <CategoryChart data={chartData} />
          )}
        </View>

        <Text style={{ ...typography.heading, color: colors.text, marginBottom: 14 }}>Month Wise</Text>
        {monthlyData.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 40 }}>
            <Text style={{ ...typography.body, textAlign: 'center', color: colors.textMuted }}>No monthly expenses found.</Text>
          </View>
        ) : (
          monthlyData.map((month) => {
            const monthChartData = buildChartData(month.categories);

            return (
              <Pressable
                key={month.key}
                onPress={() => navigation.navigate("MonthTransactions", { monthKey: month.key, label: month.label })}
                style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <View>
                    <Text style={{ ...typography.section, marginBottom: 4, color: colors.text }}>{month.label}</Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>{month.total.toFixed(2)} total spent</Text>
                  </View>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="calendar-month" size={20} color={colors.brand} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
                <CategoryChart data={monthChartData} size={150} strokeWidth={24} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Text style={{ ...typography.label, color: colors.brand, textAlign: "center" }}>View messages</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.brand} />
                </View>
              </Pressable>
            );
          })
        )}

      </View>
    </ScrollView>
  );
}
