
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ListFilter } from "lucide-react";

const SubmittedFormsList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingevulde Formulieren</CardTitle>
        <CardDescription>
          Overzicht van alle ingevulde wedstrijdformulieren
        </CardDescription>
        
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek op team of wedstrijdcode..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-1">
            <ListFilter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Geen ingevulde formulieren gevonden.
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmittedFormsList;
