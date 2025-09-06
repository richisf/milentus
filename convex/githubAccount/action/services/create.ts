import { codeForToken } from "@/convex/githubAccount/action/services/create/exchange";
import { githubAccount } from "@/convex/githubAccount/action/services/create/fetch";

export interface GithubAccountCreationResult {
  token: string;
  userData: {
    login: string;
    id: number;
    name?: string;
    email?: string;
    avatar_url: string;
  };
}

export async function createGithubAccount(code: string): Promise<GithubAccountCreationResult> {
  const tokenData = await codeForToken(code);
  const userData = await githubAccount(tokenData.access_token);

  return {
    token: tokenData.access_token,
    userData,
  };
}
