import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isGithubOAuthPage = createRouteMatcher(["/user/githubAccount"]);
const isProtectedRoute = createRouteMatcher(["/server"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {

  if (request.nextUrl.pathname.startsWith('/user/githubAccount')) {
    return;
  }

  if (isGithubOAuthPage(request)) {
    return; 
  }

  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  matcher: ["/((?!.*\\.|_next|user/github).+)", "/(api|trpc)(.*)"],
};
