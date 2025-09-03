"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOut() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push("/signin");
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-white"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}
