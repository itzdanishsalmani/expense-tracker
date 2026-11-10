export type CategoryType =
  | "FOOD"
  | "TRANSPORT"
  | "SHOPPING"
  | "BILLS"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "TRAVEL"
  | "OTHERS";

export interface CategoryOption {
  id: CategoryType;
  label: string;
  iconName: string;
  iconFamily: "Ionicons" | "Feather" | "MaterialCommunityIcons";
  defaultMerchant: string;
  color: string;
}

export const CATEGORIES: CategoryOption[] = [
  {
    id: "FOOD",
    label: "Food",
    iconName: "silverware-fork-knife",
    iconFamily: "MaterialCommunityIcons",
    defaultMerchant: "Restaurant",
    color: "#F59E0B",
  },
  {
    id: "TRANSPORT",
    label: "Transport",
    iconName: "car-outline",
    iconFamily: "Ionicons",
    defaultMerchant: "Transport",
    color: "#2563EB",
  },
  {
    id: "SHOPPING",
    label: "Shopping",
    iconName: "shopping-bag",
    iconFamily: "Feather",
    defaultMerchant: "Store",
    color: "#EC4899",
  },
  {
    id: "BILLS",
    label: "Bills",
    iconName: "receipt-outline",
    iconFamily: "Ionicons",
    defaultMerchant: "Utility Bill",
    color: "#06B6D4",
  },
  {
    id: "ENTERTAINMENT",
    label: "Entertainment",
    iconName: "play-circle-outline",
    iconFamily: "Ionicons",
    defaultMerchant: "Entertainment",
    color: "#8B5CF6",
  },
  {
    id: "HEALTH",
    label: "Health",
    iconName: "heart-pulse",
    iconFamily: "MaterialCommunityIcons",
    defaultMerchant: "Health",
    color: "#EF4444",
  },
  {
    id: "TRAVEL",
    label: "Travel",
    iconName: "airplane-outline",
    iconFamily: "Ionicons",
    defaultMerchant: "Travel",
    color: "#3B82F6",
  },
  {
    id: "OTHERS",
    label: "Others",
    iconName: "grid-outline",
    iconFamily: "Ionicons",
    defaultMerchant: "Manual Entry",
    color: "#64748B",
  },
];

export const CATEGORY_IDS: CategoryType[] = CATEGORIES.map((cat) => cat.id);

export const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#F59E0B",
  TRANSPORT: "#2563EB",
  TRAVEL: "#2563EB",
  SHOPPING: "#EC4899",
  BILLS: "#06B6D4",
  ENTERTAINMENT: "#8B5CF6",
  HEALTH: "#EF4444",
  OTHERS: "#64748B",
};

export const createEmptyCategoryData = (): Record<CategoryType, number> => ({
  FOOD: 0,
  TRANSPORT: 0,
  SHOPPING: 0,
  BILLS: 0,
  ENTERTAINMENT: 0,
  HEALTH: 0,
  TRAVEL: 0,
  OTHERS: 0,
});

export const getCategoryConfig = (category?: string): CategoryOption => {
  if (!category) return CATEGORIES[0];
  const upper = category.toUpperCase();
  if (upper === "TRAVEL") {
    return CATEGORIES.find((c) => c.id === "TRANSPORT") || CATEGORIES[0];
  }
  return (
    CATEGORIES.find((c) => c.id === upper || c.label.toUpperCase() === upper) ||
    CATEGORIES[0]
  );
};

export const getDefaultMerchant = (category?: string): string => {
  return getCategoryConfig(category).defaultMerchant;
};

/**
 * Converts a raw/API category string (e.g. "FOOD", "TRANSPORT", "OTHERS")
 * into user-friendly Title Case display text (e.g. "Food", "Transport", "Others").
 * Used exclusively for presentation in the UI, keeping underlying database
 * and API values in uppercase.
 */
export const getCategoryDisplayName = (category?: string): string => {
  if (!category) return "";
  if (category.toLowerCase() === "all") return "All";
  const upper = category.toUpperCase();
  if (upper === "TRAVEL") return "Transport";
  const found = CATEGORIES.find(
    (c) => c.id === upper || c.label.toUpperCase() === upper
  );
  if (found) return found.label;
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

/** Alias for getCategoryDisplayName */
export const formatCategory = getCategoryDisplayName;
