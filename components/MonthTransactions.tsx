import { getTransactionsByDateRange, initDB, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { compareAsc, compareDesc, endOfMonth, format, startOfMonth } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type MonthTransactionsParams = {
  monthKey: string;
  label: string;
};

const CATEGORIES: ParsedExpense["category"][] = ["food", "travelling", "shopping", "others"];
type CategoryFilter = "all" | ParsedExpense["category"];
type SortDirection = "desc" | "asc";

const formatCategory = (category: CategoryFilter) => (
  category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)
);

const formatDateKey = (timestamp: number) => {
  // Format as YYYY-MM-DD
  return format(new Date(timestamp), "yyyy-MM-dd");
};

const formatShortDate = (timestamp: number) => (
  format(new Date(timestamp), "dd-MMM")
);

export default function MonthTransactions() {
  const navigation = useNavigation();
  const route = useRoute();
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
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f2f2f6" }}>
      <View style={{ padding: 20, paddingTop: 28 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 18 }}>
          <Text style={{ color: "#007AFF", fontSize: 16, fontWeight: "600" }}>Back</Text>
        </Pressable>

        <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 6 }}>{label}</Text>
        <Text style={{ fontSize: 16, color: "gray", marginBottom: 20 }}>
          {filteredTransactions.length} of {transactions.length} transactions shown
        </Text>

        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Month Total</Text>
          <Text style={{ fontSize: 30, fontWeight: "bold" }}>Rs. {total.toFixed(2)}</Text>
        </View>

        {transactions.length > 0 && (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
              <View style={{ flex: 1, backgroundColor: "white", padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ color: "gray", fontWeight: "600", marginBottom: 6 }}>Lowest spend</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>Rs. {lowestTransaction?.amount.toFixed(2)}</Text>
                <Text numberOfLines={1} style={{ color: "gray", marginTop: 4 }}>
                  {lowestTransaction?.merchant !== "Unknown" ? lowestTransaction?.merchant : lowestTransaction?.category}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "white", padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ color: "gray", fontWeight: "600", marginBottom: 6 }}>Highest paid</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>Rs. {highestTransaction?.amount.toFixed(2)}</Text>
                <Text numberOfLines={1} style={{ color: "gray", marginTop: 4 }}>
                  {highestTransaction?.merchant !== "Unknown" ? highestTransaction?.merchant : highestTransaction?.category}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: "white", padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: "700" }}>Filters</Text>
                  <Text style={{ color: "gray", marginTop: 2 }}>Showing Rs. {filteredTotal.toFixed(2)}</Text>
                </View>
                <Pressable
                  onPress={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")}
                  style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#007AFF" }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Date {sortDirection === "desc" ? "Desc" : "Asc"}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ fontWeight: "700", marginBottom: 8 }}>Category</Text>
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
                        backgroundColor: isSelected ? "#111" : "#f2f2f6",
                      }}
                    >
                      <Text style={{ color: isSelected ? "white" : "#111", fontSize: 13, fontWeight: "600" }}>
                        {formatCategory(category)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontWeight: "700", marginBottom: 8 }}>Date</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate === "all" ? "#111" : "#f2f2f6",
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: selectedDate === "all" ? "white" : "#111", fontSize: 13, fontWeight: "600" }}>
                    All dates
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate !== "all" ? "#111" : "#f2f2f6",
                  }}
                >
                  <Text style={{ color: selectedDate !== "all" ? "white" : "#111", fontSize: 13, fontWeight: "600" }}>
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
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16 }}>
            <Text style={{ color: "gray", textAlign: "center" }}>No transactions found for this month.</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16 }}>
            <Text style={{ color: "gray", textAlign: "center" }}>No transactions match these filters.</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
            <View key={item.id} style={{ backgroundColor: "white", padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: "700" }}>
                  {item.merchant !== "Unknown" ? item.merchant : item.category.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>Rs. {item.amount.toFixed(2)}</Text>
              </View>
              <Text style={{ color: "gray", marginBottom: 10 }}>
                {format(new Date(item.date), "dd-MMM HH:mm")} • {item.category}
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
