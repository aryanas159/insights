import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { pathToRegexp } from "path-to-regexp";
import { getAllFeatureFlags } from "lib/utils/server/feature-flags";

// HACK: this is to get around the fact that the normal next.js middleware is not always functioning
// correctly.
// see https://github.com/open-sauced/insights/pull/1549
// prettier-ignore
const pathsToMatch = [
  "/",
  "/hub/:path*",
  "/feed/",
  "/user/notifications",
  "/user/settings",
  "/account-deleted",
  "/workspaces/:path*",
];

const NO_ONBOARDING_PAYLOAD = {
  is_onboarded: false,
};

const loadSession = async (request: NextRequest, sessionToken?: string) => {
  if (!sessionToken) {
    return NO_ONBOARDING_PAYLOAD;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    return NO_ONBOARDING_PAYLOAD;
  }
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (
    !pathsToMatch.some((matcher) => pathToRegexp(matcher).test(req.nextUrl.pathname)) ||
    // if the path is hub/insights or hub/lists go to the page so logged out users can see demo insights or demo lists
    req.nextUrl.pathname === "/hub/insights" ||
    req.nextUrl.pathname === "/hub/lists"
  ) {
    return res;
  }

  // Create authenticated Supabase Client.
  const supabase = createMiddlewareClient({ req, res });
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user && req.nextUrl.pathname === "/account-deleted") {
    // Delete the account from Supabase and log the user out.
    await supabase.auth.admin.deleteUser(session.user.id);
    await supabase.auth.signOut();

    return res;
  }

  // TODO: remove this once we've rolled this out to everyone.
  // For now, only allowed users with the workspaces feature flag can access the workspaces pages.
  if (session?.user && req.nextUrl.pathname.startsWith("/workspaces")) {
    const featureFlags = await getAllFeatureFlags(Number(session?.user.user_metadata.sub));

    if (featureFlags.workspaces) {
      return res;
    } else {
      return NextResponse.rewrite(new URL("/404", req.url));
    }
  }

  // Check auth condition
  if (session?.user || req.nextUrl.searchParams.has("login")) {
    // Authentication successful, forward request to protected route.
    if (req.nextUrl.pathname === "/") {
      const data = await loadSession(req, session?.access_token);

      if (data.is_onboarded) {
        return NextResponse.redirect(new URL("/hub/insights", req.url));
      } else {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
    } else {
      return res;
    }
  }

  // Auth condition not met, redirect to home page.
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/feed";
  if (req.nextUrl.pathname === "/feed" && req.nextUrl.searchParams.has("new")) {
    redirectUrl.searchParams.set("signIn", "true");
  }
  redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);

  if (!req.nextUrl.searchParams.has("redirectedFrom")) {
    return NextResponse.redirect(redirectUrl);
  }
}
