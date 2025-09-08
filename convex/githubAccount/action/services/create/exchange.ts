export interface TokenExchangeResult {
  access_token: string;
  token_type: string;
  scope: string;
}
  
export async function codeForToken(code: string): Promise<TokenExchangeResult> {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for token');
  }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
  };
}