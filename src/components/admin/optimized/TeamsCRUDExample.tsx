import React, { useState, useMemo } from "react";
import { AdminCRUDTable, ColumnDef } from "../AdminCRUDTable";
import { adminService, Team } from "@/services/admin";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const TeamsCRUDExample: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Use the optimized CRUD hooks
  const { data: teams, isLoading, error } = adminService.teams.useFetchAll();
  const createTeam = adminService.teams.useCreate();
  const updateTeam = adminService.teams.useUpdate();
  const deleteTeam = adminService.teams.useDelete();

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!teams) return [];

    let filtered = teams.filter(team =>
      team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort data
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.team_name.localeCompare(b.team_name));
        break;
      case "balance_desc":
        filtered.sort((a, b) => b.balance - a.balance);
        break;
      case "balance":
        filtered.sort((a, b) => a.balance - b.balance);
        break;
      default:
        break;
    }

    return filtered;
  }, [teams, searchTerm, sortBy]);

  // Column definitions
  const columns: ColumnDef<Team>[] = [
    {
      key: "team_name",
      header: "Teamnaam",
      width: "w-1/3",
    },
    {
      key: "balance",
      header: "Saldo",
      width: "w-1/4",
      render: (value: number) => (
        <span className={`font-semibold ${value < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Aangemaakt",
      width: "w-1/4",
      render: (value: string) => new Date(value).toLocaleDateString('nl-NL'),
    },
  ];

  // Sort options
  const sortOptions = [
    { value: "name", label: "Teamnaam (A-Z)" },
    { value: "balance_desc", label: "Hoogste saldo" },
    { value: "balance", label: "Laagste saldo" },
  ];

  // Event handlers
  const handleAdd = () => {
    // Open add dialog
    console.log("Add team");
  };

  const handleEdit = (team: Team) => {
    // Open edit dialog
    console.log("Edit team:", team);
  };

  const handleDelete = async (team: Team) => {
    if (team.team_id) {
      await deleteTeam.mutateAsync(team.team_id);
    }
  };

  return (
    <div className="space-y-6">
      <AdminCRUDTable
        title="Teams Beheer"
        data={filteredAndSortedData}
        isLoading={isLoading}
        error={error}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={deleteTeam.isPending}
        isAdding={createTeam.isPending}
        isUpdating={updateTeam.isPending}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        addButtonText="Team Toevoegen"
        emptyMessage="Geen teams gevonden"
        errorMessage="Er is een fout opgetreden bij het laden van de teams."
      />
    </div>
  );
};

export default TeamsCRUDExample; 