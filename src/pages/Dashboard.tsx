
import React from "react";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";

const Dashboard = () => {
  return (
    <AuthProvider>
      <TabVisibilityProvider>
        <Layout />
      </TabVisibilityProvider>
    </AuthProvider>
  );
};

export default Dashboard;
