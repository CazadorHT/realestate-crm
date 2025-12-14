"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface UsersFiltersProps {
  onSearchChange: (search: string) => void;
  onRoleFilterChange: (role: string) => void;
}

export function UsersFilters({ onSearchChange, onRoleFilterChange }: UsersFiltersProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleRoleFilterChange = (value: string) => {
   setRoleFilter(value);
    onRoleFilterChange(value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full md:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ค้นหาชื่อหรือเบอร์โทร..."
          className="pl-9 w-full"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="บทบาท" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">ทั้งหมด</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="AGENT">Agent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
