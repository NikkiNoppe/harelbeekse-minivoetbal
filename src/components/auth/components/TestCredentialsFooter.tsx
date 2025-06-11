import React from "react";
import { CardFooter } from "@/components/ui/card";
import { Shield, User as UserIcon } from "lucide-react";

const TestCredentialsFooter: React.FC = () => {
  return (
    <CardFooter className="flex flex-col space-y-2 text-sm text-purple-dark bg-white">
      <div className="flex items-center gap-1 text-purple-dark">
        <UserIcon size={14} />
        <span>Admin: admin / admin123</span>
      </div>
      <div className="flex items-center gap-1 text-purple-dark">
        <Shield size={14} />
        <span>Team: team1 / team123</span>
      </div>
      <div className="flex items-center gap-1 text-purple-dark">
        <Shield size={14} />
        <span>Scheidsrechter: referee1 / referee123</span>
      </div>
    </CardFooter>
  );
};

export default TestCredentialsFooter;
