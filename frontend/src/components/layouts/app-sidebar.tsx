import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { useCommon } from "@/hooks/useCommon";
import { AppWindow, Hamburger } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export function AppSidebar() {
  const { handleCanvasMode } = useCommon();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="ml-2">
              <div className="" onClick={handleCanvasMode}>
                <AppWindow />
                <span>재무재표</span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuButton asChild className="ml-2">
              <div className="" onClick={() => toast.success("토스트바")}>
                <Hamburger />
                <span>토스트바</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
