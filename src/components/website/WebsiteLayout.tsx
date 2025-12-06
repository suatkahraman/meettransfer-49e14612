import { ReactNode } from "react";
import WebsiteHeader from "./WebsiteHeader";
import BottomNavigation from "./BottomNavigation";

interface WebsiteLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

const WebsiteLayout = ({ children, showBottomNav = true }: WebsiteLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <WebsiteHeader />
      <main className={showBottomNav ? "pb-20" : ""}>{children}</main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default WebsiteLayout;
