import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TemplatesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email templates</CardTitle>
        <CardDescription>Customize request and reminder emails.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">Coming in Phase 4</Badge>
      </CardContent>
    </Card>
  )
}
