import type { NextConfig } from "next"

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https: https://*.google.com https://*.googleusercontent.com https://*.doubleclick.net;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://api.resend.com https://pagead2.googlesyndication.com https://*.google.com https://*.doubleclick.net ws: wss:;
  frame-src 'self' https://googleads.g.doubleclick.net https://*.google.com https://tpc.googlesyndication.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests
`.replace(/\s+/g, " ").trim()

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Content-Security-Policy", value: cspHeader },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      // Tracking link and unsubscribe endpoints must still be reachable when
      // clicked from an email client; some clients won't send a Referer, so
      // relax nothing here but make sure public asset headers still apply.
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ]
  },
}

export default nextConfig