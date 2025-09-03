"use client";

import React from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { SignOut } from "@/components/pages/dashboard/avatar/singout/component";  
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function RepositoriesAvatarComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-10 h-10 rounded-full p-0 bg-[#F7F8F4] hover:bg-[#E8E9E4]"
          title="User Menu"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 bg-[#F7F8F4]">
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
