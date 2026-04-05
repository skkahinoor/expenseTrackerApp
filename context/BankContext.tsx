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
  addBank: (data: Partial<Bank>) => Promise<void>;
  updateBank: (id: number, data: Partial<Bank>) => Promise<void>;
  deleteBank: (id: number) => Promise<void>;
  totalBalance: number;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

// Import AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BankProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from cache instantly on boot
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedBanks = await AsyncStorage.getItem("cached_banks");
        if (cachedBanks) setBanks(JSON.parse(cachedBanks));
      } catch (e) {}
    };
    loadCache();
  }, []);

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
      AsyncStorage.setItem("cached_banks", JSON.stringify(data));
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const addBank = async (data: Partial<Bank>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/banks`, {
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
      throw new Error(err.message || "Failed to add bank");
    }
    await fetchBanks();
  };

  const updateBank = async (id: number, data: Partial<Bank>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/banks/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update bank");
    }
    await fetchBanks();
  };

  const deleteBank = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/banks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete bank");
    }
    await fetchBanks();
  };

  const totalBalance = banks.reduce(
    (sum, b) => sum + parseFloat(b.balance.toString()),
    0,
  );

  return (
    <BankContext.Provider
      value={{
        banks,
        isLoading,
        error,
        refresh: fetchBanks,
        addBank,
        updateBank,
        deleteBank,
        totalBalance,
      }}
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
