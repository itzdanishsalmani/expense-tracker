export interface SmsMessage {
    body: string;
    date: number;
}

export interface ParsedExpense {
    id: string;
    amount: number;
    category: "travelling" | "food" | "shopping" | "others";
    date: number;
    originalText: string;
    merchant: string;
}

const CATEGORIES = {
    food: ["swiggy", "zomato", "zepto", "blinkit", "mcdonald", "kfc", "burger king", "dominos", "pizza hut", "food", "restaurant", "cafe", "starbucks"],
    travelling: ["uber", "ola", "rapido", "irctc", "makemytrip", "redbus", "flight", "metro", "petrol", "fuel", "indian oil", "bharat petroleum", "hpcl"],
    shopping: ["amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "shopping", "mall", "mart", "dmart", "reliance", "lifestyle", "shopee", "meesho"],
};

export function maskSensitiveMerchant(value: string): string {
    const cleaned = value.trim();
    if (!cleaned || cleaned === "Unknown") return cleaned || "Unknown";

    if (cleaned.includes("@")) {
        const [handle, provider] = cleaned.split("@");
        if (handle.length > 4 && provider) {
            return `${"*".repeat(handle.length - 4)}${handle.slice(-4)}@${provider}`;
        }
    }

    const digits = cleaned.replace(/\D/g, "");
    if (digits.length >= 6 && /^[+\d\s-]+$/.test(cleaned)) {
        return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
    }

    return cleaned;
}

function formatMerchantName(value: string): string {
    const cleaned = value
        .replace(/\s+/g, " ")
        .replace(/[.,;:-]+$/g, "")
        .trim();

    if (!cleaned) return "Unknown";
    if (/^\d+$/.test(cleaned)) return maskSensitiveMerchant(cleaned);
    if (cleaned.includes("@")) return maskSensitiveMerchant(cleaned.toLowerCase());

    return maskSensitiveMerchant(cleaned
        .toLowerCase()
        .replace(/\b[a-z]/g, char => char.toUpperCase()));
}

function extractMerchant(body: string): string {
    const merchantPatterns = [
        /\btrf\s+to\s+(.+?)(?:\s+ref(?:no)?\b|\s+if\s+not\b|$)/i,
        /\b(?:paid|sent|transferred)\s+to\s+(.+?)(?:\s+on\b|\s+ref(?:no)?\b|\s+upi\b|\s+if\s+not\b|$)/i,
        /\b(?:at|to|inf)\s+(.+?)(?:\s+on\b|\s+ref(?:no)?\b|\s+upi\b|\s+sbi\b|\s+hdfc\b|\s+icici\b|[.]|$)/i,
    ];

    for (const pattern of merchantPatterns) {
        const match = body.match(pattern);
        if (match?.[1]) {
            const merchant = formatMerchantName(match[1]);
            if (merchant !== "Unknown") return merchant;
        }
    }

    return "Unknown";
}

export function parseAndCategorizeExpenses(smsList: SmsMessage[]): ParsedExpense[] {
    const expenses: ParsedExpense[] = [];
    const seenMap = new Set<string>();

    // Common expense indicators
    const expenseIndicators = ["debited", "spent", "paid", "sent", "deducted", "transaction", "withdrawn", "txn", "dr", "purchase", "debit"];
    // Exclude keywords for non-expense messages
    const excludeIndicators = [
        "recharge", "credited", "received", "balance", "offer", "promo", "loan", "emi", "otp", "bill due", "reminder", "cashback", "refund", "gift", "points", "reward", "cash deposit", "salary", "interest", "fixed deposit", "fd", "rd", "sip", "insurance", "policy", "opening balance", "closing balance", "available balance", "credited by", "cash received"
    ];

    smsList.forEach(sms => {
        const lowerBody = sms.body.toLowerCase();

        // Check if message is an expense
        const isExpense = expenseIndicators.some(indicator => lowerBody.includes(indicator));
        // Exclude if message contains any exclude keywords
        const isExcluded = excludeIndicators.some(indicator => lowerBody.includes(indicator));
        if (!isExpense || isExcluded) return;

        // Try to find the amount. Common Indian formats: Rs. 500, Rs 500, INR 500, Rs.500.00, or just "debited by 500"
        const amountMatch = sms.body.match(/(?:(?:Rs\.?|INR|₹)\s*)((?:\d+)(?:,\d+)*(?:\.\d+)?)/i)
            || lowerBody.match(/(?:debited(?: by)?|spent|paid|deducted(?: by)?)\s*(?:rs\.?|inr|₹)?\s*((?:\d+)(?:,\d+)*(?:\.\d+)?)/i);

        if (amountMatch && amountMatch[1]) {
            // parse amount, removing commas
            const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            if (isNaN(amount) || amount <= 0) return;

            // Find category based on keywords
            let category: ParsedExpense["category"] = "others";
            for (const [catName, keywords] of Object.entries(CATEGORIES)) {
                if (keywords.some(kw => lowerBody.includes(kw))) {
                    category = catName as ParsedExpense["category"];
                    break;
                }
            }

            // Deduplication Check
            // A unique key based on exact amount and the timestamp.
            // Since SMS timestamps might vary slightly if received over network, 
            // grouping around the same minute could be even safer but exact date + amount is strong.
            const uniqueKey = `${amount}_${sms.date}`;

            if (!seenMap.has(uniqueKey)) {
                seenMap.add(uniqueKey);

                expenses.push({
                    id: uniqueKey,
                    amount,
                    category,
                    date: sms.date,
                    originalText: sms.body,
                    merchant: extractMerchant(sms.body)
                });
            }
        }
    });

    // Sort by date descending (newest first)
    return expenses.sort((a, b) => b.date - a.date);
}
