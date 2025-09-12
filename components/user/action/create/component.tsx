"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

export function SignUpForm() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="p-4 flex items-center justify-center h-full">
      <div className="flex items-start gap-28">
        <div className="h-56 flex items-start justify-center">
          <Image
            src="/name.svg"
            alt="White Node Logo"
            width={2827}
            height={1040}
            className="h-full w-auto object-contain"
          />
        </div>
          <div className="h-56 max-w-md flex flex-col justify-between">
            <form
              className="flex flex-col justify-between h-full w-full"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                formData.set("flow", "signUp");
                void signIn("password", formData)
                  .catch((error) => {
                    setError(error.message);
                  })
                  .then(() => {
                    router.push("/user");
                  });
              }}
            >
              <div className="flex flex-col justify-between flex-1">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  id="email"
                  className="text-base w-full"
                />
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  id="password"
                  className="text-base w-full"
                />
                <Button type="submit" className="w-full text-base font-medium">
                  Sign up
                </Button>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error signing up: {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>
        </div>
    </div>
  );
}
