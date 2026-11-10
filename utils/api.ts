import { apiConnector } from "./apiConnector";
import type { ApiResponse } from "./apiConnector";

export interface LoginBodyData {
    email: string;
    password: string;
}

export interface RegisterBodyData {
    name: string;
    email: string;
    password: string;
}

export function Login(bodyData: LoginBodyData): Promise<ApiResponse> {
    return apiConnector("POST", "/auth/signin", bodyData);
}

export function RegisterUser(bodyData: RegisterBodyData): Promise<ApiResponse> {
    return apiConnector("POST", "/auth/signup", bodyData);
}

export interface CreateExpenseData {
    id: string,
    amount: number,
    category: string,
    merchant: string,
    date: string
}

export interface UpdateExpenseData {
    id: string
    category: string,
}

export interface profile {
    name?: string;
    password?: string;
}
export type ProfileUpdateData = profile;

export function CreateExpense(bodyData: CreateExpenseData): Promise<ApiResponse> {
    return apiConnector("POST", "/expense/create-expense", bodyData);
}

export function CreateBulkExpenses(bodyData: { expenses: CreateExpenseData[] }): Promise<ApiResponse> {
    return apiConnector("POST", "/expense/bulk-create-expense", bodyData);
}

export function UpdateBulkExpense(bodyData: { expenses: UpdateExpenseData[] }): Promise<ApiResponse> {
    return apiConnector("PUT", "/expense/bulk-update-expense", bodyData);
}

export function GetAllExpenses(page: number = 1, limit: number = 50): Promise<ApiResponse> {
    return apiConnector("GET", `/expense/get-all-expenses?page=${page}&limit=${limit}`);
}

export function updateProfile(bodyData: profile): Promise<ApiResponse> {
    return apiConnector("PATCH", `/user/profile`, bodyData);
}
