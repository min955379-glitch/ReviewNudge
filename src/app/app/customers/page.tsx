import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CustomersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>Add and manage your customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">Coming in Phase 3</Badge>
      </CardContent>
    </Card>
  )
}
