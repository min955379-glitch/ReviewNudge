import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReviewNudge",
    short_name: "ReviewNudge",
    description:
      "Send Google review requests in 10 seconds. Automatic reminders, click tracking, CAN-SPAM compliant.",
    start_url: "/app",
    display: "standalone",
    background_color: "hsl(0, 0%, 100%)",
    theme_color: "hsl(222, 47%, 11%)",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
