import { ParsedExpense } from "./smsParser";

export interface NotificationData {
  title: string;
  body: string;
  date: number;
}

export function parseNotificationToExpense(notification: NotificationData): ParsedExpense | null {
  const lowerBody = notification.body.toLowerCase();
  
  // Common expense indicators
  const expenseIndicators = ["debited", "spent", "paid", "sent", "deducted", "transaction", "withdrawn", "txn", "dr", "purchase", "debit"];
  // Exclude keywords for non-expense messages
  const excludeIndicators = [
      "recharge", "credited", "received", "balance", "offer", "promo", "loan", "emi", "otp", "bill due", "reminder", "cashback", "refund", "gift", "points", "reward", "cash deposit", "salary", "interest", "fixed deposit", "fd", "rd", "sip", "insurance", "policy", "opening balance", "closing balance", "available balance", "credited by", "cash received"
  ];

  const isExpense = expenseIndicators.some(indicator => lowerBody.includes(indicator));
  const isExcluded = excludeIndicators.some(indicator => lowerBody.includes(indicator));
  
  if (!isExpense || isExcluded) {
    return null;
  }

  // Improved amount match for Rs, INR, ₹, and formats like "debited 500"
  const amountMatch = notification.body.match(/(?:(?:Rs\.?|INR|₹)\s*)((?:\d+)(?:,\d+)*(?:\.\d+)?)/i)
      || lowerBody.match(/(?:debited(?: by)?|spent|paid|deducted(?: by)?)\s*(?:rs\.?|inr|₹)?\s*((?:\d+)(?:,\d+)*(?:\.\d+)?)/i);

  if (!amountMatch || !amountMatch[1]) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) return null;

  // Dummy merchant extraction (improve as needed)
  let merchant = "Unknown";
  const merchantMatch = notification.body.match(/at ([^ ]+)/i) || notification.body.match(/to ([^ ]+)/i);
  if (merchantMatch) merchant = merchantMatch[1];

  // Dummy category (improve as needed)
  const category: ParsedExpense["category"] = "others";

  return {
    id: `${amount}_${notification.date}`,
    amount,
    category,
    date: notification.date,
    originalText: notification.body,
    merchant,
  };
}
