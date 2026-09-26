import axios, { type AxiosRequestConfig, type Method } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ResponseType = AxiosRequestConfig["responseType"];

// ── Standard envelope your backend always returns ─────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export const axiosInstance = axios.create();

// Automatically attach the auth token to every request
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  console.log(token, 'userToken')
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── apiConnector ──────────────────────────────────────────────────────────
// Always resolves (never throws). Returns { success, message, data }.
export const apiConnector = async <T = unknown>(
  method: Method,
  url: string,
  bodyData?: unknown,
  params?: Record<string, unknown>,
  responseType?: ResponseType,
): Promise<ApiResponse<T>> => {
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL + "/api";

  try {
    const response = await axiosInstance<ApiResponse<T>>({
      method,
      url: `${BASE_URL}${url}`,
      data: bodyData ?? null,
      params: params ?? {},
      responseType: responseType ?? 'json',
    });
    return response.data;
  } catch (error: any) {
    // HTTP error with a BE response body (e.g. 401, 400)
    const serverData: ApiResponse<T> | undefined = error?.response?.data;
    return {
      success: false,
      message: serverData?.message ?? "Network error. Please check your connection.",
    };
  }
};
