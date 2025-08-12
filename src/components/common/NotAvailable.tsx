
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EyeOff } from "lucide-react";

interface NotAvailableProps {
  title?: string;
  description?: string;
}

const NotAvailable: React.FC<NotAvailableProps> = ({
  title = "Niet beschikbaar",
  description = "Deze pagina is verborgen door de administrator."
}) => {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <EyeOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Neem contact op met een beheerder indien je toegang nodig hebt.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotAvailable;
