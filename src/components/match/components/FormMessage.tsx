
import React from "react";

interface FormMessageProps {
  children: React.ReactNode;
  type?: "error" | "info" | "success";
}

export const FormMessage: React.FC<FormMessageProps> = ({ children, type = "info" }) => {
  const bgColor = 
    type === "error" ? "bg-red-50 text-red-700 border-red-200" :
    type === "success" ? "bg-green-50 text-green-700 border-green-200" :
    "bg-blue-50 text-blue-700 border-blue-200";
  
  return (
    <div className={`p-4 rounded-md border ${bgColor}`}>
      {children}
    </div>
  );
};
