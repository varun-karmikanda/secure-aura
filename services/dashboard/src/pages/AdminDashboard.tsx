import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Overview } from "@/components/admin/Overview";
import { ApiTester } from "@/components/admin/ApiTester";
import { UserManagement } from "@/components/admin/UserManagement";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { SecurityPanel } from "@/components/admin/SecurityPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "api-tester":
        return <ApiTester />;
      case "users":
        return <UserManagement />;
      case "logs":
        return <SystemLogs />;
      case "security":
        return <SecurityPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <Overview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default Index;
