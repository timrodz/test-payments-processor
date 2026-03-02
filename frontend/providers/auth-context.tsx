"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { client } from "@/lib/client/client.gen";
import { readUserMeApiV1UsersMeGet } from "@/lib/client/sdk.gen";
import type { UserPublic } from "@/lib/client/types.gen";

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useMemo(
    () => () => {
      localStorage.removeItem("token");
      client.setConfig({
        headers: {
          Authorization: undefined,
        },
      });
      setUser(null);
      router.push("/login");
    },
    [router],
  );

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        client.setConfig({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        try {
          const { data } = await readUserMeApiV1UsersMeGet();
          if (data) {
            setUser(data);
            if (pathname === "/login") {
              router.push("/");
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
          logout();
        }
      } else if (pathname !== "/login") {
        router.push("/login");
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout, pathname, router]);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    client.setConfig({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Re-run initAuth or just fetch user
    const fetchUser = async () => {
      try {
        const { data } = await readUserMeApiV1UsersMeGet();
        if (data) {
          setUser(data);
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch user after login", error);
      }
    };
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      ) : !user && pathname !== "/login" ? null : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
