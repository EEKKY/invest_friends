import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppRight } from "@/components/layouts/app-right";
import { Toaster } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useCommon } from "@/hooks/useCommon";
import { CommonProvider } from "@/contexts/common";
import { AppLeft } from "@/components/layouts/app-left";
import { LoginPage } from "@/pages/login";

function AppContent() {
  const { sideBarOpen, handleSideBarOpen, canvasMode } = useCommon();

  useEffect(() => {
    console.log(canvasMode);
  }, [canvasMode]);

  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <SidebarProvider
                open={sideBarOpen}
                onOpenChange={handleSideBarOpen}
              >
                <AppSidebar />
                <SidebarInset>
                  <main className="flex flex-col h-screen w-screen relative">
                    <ResizablePanelGroup direction="horizontal">
                      <ResizablePanel className="relative h-full flex flex-col">
                        <AppHeader />
                        <AppLeft />
                        <div className=""></div>
                      </ResizablePanel>
                      {canvasMode && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel>
                            <AppHeader />
                            <AppRight />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  </main>
                </SidebarInset>
              </SidebarProvider>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

function App() {
  return (
    <CommonProvider>
      <AppContent />
    </CommonProvider>
  );
}

export default App;
