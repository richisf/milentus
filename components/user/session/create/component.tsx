"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
  
export function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <div className="h-56 max-w-md flex flex-col justify-between">
      <form
        className="flex flex-col justify-between h-full w-full"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signIn");
          void signIn("password", formData)
            .catch((error) => {
              setError(error.message);
            })
            .then(() => {
              router.push("/user?session=true");
            });
        }}
      >
        <div className="flex flex-col justify-between flex-1">
          <Label htmlFor="email" className="text-base font-medium">Email</Label>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            id="email"
            className="text-base w-full"
            required
          />
          <Label htmlFor="password" className="text-base font-medium">Password</Label>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            id="password"
            className="text-base w-full"
            required
          />
          <Button
            type="submit"
            className="w-full text-base font-medium"
            disabled={!email || !password}
          >
            Sign in
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Error signing in: {error}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
