import NetInfo from '@react-native-community/netinfo';
import { CreateBulkExpenses, UpdateBulkExpense, GetAllExpenses } from "@/utils/api";
import { deleteQueueTransaction, getPendingQueue, getUnsyncedTransactions, markTransactionsAsSynced, insertTransactions } from "./db";

export async function SyncDatabase() {

    console.log("fn called")

    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;
    const isInternetReachable = state.isInternetReachable;

    console.log("isConnected before try", isConnected)
    console.log("isInternetReachable before try", isInternetReachable)

    try {

        if (!isConnected || !isInternetReachable) {
            return;
        }

        console.log("Syncing Database")

        // 0. Pull down any existing transactions from the server (e.g. if local storage was cleared)
        try {
            console.log("Pulling latest transactions from server...");
            const pullResponse = await GetAllExpenses(1, 100);
            
            if (pullResponse.success && pullResponse.data) {
                const rawData = pullResponse.data;
                const items = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.expenses || rawData?.transactions || []);
                
                if (items.length > 0) {
                    const serverExpenses = items.map((item: any) => {
                        // Safely parse date: handles ISO strings, numeric timestamps, and string timestamps
                        let rawDate = item.date;
                        if (typeof rawDate === 'string' && !isNaN(Number(rawDate))) {
                            rawDate = Number(rawDate);
                        }
                        const parsedTimestamp = new Date(rawDate).getTime();
                        const finalTimestamp = isNaN(parsedTimestamp) ? Date.now() : parsedTimestamp;

                        return {
                            id: item.id || item._id,
                            amount: item.amount,
                            date: finalTimestamp,
                            category: item.category,
                            merchant: item.merchant || 'Unknown'
                        };
                    });
                    
                    console.log("Parsed server dates:", serverExpenses.map(e => e.date));
                    
                    await insertTransactions(serverExpenses);
                    const fetchedIds = serverExpenses.map((e: any) => e.id);
                    await markTransactionsAsSynced(fetchedIds);
                    console.log(`Pulled and inserted ${serverExpenses.length} transactions from server.`);
                }
            }
        } catch (pullError) {
            console.log("Error pulling from server", pullError);
        }

        // 1. Get only transactions that are NOT synced yet
        const unsyncedTransactions = await getUnsyncedTransactions();

        const pendingSyncTransactions = await getPendingQueue();

        if (pendingSyncTransactions.length > 0) {
            await ProcessPendingSyncTransactions(pendingSyncTransactions);
        }

        console.log("unsyncedTransactions: ", unsyncedTransactions)
        console.log("pendingSyncTransactions: ", pendingSyncTransactions)

        if (unsyncedTransactions.length === 0) {
            console.log("No new transactions to sync.");
            return;
        }

        console.log(`Found ${unsyncedTransactions.length} unsynced transactions. Sending in bulk...`);

        // 2. Map local data to API body format
        const expensesToSync = unsyncedTransactions.map(item => ({
            id: item.id,
            amount: item.amount,
            category: item.category.toUpperCase(),
            date: new Date(item.date).toISOString(), // Adjust if item.date is already ISO
            merchant: item.merchant,
        }));

        console.log("unsyncedTransactions: ", JSON.stringify(unsyncedTransactions))

        // 3. Make a SINGLE API call to sync all of them (Bulk API)
        const response = await CreateBulkExpenses({ expenses: expensesToSync });

        console.log(response, "this is response");

        // 4. Mark them as synced in local DB so we don't sync them again
        const idsToMark = unsyncedTransactions.map(item => item.id);
        await markTransactionsAsSynced(idsToMark);

        console.log("Database sync complete.");

    } catch (error) {
        console.log("Error sync Database", error)
    }

}


async function ProcessPendingSyncTransactions(pendingSyncTransactions: any) {

    try {


        console.log(`Found ${pendingSyncTransactions.length} unsynced transactions. Sending in bulk...`);

        // 2. Map local data to API body format
        const expensesToSync = pendingSyncTransactions.map(item => {

            const data = JSON.parse(item.payload)
            return {
                id: data.id,
                category: data.category.toUpperCase(),

            }
        })

        // 3. Make a SINGLE API call to sync all of them (Bulk API)
        console.log("PAYLOAD BEING SENT TO UpdateBulkExpense:", JSON.stringify(expensesToSync, null, 2));
        
        const response = await UpdateBulkExpense({ expenses: expensesToSync });

        console.log(response, "this is update bulk api");

        if (response.success) {
            for (const item of pendingSyncTransactions) {
                await deleteQueueTransaction(item.id);
            }
        } else {
            console.log("Failed to sync queue to backend, keeping items in queue");
        }

        console.log("Update Bulk Database sync complete.");
    } catch (error) {

        console.log(error, 'Pendnig Sync failed')

    }

}    
