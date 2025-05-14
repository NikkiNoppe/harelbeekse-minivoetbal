
import React from "react";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";

const Index = () => {
  return (
    <AuthProvider>
      <TabVisibilityProvider>
        <Layout />
      </TabVisibilityProvider>
    </AuthProvider>
  );
};

export default Index;
