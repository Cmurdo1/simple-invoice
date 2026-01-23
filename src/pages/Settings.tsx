import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Loader2, Save, Building2, Percent } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 0,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        tax_rate: profile.tax_rate || 0,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        business_name: formData.business_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_rate: formData.tax_rate,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your business profile and preferences
          </p>
        </div>

        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Business Profile
            </CardTitle>
            <CardDescription>
              This information will appear on your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                placeholder="Your Business Name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Tax Settings
            </CardTitle>
            <CardDescription>
              Set your default tax rate for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                This rate will be applied to new invoices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your HonestInvoice subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock unlimited invoices and premium features
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            size="lg" 
            onClick={handleSave} 
            disabled={updateProfile.isPending}
            className="gap-2"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
