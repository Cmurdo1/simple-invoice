import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Loader2, Save, Building2, Percent, Palette, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const BRAND_COLORS = [
  { name: 'Forest Green', value: '#228B22' },
  { name: 'Royal Blue', value: '#4169E1' },
  { name: 'Crimson', value: '#DC143C' },
  { name: 'Dark Orange', value: '#FF8C00' },
  { name: 'Purple', value: '#9932CC' },
  { name: 'Teal', value: '#008080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Charcoal', value: '#36454F' },
];

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const { subscription } = useAuth();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 0,
    brand_color: '#228B22',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        tax_rate: profile.tax_rate || 0,
        brand_color: profile.brand_color || '#228B22',
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
        brand_color: subscription.subscribed ? formData.brand_color : null,
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

        {/* Custom Branding - Pro Feature */}
        <Card className={!subscription.subscribed ? 'opacity-75' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Custom Branding
              {!subscription.subscribed && (
                <Badge variant="outline" className="ml-2 gap-1">
                  <Lock className="h-3 w-3" />
                  Pro
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Customize your invoice appearance with your brand colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Brand Color</Label>
              <div className="grid grid-cols-4 gap-3">
                {BRAND_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    disabled={!subscription.subscribed}
                    onClick={() => setFormData({ ...formData, brand_color: color.value })}
                    className={`
                      relative h-12 rounded-lg border-2 transition-all duration-200
                      ${formData.brand_color === color.value 
                        ? 'border-foreground ring-2 ring-foreground ring-offset-2' 
                        : 'border-transparent hover:border-muted-foreground/50'}
                      ${!subscription.subscribed ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {formData.brand_color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-white shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {!subscription.subscribed && (
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to customize your brand colors on invoices and emails.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom_color">Or enter a custom color</Label>
              <div className="flex gap-2">
                <Input
                  id="custom_color"
                  type="color"
                  disabled={!subscription.subscribed}
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  placeholder="#228B22"
                  disabled={!subscription.subscribed}
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="flex-1"
                />
              </div>
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
        <SubscriptionCard />

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
