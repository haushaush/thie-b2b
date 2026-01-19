import { Building2, User, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your company information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {user?.initials}
            </div>
            <div>
              <CardTitle>{user?.contactPerson}</CardTitle>
              <CardDescription>{user?.companyName}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Company Name
            </Label>
            <Input
              id="companyName"
              value={user?.companyName || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Contact Person
            </Label>
            <Input
              id="contactPerson"
              value={user?.contactPerson || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button variant="outline" className="flex-1" disabled>
              Edit Profile
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              Change Password
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Profile editing is disabled in the demo version
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
