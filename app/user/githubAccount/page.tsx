"use client";

import { useSearchParams } from "next/navigation";
import { Github } from "@/components/pages/user/githubAccount/component";

export default function Page() {
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('error_message');

  return (
    <Github
      code={code}
      state={state}
      error={error}
      errorMessage={errorMessage}
    />
  );
}