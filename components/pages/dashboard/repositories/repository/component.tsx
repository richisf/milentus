"use client";

import React, { useState, useEffect, useRef } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { RemoveRepository } from "@/components/pages/dashboard/repositories/repository/remove/component";
import { MachineStatus } from "@/components/pages/dashboard/repositories/repository/state/component";
import { FetchFiles } from "@/components/pages/dashboard/repositories/repository/files/component";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface Repository {
  _id: Id<"repository">;
  _creationTime: number;
  userId?: string;
  githubAccountId: Id<"githubAccount">;
  name: string;
  displayName: string;
  isDefault?: boolean;
  machine?: {
    _id: Id<"machine">;
    _creationTime: number;
    repositoryId: Id<"repository">;
    name: string;
    zone: string;
    state: string;
    ipAddress?: string;
    domain?: string;
    convexUrl?: string;
    convexProjectId?: number;
  };
  document?: {
    _id: Id<"document">;
    _creationTime: number;
    repositoryId: Id<"repository">;
    nodes: Array<{
      id: string;
      parentId: string;
      label: string;
      collapsed?: boolean;
    }>;
  };
}

interface RepositorySettingsProps {
  repository: Repository;
  onRepositoryRemoved: () => void;
}

export default function RepositorySettings({ repository, onRepositoryRemoved }: RepositorySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Settings Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors border border-gray-300"
        title="Repository Settings"
      >
        <Cog6ToothIcon className="w-4 h-4" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-10 right-0 rounded-lg shadow-lg border border-gray-300 p-2 min-w-40 z-[60] bg-white">
          <div className="flex flex-col gap-1">
            {/* Machine Status - simplified */}
            {repository.machine && (
              <MachineStatus
                repositoryId={repository._id}
                machine={repository.machine}
              />
            )}

            {/* Fetch Files */}
            <FetchFiles
              repositoryId={repository._id}
              repositoryName={repository.name}
            />

            {/* Remove Repository */}
            <RemoveRepository
              repositoryId={repository._id}
              repositoryName={repository.name}
              repositoryDisplayName={repository.displayName}
              onRemoveSuccess={onRepositoryRemoved}
            />
          </div>
        </div>
      )}


    </div>
  );
}
