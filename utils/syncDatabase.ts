import NetInfo from '@react-native-community/netinfo';
import { CreateExpense } from "@/utils/api";
import { getAllTransactions } from "./db";

export async function SyncDatabase(){

    console.log("fn called")

    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;
    const isInternetReachable = state.isInternetReachable;
    
    console.log("isConnected before try", isConnected)
    console.log("isInternetReachable before try", isInternetReachable)
    
    try {

        if(!isConnected || !isInternetReachable){
            return;
        }

        console.log("Syncing Database")
        // const allTransactions = await getAllTransactions();
        
        // allTransactions.map(async (item) => {
        //     const response = await CreateExpense({
        //         amount: item.amount,
        //         category: item.category,
        //         date: item.date,
        //         merchant: item.merchant
        //     })
        const response = await CreateExpense({
                amount: 1000,
                category: "FOOD",
                date: '2026-09-26T18:14:00.000Z',
                merchant: "testing merchant"
            })
            console.log(response.data , "this is response")


        
    } catch (error) {
        console.log("Error sync Database", error)
    }


}
