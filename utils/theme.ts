export const colors = {
  brand: "#7C3AED",
  brandDark: "#5B21B6",
  brandSoft: "#A78BFA",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#E9D8FD",
  text: "#0F172A",
  textMuted: "#64748B",
  textSoft: "#94A3B8",
  border: "#D8B4FE",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
  overlay: "rgba(15, 23, 42, 0.45)",
} as const;

export const typography = {
  fontFamily: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
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
    fontFamily: "Inter-Bold",
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  heading: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  section: {
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
  caption: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  button: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
} as const;

export const theme = {
  colors,
  typography,
} as const;
