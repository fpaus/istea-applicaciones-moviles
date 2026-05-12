import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../providers/auth-provider";
import { authService, User } from "../services/auth";

export function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = await authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (userData: User) => {
    await authService.login(userData);
    const { password, ...safeUser } = userData;
    setUser(safeUser);
  };

  const register = async (userData: User) => {
    await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    register,
    logout,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
