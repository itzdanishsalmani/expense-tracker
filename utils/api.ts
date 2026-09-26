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
    amount: number,
    category: string,
    merchant: string,
    date: string
}

export function CreateExpense(bodyData: CreateExpenseData): Promise<ApiResponse> {
    return apiConnector("POST", "/expense/create-expense", bodyData);
}
