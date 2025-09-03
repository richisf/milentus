import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('GitHub OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      error: error || 'none'
    });

    // Handle OAuth errors
    if (error) {
      const errorMessage = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        new URL(`/github/callback?error=${error}&error_message=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Check for missing code
    if (!code) {
      return NextResponse.redirect(
        new URL('/github/callback?error=missing_code&error_message=Missing authorization code', request.url)
      );
    }

    // Check for missing state
    if (!state) {
      return NextResponse.redirect(
        new URL('/github/callback?error=missing_state&error_message=Missing state parameter', request.url)
      );
    }

    // Redirect to callback page with code and state for processing
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = `${baseUrl}/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    console.log('Redirecting to:', redirectUrl);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/github/callback?error=server_error&error_message=Unexpected server error', request.url)
    );
  }
}
