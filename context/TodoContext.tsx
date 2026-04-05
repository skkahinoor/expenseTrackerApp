import { useAuth } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Todo {
  id: number;
  user_id: number;
  task: string;
  completed: boolean;
  amount?: number;
  category?: string;
  at?: string;
  remind_at?: string;
  created_at: string;
  updated_at: string;
}

interface TodoContextType {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTodo: (task: string, amount?: number, category?: string, remind_at?: string) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

export const TodoProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data: Todo[] = Array.isArray(json) ? json : (json.data || []);
        setTodos(data);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [token]);

  const refresh = async () => {
    await fetchTodos();
  };

  const addTodo = async (task: string, amount?: number, category?: string, remind_at?: string) => {
    if (!token) throw new Error("Not authenticated");
    
    const payload: any = { 
      task: task,
      amount: amount,
      category: category,
      at: remind_at, // Send as 'at'
      remind_at: remind_at // Keep for compatibility
    };

    console.log("Adding Todo Payload:", JSON.stringify(payload));
    console.log("Using Token:", token.substring(0, 10) + "...");

    const res = await fetch(`${API_BASE}/todos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to add task");
    }
    await fetchTodos();
  };

  const toggleTodo = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    console.log(`Toggling Todo ID: ${id}, Current status: ${todo.completed}`);

    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ completed: !todo.completed }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Unauthorized: Your session may have expired. Please logout and login again.");
      }
      const err = await res.json();
      throw new Error(err.message || "Failed to toggle task");
    }
    await fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete task");
    }
    await fetchTodos();
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        isLoading,
        error,
        refresh,
        addTodo,
        toggleTodo,
        deleteTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
};
