import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://reviewnudge.app").replace(/\/$/, "")
  const lastModified = new Date()
  const routes = ["", "/pricing", "/privacy", "/terms", "/signup", "/login"]
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified,
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : 0.7,
  }))
}
