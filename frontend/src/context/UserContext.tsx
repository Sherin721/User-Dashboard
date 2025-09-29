import React, { createContext, useEffect, useState, ReactNode } from "react";

// Define the context type
interface UserContextType {
  loggedInUser: string | null;
  loginTime: string | null;
  login: (username: string, rememberMe?: boolean) => void;
  logout: () => void;
}

// Create the context
export const UserContext = createContext<UserContextType>({
  loggedInUser: null,
  loginTime: null,
  login: () => {},
  logout: () => {},
});

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loginTime, setLoginTime] = useState<string | null>(null);

  // Load from localStorage if "remember me" was checked
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const { username, time } = JSON.parse(saved);
      setLoggedInUser(username);
      setLoginTime(time);
    }
  }, []);

  // Login function
  const login = (username: string, rememberMe: boolean = false) => {
    const now = new Date().toLocaleString();
    setLoggedInUser(username);
    setLoginTime(now);

    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify({ username, time: now }));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Logout function
  const logout = () => {
    setLoggedInUser(null);
    setLoginTime(null);
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider value={{ loggedInUser, loginTime, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
