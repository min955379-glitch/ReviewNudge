"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface AdBannerProps {
  slot?: string
  format?: "auto" | "fluid" | "rectangle" | "horizontal"
  responsive?: boolean
  className?: string
}

export function AdBanner({
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: AdBannerProps) {
  const isLoaded = useRef(false)

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !isLoaded.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
        isLoaded.current = true
      }
    } catch (err) {
      console.warn("Google AdSense could not load:", err)
    }
  }, [])

  const containerClasses = "overflow-hidden text-center my-6 " + (className || "")

  return (
    <div className={containerClasses}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7325835183643107"
        data-ad-slot={slot || ""}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  )
}