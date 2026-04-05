import { useAuth } from "@/context/AuthContext";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Expense {
  id: number;
  user_id: number;
  bank_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface NewExpense {
  bank_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Transfer {
  id: number;
  user_id: number;
  from_bank_id: number;
  to_bank_id: number;
  from_bank?: { name: string };
  to_bank?: { name: string };
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  transfers: Transfer[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExpense: (data: NewExpense) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  addTransfer: (data: any) => Promise<void>;
  deleteTransfer: (id: number) => Promise<void>;
  totalSpent: number;
  totalTransferred: number;
  categoryTotals: Record<string, number>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

// Import added at top
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ExpenseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cache instantly on boot to prevent dashboard "empty" lag
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedExp = await AsyncStorage.getItem("cached_expenses");
        const cachedTrans = await AsyncStorage.getItem("cached_transfers");
        if (cachedExp) setExpenses(JSON.parse(cachedExp));
        if (cachedTrans) setTransfers(JSON.parse(cachedTrans));
      } catch (e) {}
    };
    loadCache();
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [res, resT] = await Promise.all([
        fetch(`${API_BASE}/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        fetch(`${API_BASE}/transfers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      if (res.ok) {
        const data: Expense[] = await res.json();
        setExpenses(data);
        AsyncStorage.setItem("cached_expenses", JSON.stringify(data));
      }
      if (resT.ok) {
        const dataT: Transfer[] = await resT.json();
        setTransfers(dataT);
        AsyncStorage.setItem("cached_transfers", JSON.stringify(dataT));
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const refresh = async () => {
    await fetchExpenses();
  };

  const addExpense = async (data: NewExpense) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to add expense");
    }
    await fetchExpenses();
  };

  const deleteExpense = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete expense");
    }
    await fetchExpenses();
  };

  const addTransfer = async (data: any) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/transfers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to transfer money");
    }
    await fetchExpenses();
  };

  const deleteTransfer = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/transfers/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete transfer");
    }
    await fetchExpenses();
  };

  const currentMonth = new Date().toISOString().substring(0, 7);

  const totalSpent = expenses.reduce((sum, e) => {
    if (e.date && e.date.startsWith(currentMonth)) return sum + e.amount;
    return sum;
  }, 0);

  const totalTransferred = transfers.reduce((sum, t) => {
    if (t.date && t.date.startsWith(currentMonth)) return sum + t.amount;
    return sum;
  }, 0);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    if (e.date && e.date.startsWith(currentMonth)) {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    }
    return acc;
  }, {});

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        transfers,
        isLoading,
        error,
        refresh,
        addExpense,
        deleteExpense,
        addTransfer,
        deleteTransfer,
        totalSpent,
        totalTransferred,
        categoryTotals,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
};
