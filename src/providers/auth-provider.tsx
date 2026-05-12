import React, { createContext, ReactNode } from "react";
import { useProvideAuth } from "../hooks/useAuth";

export const AuthContext = createContext<ReturnType<typeof useProvideAuth>>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
