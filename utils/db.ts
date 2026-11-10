import * as SQLite from 'expo-sqlite';
import { maskSensitiveMerchant, ParsedExpense } from './smsParser';
import uuid from 'react-native-uuid';
const DB_NAME = 'expenses.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (dbInstance) return dbInstance;
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return dbInstance;
};

export const initDB = async () => {
    const db = await getDB();
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY NOT NULL,
            amount REAL NOT NULL,
            date INTEGER NOT NULL,
            category TEXT NOT NULL,
            merchant TEXT NOT NULL,
            is_synced INTEGER DEFAULT 0
        )
    `);

    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            status TEXT DEFAULT "PENDING" NOT NULL
        )
    `);

    // Create Indexes for high-performance queries
    await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_is_synced ON transactions(is_synced)`);

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
    const hasOriginalTextColumn = columns.some(
        column => column.name?.toLowerCase() === 'originaltext'
    );

    if (hasOriginalTextColumn) {
        try {
            await db.runAsync('UPDATE transactions SET originalText = ?', '');
        } catch (err) {
            console.warn('Could not clear legacy originalText values:', err);
        }
    }

    const rows = await db.getAllAsync<{ id: string; merchant: string }>('SELECT id, merchant FROM transactions');
    const updateMerchantStatement = await db.prepareAsync('UPDATE transactions SET merchant = ? WHERE id = ?');
    try {
        for (const row of rows) {
            const maskedMerchant = maskSensitiveMerchant(row.merchant);
            if (maskedMerchant !== row.merchant) {
                await updateMerchantStatement.executeAsync([maskedMerchant, row.id]);
            }
        }
    } finally {
        await updateMerchantStatement.finalizeAsync();
    }
};

export const insertTransactions = async (expenses: ParsedExpense[]) => {
    const db = await getDB();
    const statement = await db.prepareAsync(
        `INSERT INTO transactions (id, amount, date, category, merchant, is_synced)
         VALUES ($id, $amount, $date, $category, $merchant, 0)
         ON CONFLICT(id) DO UPDATE SET
            merchant = CASE
                WHEN transactions.merchant = 'Unknown' AND excluded.merchant != 'Unknown'
                THEN excluded.merchant
                ELSE transactions.merchant
            END,
            is_synced = CASE
                WHEN transactions.merchant = 'Unknown' AND excluded.merchant != 'Unknown'
                THEN 0
                ELSE transactions.is_synced
            END`
    );
    try {
        for (const exp of expenses) {
            await statement.executeAsync({
                $id: exp.id,
                $amount: exp.amount,
                $date: exp.date,
                $category: exp.category,
                $merchant: maskSensitiveMerchant(exp.merchant),
            });
        }
    } finally {
        await statement.finalizeAsync();
    }
};

export const getAllTransactions = async (): Promise<ParsedExpense[]> => {
    const db = await getDB();
    const result = await db.getAllAsync<{ id: string, amount: number, date: number, category: string, merchant: string, is_synced: number }>('SELECT * FROM transactions ORDER BY date DESC');
    return result as any as ParsedExpense[];
};

export const getPaginatedTransactions = async (limit: number, offset: number): Promise<ParsedExpense[]> => {
    const db = await getDB();
    const result = await db.getAllAsync<{ id: string, amount: number, date: number, category: string, merchant: string, is_synced: number }>('SELECT * FROM transactions ORDER BY date DESC LIMIT ? OFFSET ?', [limit, offset]);
    return result as any as ParsedExpense[];
};

export const updateTransactionCategory = async (id: string, category: ParsedExpense['category']) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE transactions SET category = ? WHERE id = ?',
        category,
        id
    );
};

export const getTransactionsByDateRange = async (startTimestamp: number, endTimestamp?: number): Promise<ParsedExpense[]> => {
    const db = await getDB();
    let query = 'SELECT * FROM transactions WHERE date >= ?';
    let params = [startTimestamp];
    
    if (endTimestamp) {
        query += ' AND date <= ?';
        params.push(endTimestamp);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await db.getAllAsync(query, params);
    return result as any as ParsedExpense[];
};

export const getPendingQueue = async (): Promise<{ id: string, action_type: string, payload: string, created_at: number, status: string }[]> => {
    const db = await getDB();
    const result = await db.getAllAsync<{ id: string, action_type: string, payload: string, created_at: number, status: string }>('SELECT * FROM sync_queue WHERE status = "PENDING"');
    return result;
};


export const addToSyncQueue = async (actionType: string, payload: string) => {
    const db = await getDB();
    const result = await db.runAsync(
        'INSERT INTO sync_queue (action_type, payload, created_at, status) VALUES (?, ?, ?, "PENDING")',
        actionType,
        payload,
        Date.now()
    );
};

export const deleteQueueTransaction = async (id:string) => {
    const db = await getDB();
    const result = await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
};


export const getUnsyncedTransactions = async (): Promise<ParsedExpense[]> => {
    const db = await getDB();
    const result = await db.getAllAsync<{ id: string, amount: number, date: number, category: string, merchant: string, is_synced: number }>('SELECT * FROM transactions WHERE is_synced = 0');
    return result as any as ParsedExpense[];
};

export const markTransactionsAsSynced = async (ids: string[]) => {
    if (ids.length === 0) return;
    const db = await getDB();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`UPDATE transactions SET is_synced = 1 WHERE id IN (${placeholders})`, ...ids);
};

export const seedDummyData = async () => {
    const db = await getDB();
    
    // Check if we already seeded to prevent duplicating on every app load
    const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions WHERE id LIKE "dummy-%"');
    if (count && count.count > 0) {
        console.log("Dummy data already exists, skipping seed.");
        return;
    }

    console.log("Seeding dummy data...");
    
    for (let i = 1; i <= 5; i++) {
        await db.runAsync(
            `INSERT INTO transactions (id, amount, date, category, merchant, is_synced) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                `${uuid.v4() as string}`, 
                Math.round(Math.random() * 1000), 
                Date.now() - (i * 86400000), // Minus i days
                'BILLS', 
                `Dummy Merchant ${i}`, 
                0
            ]
        );
    }
    console.log("5 Dummy transactions inserted successfully.");
};
