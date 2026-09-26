import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getUserToken() {
    return AsyncStorage.getItem("userToken");
}

export const getUserData = async () => {
    const userData = await AsyncStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
}

export const isAuthUser = async () => {
    const token = await getUserToken();
    if(!token) {
        return false;
    }
    return true
    
}