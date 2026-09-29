import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function RequestsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests</CardTitle>
        <CardDescription>Track all your review requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">Coming in Phase 4</Badge>
      </CardContent>
    </Card>
  )
}
