import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Safe localStorage access
const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail if localStorage is not available
  }
};

const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail if localStorage is not available
  }
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);
  const [cachedUser, setCachedUser] = useState<any>(null);

  // Initialize local state from localStorage
  useEffect(() => {
    const isAuth = getStorageItem("isAuthenticated") === "true";
    const userStr = getStorageItem("user");
    setIsLocallyAuthenticated(isAuth);
    if (isAuth && userStr) {
      try {
        setCachedUser(JSON.parse(userStr));
      } catch {
        setCachedUser(null);
      }
    }
  }, []);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle authentication state changes
  useEffect(() => {
    if (user) {
      // Store user authentication state
      setStorageItem("isAuthenticated", "true");
      setStorageItem("user", JSON.stringify(user));
      setIsLocallyAuthenticated(true);
      setCachedUser(user);
    } else if (error) {
      // Clear authentication state on error
      removeStorageItem("isAuthenticated");
      removeStorageItem("user");
      setIsLocallyAuthenticated(false);
      setCachedUser(null);
    }
  }, [user, error]);
  
  return {
    user: user || (isLocallyAuthenticated ? cachedUser : null),
    isLoading,
    isAuthenticated: !!user || (isLocallyAuthenticated && !error),
    error,
    signOut: () => {
      removeStorageItem("isAuthenticated");
      removeStorageItem("user");
      setIsLocallyAuthenticated(false);
      setCachedUser(null);
      queryClient.clear();
    }
  };
}