"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-20">
      <Card className="w-full text-center">
        <CardContent className="space-y-4 p-10">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Something went wrong
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            We hit an unexpected error
          </h1>
          <p className="text-sm text-muted-foreground">
            Try reloading the page. If this keeps happening, please contact support.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
