import { useState } from "react";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Camera, Save } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("demo@example.com");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <Navigation>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account information and preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Picture */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary/60" />
                  </div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company (Optional)</label>
                    <Input placeholder="Enter your company name" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Bio (Optional)</label>
                    <Input placeholder="Tell us about yourself" />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Currency</label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Timezone</label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC+0 (UTC)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Invoice reminders</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment notifications</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Navigation>
  );
}