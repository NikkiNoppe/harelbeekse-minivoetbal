
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import LoginForm from "./LoginForm";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose }) => {
  const handleLoginSuccess = () => {
    onClose(); // Close the dialog on successful login
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-purple-200 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-purple-100">
          <DialogTitle className="text-2xl font-bold text-purple-800 text-center">
            Inloggen
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
