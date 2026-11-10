import { addToSyncQueue, getTransactionsByDateRange, initDB, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import DateTimePicker from "@react-native-community/datetimepicker";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { compareAsc, compareDesc, endOfMonth, format, startOfMonth } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, typography } from "@/utils/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_IDS as CATEGORIES, formatCategory } from "@/constants/categories";

type MonthTransactionsParams = {
  monthKey: string;
  label: string;
};

type CategoryFilter = "all" | ParsedExpense["category"];
type SortDirection = "desc" | "asc";

const formatDateKey = (timestamp: number) => {
  // Format as YYYY-MM-DD
  return format(new Date(timestamp), "yyyy-MM-dd");
};

const formatShortDate = (timestamp: number) => (
  format(new Date(timestamp), "dd-MMM")
);

const getCategoryIcon = (category: ParsedExpense["category"]) => {
  switch (category) {
    case "FOOD":
      return { name: "shopping-basket", family: Fontisto, color: "#F59E0B" };
    case "TRAVEL":
      return { name: "bus", family: Fontisto, color: "#2563EB" };
    case "SHOPPING":
      return { name: "shopping-bag", family: Fontisto, color: "#EC4899" };
    default:
      return { name: "wallet", family: Fontisto, color: "#64748B" };
  }
};

export default function MonthTransactions() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { monthKey, label } = route.params as MonthTransactionsParams;
  const [transactions, setTransactions] = useState<ParsedExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | "all">("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const availableDates = useMemo(() => {
    const dateMap = new Map<string, number>();

    transactions.forEach((item) => {
      const dateKey = formatDateKey(item.date);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, item.date);
      }
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => compareDesc(a[1], b[1]))
      .map(([key, timestamp]) => ({ key, label: formatShortDate(timestamp) }));
  }, [transactions]);

  const highestTransaction = useMemo(() => (
    transactions.reduce<ParsedExpense | null>(
      (highest, item) => (!highest || item.amount > highest.amount ? item : highest),
      null
    )
  ), [transactions]);

  const lowestTransaction = useMemo(() => (
    transactions.reduce<ParsedExpense | null>(
      (lowest, item) => (!lowest || item.amount < lowest.amount ? item : lowest),
      null
    )
  ), [transactions]);

  const filteredTransactions = useMemo(() => (
    transactions
      .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
      .filter((item) => {
        if (selectedDate === "all") return true;
        return formatDateKey(item.date) === selectedDate;
      })
      .sort((a, b) => (
        sortDirection === "desc"
          ? compareDesc(a.date, b.date)
          : compareAsc(a.date, b.date)
      ))
  ), [selectedCategory, selectedDate, sortDirection, transactions]);

  const filteredTotal = useMemo(() => (
    filteredTransactions.reduce((sum, item) => sum + item.amount, 0)
  ), [filteredTransactions]);


  // Helper to filter out transactions with duplicate amount and date
  const filterDuplicates = (txs: ParsedExpense[]) => {
    const seen = new Set<string>();
    return txs.filter((item) => {
      const key = `${item.amount}_${formatDateKey(item.date)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const refreshMonthTransactions = useCallback(async () => {
    await initDB();
    const [year, month] = monthKey.split("-").map(Number);
    // Use date-fns to get start and end of month
    const start = startOfMonth(new Date(year, month - 1)).getTime();
    const end = endOfMonth(new Date(year, month - 1)).getTime();
    const rows = await getTransactionsByDateRange(start, end);
    const filteredRows = filterDuplicates(rows);
    setTransactions(filteredRows);
    setTotal(filteredRows.reduce((sum, item) => sum + item.amount, 0));
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

    console.log('Task added in Queue: ', { id, category });
    await addToSyncQueue("UPDATE", JSON.stringify({ id, category }));
  };

  return (

    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: insets.top + 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={{ ...typography.section, fontSize: 16, color: colors.text }}>Monthly overview</Text>
        </View>

        <LinearGradient
            colors={['#7C3AED', '#7C3AED', '#A78BFA']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ padding: 16, borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}
            >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.title, color: "white", marginBottom: 4, fontSize: 20 }}>{label}</Text>
              <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {filteredTransactions.length} of {transactions.length} transactions shown
              </Text>
            </View>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
            }}>
              <Fontisto name="wallet" size={20} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4, fontSize: 11 }}>Month Total</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ ...typography.title, color: colors.text, fontSize: 20 }}>Rs. {total.toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Ionicons name="arrow-down" size={10} color="#22c55e" />
                  <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '600', marginLeft: 2 }}>12%</Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>vs August</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(124, 58, 237, 0.05)', padding: 12, borderRadius: 12 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4, fontSize: 11 }}>Lowest spend</Text>
              <Text style={{ ...typography.section, color: colors.text, marginBottom: 2, fontSize: 16 }}>
                Rs. {lowestTransaction?.amount.toFixed(2) || '0.00'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted }}>
                {lowestTransaction?.merchant !== "Unknown" ? lowestTransaction?.merchant : (lowestTransaction?.category ? formatCategory(lowestTransaction.category) : 'No data')}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(124, 58, 237, 0.05)', padding: 12, borderRadius: 12 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4, fontSize: 11 }}>Highest spend</Text>
              <Text style={{ ...typography.section, color: colors.text, marginBottom: 2, fontSize: 16 }}>
                Rs. {highestTransaction?.amount.toFixed(2) || '0.00'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted }}>
                {highestTransaction?.merchant !== "Unknown" ? highestTransaction?.merchant : (highestTransaction?.category ? formatCategory(highestTransaction.category) : 'No data')}
              </Text>
            </View>
          </View>
        </View>

        {transactions.length > 0 && (
          <>
            <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View>
                  <Text style={{ ...typography.section, color: colors.text }}>Filters</Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>Showing Rs. {filteredTotal.toFixed(2)}</Text>
                </View>
                <Pressable
                  onPress={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: colors.brand,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  >
                  <Ionicons name={sortDirection === "desc" ? "arrow-down" : "arrow-up"} size={14} color="white" />
                  <Text style={{ ...typography.button, color: "white" }}>
                    Date {sortDirection === "desc" ? "Desc" : "Asc"}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ ...typography.label, color: colors.text, marginBottom: 8 }}>Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {(["all", ...CATEGORIES] as CategoryFilter[]).map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 18,
                      backgroundColor: isSelected ? colors.text : colors.surfaceMuted,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSelected ? "white" : colors.brand }} />
                      <Text style={{ ...typography.caption, color: isSelected ? "white" : colors.text }}>
                        {formatCategory(category)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ ...typography.label, color: colors.text, marginBottom: 8 }}>Date</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate === "all" ? colors.text : colors.surfaceMuted,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  >
                  <Ionicons name="calendar-outline" size={14} color={selectedDate === "all" ? "white" : colors.text} />
                  <Text style={{ ...typography.caption, color: selectedDate === "all" ? "white" : colors.text }}>
                    All dates
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate !== "all" ? colors.text : colors.surfaceMuted,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  >
                  <Ionicons name="funnel-outline" size={14} color={selectedDate !== "all" ? "white" : colors.text} />
                  <Text style={{ ...typography.caption, color: selectedDate !== "all" ? "white" : colors.text }}>
                    {selectedDate !== "all" ? format(new Date(selectedDate), "dd-MMM-yyyy") : "Pick a date"}
                  </Text>
                </Pressable>
              </View>
              {showDatePicker && (
                <DateTimePicker
                value={selectedDate !== "all" ? new Date(selectedDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (event.type === "set" && date) {
                    setSelectedDate(formatDateKey(date.getTime()));
                  }
                }}
                maximumDate={new Date()}
                />
              )}
            </View>
          </>
        )}

        {transactions.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16 }}>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: "center" }}>No transactions found for this month.</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16 }}>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: "center" }}>No transactions match these filters.</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
            <View key={item.id} style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                <View style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    {(() => {
                      const icon = getCategoryIcon(item.category);
                      const IconComponent = icon.family;
                      return <IconComponent name={icon.name as any} size={16} color={icon.color} />;
                    })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.text, marginBottom: 4 }}>
                      {item.merchant !== "Unknown" ? item.merchant : formatCategory(item.category)}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {format(new Date(item.date), "dd-MMM HH:mm")}
                    </Text>
                  </View>
                </View>
                <Text style={{ ...typography.label, color: colors.text }}>Rs. {item.amount.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {formatCategory(item.category)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {format(new Date(item.date), "HH:mm")}
                  </Text>
                </View>
              </View>
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
                      backgroundColor: isSelected ? colors.brand : colors.surfaceMuted,
                    }}
                    >
                      <Text style={{ ...typography.caption, color: isSelected ? "white" : colors.text }}>
                        {formatCategory(category)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
    </ScrollView>
      </View>
        </View>
  );
}
