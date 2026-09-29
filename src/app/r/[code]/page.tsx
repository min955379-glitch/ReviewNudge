import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2 } from "lucide-react"

export default function TrackingRedirectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <CardTitle>ReviewNudge</CardTitle>
          <CardDescription>Tracking link handling coming in Phase 5.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="secondary">Coming soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
