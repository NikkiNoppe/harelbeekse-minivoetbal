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
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-purple-800">
            Inloggen
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
