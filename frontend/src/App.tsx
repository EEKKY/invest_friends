import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { AuthProvider } from "@/contexts/auth-provider";
import { AuthCallbackPage } from "@/pages/auth/callback";
import SignupPage from "@/pages/auth/signuppage";
import { UnifiedLoginPage } from "./pages/login";

function AppContent() {
  const { sideBarOpen, handleSideBarOpen, canvasMode } = useCommon();

  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/login" element={<UnifiedLoginPage />} />
          <Route path="/social-callback" element={<AuthCallbackPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
    <AuthProvider>
      <CommonProvider>
        <AppContent />
      </CommonProvider>
    </AuthProvider>
  );
}

export default App;
