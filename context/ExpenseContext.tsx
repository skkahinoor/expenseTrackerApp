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

interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExpense: (data: NewExpense) => Promise<void>;
  totalSpent: number;
  categoryTotals: Record<string, number>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

export const ExpenseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data: Expense[] = await res.json();
      setExpenses(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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
    await fetchExpenses(); // refresh list
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        isLoading,
        error,
        refresh: fetchExpenses,
        addExpense,
        totalSpent,
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
