"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

export function SignUpForm() {
  const { signIn } = useAuthActions();
  const [buttonError, setButtonError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codeValidated, setCodeValidated] = useState(false);
  const router = useRouter();

  const codeEntry = useQuery(
    api.wnAdmin.query.by_code.byCode,
    code && code.trim() && !(email === "admin@white-node.com" && code === "admin@white-node.com") ? { code } : "skip"
  );
  const markCodeUsed = useMutation(api.wnAdmin.mutation.use.markUsed);

  const handleCodeValidation = async () => {
    setButtonError(null);

    // Special case for admin user
    if (email === "admin@white-node.com" && code === "admin@white-node.com") {
      try {
        await markCodeUsed({ code });
        setCodeValidated(true);
      } catch {
        setButtonError("Not found");
        setTimeout(() => setButtonError(null), 3000);
      }
      return;
    }

    // Regular code validation
    if (!codeEntry) {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
      return;
    }

    if (codeEntry.used) {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
      return;
    }

    try {
      await markCodeUsed({ code });
      setCodeValidated(true);
    } catch {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setButtonError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", "signUp");

    try {
      await signIn("password", formData);
      router.push("/user");
    } catch {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
    }
  };

  return (
    <div className="h-56 max-w-md flex flex-col justify-between">
      <form
        className="flex flex-col justify-between h-full w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!codeValidated) {
            await handleCodeValidation();
          } else {
            await handleSignUp(e);
          }
        }}
      >
        <div className="flex flex-col justify-between flex-1">
          <Label htmlFor="signup-email" className="text-base font-medium">Email</Label>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            id="signup-email"
            className="text-base w-full"
            required
            readOnly={codeValidated}
          />

          <Label htmlFor={codeValidated ? "signup-password" : "signup-code"} className="text-base font-medium">
            {codeValidated ? "Password" : "Code"}
          </Label>
          <Input
            type={codeValidated ? "password" : "text"}
            name={codeValidated ? "password" : "code"}
            value={codeValidated ? password : code}
            onChange={(e) => {
              if (codeValidated) {
                setPassword(e.target.value);
              } else {
                setCode(e.target.value);
              }
            }}
            placeholder={codeValidated ? "Password" : "Enter code"}
            id={codeValidated ? "signup-password" : "signup-code"}
            className="text-base w-full"
            required
          />

          {!codeValidated ? (
            <Button
              type="submit"
              className="w-full text-base font-medium"
              disabled={!code || !email}
            >
              {buttonError || "Validate Code"}
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full text-base font-medium"
              disabled={!password || !email}
            >
              Sign up
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
