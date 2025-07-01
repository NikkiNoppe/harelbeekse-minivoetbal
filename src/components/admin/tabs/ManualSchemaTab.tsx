
import React from "react";
import ManualSchemaTab from "../competition-generator/ManualSchemaTab";

const ManualSchemaTabWrapper: React.FC = () => {
  const handleSchemaImported = (matches: any[]) => {
    console.log('Manual schema imported:', matches);
    // The matches are already saved to the database in ManualSchemaTab
  };

  return (
    <ManualSchemaTab onSchemaImported={handleSchemaImported} />
  );
};

export default ManualSchemaTabWrapper;
