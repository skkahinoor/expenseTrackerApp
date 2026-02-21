import { useAuth } from "@/context/AuthContext";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

export interface Bank {
  id: number;
  user_id: number;
  name: string;
  purpose: string;
  balance: number;
  card_number: string | null;
  expiry_date: string | null;
  cvv: string | null;
  holder_name: string | null;
  created_at: string;
  updated_at: string;
}

interface BankContextType {
  banks: Bank[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalBalance: number;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

export const BankProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/banks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch banks");
      const data: Bank[] = await res.json();
      setBanks(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const totalBalance = banks.reduce(
    (sum, b) => sum + parseFloat(b.balance.toString()),
    0,
  );

  return (
    <BankContext.Provider
      value={{ banks, isLoading, error, refresh: fetchBanks, totalBalance }}
    >
      {children}
    </BankContext.Provider>
  );
};

export const useBanks = () => {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBanks must be used within BankProvider");
  return ctx;
};
