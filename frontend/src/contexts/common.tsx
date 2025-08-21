import { createContext, useState, useContext } from "react";

type CommonContextType = {
  sideBarOpen: boolean;
  handleSideBarOpen: () => void;
  canvasMode: boolean;
  handleCanvasMode: () => void;
};

const CommonContext = createContext<CommonContextType | undefined>(undefined);

export function CommonProvider({ children }: { children: React.ReactNode }) {
  const [canvasMode, setCanvasMode] = useState(false);
  const [sideBarOpen, setSideBarOpen] = useState(false);

  const handleSideBarOpen = () => {
    setSideBarOpen(!sideBarOpen);
  };

  const handleCanvasMode = () => {
    setCanvasMode(!canvasMode);
  };

  return (
    <CommonContext.Provider
      value={{ sideBarOpen, handleSideBarOpen, canvasMode, handleCanvasMode }}
    >
      {children}
    </CommonContext.Provider>
  );
}

// useCommon 훅 추가
export function useCommon() {
  const context = useContext(CommonContext);
  if (context === undefined) {
    throw new Error('useCommon must be used within a CommonProvider');
  }
  return context;
}

// Context를 export하여 별도 훅 파일에서 사용할 수 있도록 함
export { CommonContext };
