import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const needsUser = path.startsWith("/account") || path.startsWith("/orders") || path.startsWith("/checkout");
  const isAdmin = path.startsWith("/admin") && !path.startsWith("/admin/login");
  if ((needsUser || isAdmin) && !data.user) {
    const to = request.nextUrl.clone();
    to.pathname = isAdmin ? "/admin/login" : "/login";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|models|images|api/payments/webhook).*)"],
};
