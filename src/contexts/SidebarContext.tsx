import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ expanded: false, setExpanded: () => {} });

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
