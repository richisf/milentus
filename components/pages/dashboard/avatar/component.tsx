"use client";

import React from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { SignOut } from "./singout/component";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function RepositoriesAvatarComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-10 h-10 rounded-full p-0"
          title="User Menu"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
