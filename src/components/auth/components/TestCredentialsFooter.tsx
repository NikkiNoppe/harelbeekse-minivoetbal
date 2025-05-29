
import React from "react";
import { CardFooter } from "@/components/ui/card";
import { Shield, User as UserIcon } from "lucide-react";

const TestCredentialsFooter: React.FC = () => {
  return (
    <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <UserIcon size={14} />
        <span>Admin: admin / admin123</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield size={14} />
        <span>Team: team1 / team123</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield size={14} />
        <span>Scheidsrechter: referee / referee123</span>
      </div>
    </CardFooter>
  );
};

export default TestCredentialsFooter;
