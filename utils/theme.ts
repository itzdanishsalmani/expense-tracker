export const colors = {
  brand: "#2563EB",
  brandDark: "#1D4ED8",
  brandSoft: "#DBEAFE",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  text: "#0F172A",
  textMuted: "#64748B",
  textSoft: "#94A3B8",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
  overlay: "rgba(15, 23, 42, 0.45)",
} as const;

export const typography = {
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  section: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
} as const;

export const theme = {
  colors,
  typography,
} as const;
