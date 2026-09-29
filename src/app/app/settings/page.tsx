import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Business profile, review link, and billing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">Coming in Phase 2 / 7</Badge>
      </CardContent>
    </Card>
  )
}
