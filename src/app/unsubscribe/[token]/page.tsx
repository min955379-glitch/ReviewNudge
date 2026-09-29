import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function UnsubscribePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>One-click unsubscribe coming in Phase 5.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Coming soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
