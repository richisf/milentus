"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
  
export function SignIn() {
  const { signIn } = useAuthActions();
  const [buttonError, setButtonError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <div className="h-56 max-w-md flex flex-col justify-between">
      <form
        className="flex flex-col justify-between h-full w-full"
        onSubmit={(e) => {
          e.preventDefault();
          setButtonError(null);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signIn");
          void signIn("password", formData)
            .catch(() => {
              setButtonError("Not found");
              setTimeout(() => setButtonError(null), 3000);
            })
            .then(() => {
              router.push("/user");
            });
        }}
      >
        <div className="flex flex-col justify-between flex-1">
          <Label htmlFor="signin-email" className="font-medium">Email</Label>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            id="signin-email"
            className=" w-full"
            required
          />
          <Label htmlFor="signin-password" className="font-medium">Password</Label>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            id="signin-password"
            className=" w-full"
            required
          />
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={!email || !password}
          >
            {buttonError || "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
