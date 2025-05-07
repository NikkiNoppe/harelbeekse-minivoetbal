
import React from "react";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/components/auth/AuthProvider";

const Index = () => {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
};

export default Index;
