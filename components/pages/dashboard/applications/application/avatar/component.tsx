"use client";

import React, { useState, useEffect, useRef } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { RemoveApplication } from "@/components/pages/dashboard/applications/application/avatar/remove/component";
import { MachineStatus } from "@/components/pages/dashboard/applications/application/avatar/machine/component";  
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface Application {
  _id: Id<"application">;
  _creationTime: number;
  userId?: string;
  name: string;
  machine?: {
    _id: Id<"machine">;
    _creationTime: number;
    applicationId: Id<"application">;
    name: string;
    zone: string;
    state: string;
    ipAddress?: string;
    domain?: string;
    convexUrl?: string;
    convexProjectId?: number;
  };
  repository?: {
    _id: Id<"repository">;
    _creationTime: number;
    applicationId: Id<"application">;
    githubAccountId: Id<"githubAccount">;
    name: string;
    accessToken?: string;
    githubUsername?: string;
  };
  document?: {
    _id: Id<"document">;
    _creationTime: number;
    applicationId: Id<"application">;
    nodes: Array<{
      id: string;
      parentId: string;
      label: string;
      collapsed?: boolean;
      fileId?: Id<"files">;
    }>;
  };
}

interface ApplicationSettingsProps {
  application: Application;
  onApplicationRemoved: () => void;
}

export default function ApplicationSettings({ application, onApplicationRemoved }: ApplicationSettingsProps) {
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
        title="Application Settings"
      >
        <Cog6ToothIcon className="w-4 h-4" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-10 right-0 rounded-lg shadow-lg border border-gray-300 p-2 min-w-40 z-[60] bg-white">
          <div className="flex flex-col gap-1">
            {/* Machine Status - simplified */}
            {application.machine && (
              <MachineStatus
                applicationId={application._id}
                machine={application.machine}
              />
            )}

            {/* Remove Application */}
            <RemoveApplication
              applicationId={application._id}
              applicationName={application.name}
              applicationDisplayName={application.name}
              onRemoveSuccess={onApplicationRemoved}
            />
          </div>
        </div>
      )}


    </div>
  );
}
