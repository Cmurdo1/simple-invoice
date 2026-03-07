import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useGeolocation, getColMultiplierLabel } from '@/hooks/useGeolocation';
import { Loader2, Save, Building2, Percent, Palette, Lock, Upload, X, Image as ImageIcon, FileText, ExternalLink, Trash2, AlertTriangle, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const COLOR_THEMES = [
  { name: 'Classic', invoice: '#228B22', estimate: '#4169E1', description: 'Traditional business' },
  { name: 'Midnight', invoice: '#36454F', estimate: '#008080', description: 'Sleek & modern' },
  { name: 'Patriotic', invoice: '#B22234', estimate: '#3C3B6E', description: 'American style' },
  { name: 'Royal Gold', invoice: '#8B4513', estimate: '#D4AF37', description: 'Luxury feel' },
  { name: 'Sunset', invoice: '#FF8C00', estimate: '#DC143C', description: 'Warm & energetic' },
  { name: 'Ocean', invoice: '#0369a1', estimate: '#059669', description: 'Cool & calm' },
];

export type InvoiceTemplate = 'classic' | 'modern' | 'minimal' | 'bold';

const INVOICE_TEMPLATES: { id: InvoiceTemplate; name: string; description: string; preview: string }[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with colored header banner',
    preview: 'classic',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sidebar accent with gradient header',
    preview: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with a single accent line',
    preview: 'minimal',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Dark full-width header, high contrast',
    preview: 'bold',
  },
];

const NERVE_CENTER_EMAIL = 'murdochcpm_08@yahoo.com';

export default function Settings() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { user, subscription, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { location: detectedLocation, isLoading: isDetectingLocation, lookupZipCode } = useGeolocation();

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 0,
    brand_color: '#228B22',
    estimate_color: '#2563eb',
    logo_url: '',
    city: '',
    state: '',
    zip_code: '',
    col_multiplier: 1.0,
    invoice_template: 'classic' as InvoiceTemplate,
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        tax_rate: profile.tax_rate || 0,
        brand_color: profile.brand_color || '#228B22',
        estimate_color: (profile as any).estimate_color || '#2563eb',
        logo_url: profile.logo_url || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        zip_code: (profile as any).zip_code || '',
        col_multiplier: (profile as any).col_multiplier || 1.0,
        invoice_template: ((profile as any).invoice_template || 'classic') as InvoiceTemplate,
      });
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
  };

  const handleLookupZip = async () => {
    const loc = await lookupZipCode(formData.zip_code);
    if (loc) {
      setFormData(prev => ({
        ...prev,
        city: loc.city || '',
        state: loc.state || '',
        zip_code: loc.zipCode || prev.zip_code,
        col_multiplier: loc.colMultiplier || 1.0,
      }));
      toast.success(`Location found: ${loc.city}, ${loc.state}`);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        business_name: formData.business_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_rate: formData.tax_rate,
        brand_color: subscription.subscribed ? formData.brand_color : null,
        estimate_color: subscription.subscribed ? formData.estimate_color : null,
        logo_url: subscription.subscribed ? formData.logo_url || null : null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        col_multiplier: formData.col_multiplier,
        invoice_template: subscription.subscribed ? formData.invoice_template : 'classic',
      } as any);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in again to delete your account');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Account deleted successfully');
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmText('');
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
              Document Branding
              {!subscription.subscribed && (
                <Badge variant="outline" className="ml-2 gap-1">
                  <Lock className="h-3 w-3" />
                  Pro
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Create a premium, professional look with fully customizable colors for your invoices and estimates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Design Templates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Invoice Design Template</Label>
                {!subscription.subscribed && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Pro
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Choose the layout style for your exported PDF invoices & estimates
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INVOICE_TEMPLATES.map((tmpl) => {
                  const isSelected = formData.invoice_template === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      disabled={!subscription.subscribed}
                      onClick={() => setFormData({ ...formData, invoice_template: tmpl.id })}
                      className={`
                        relative flex flex-col gap-2 rounded-lg border-2 p-3 text-left transition-all duration-200 overflow-hidden
                        ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                        ${!subscription.subscribed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {/* Mini PDF preview */}
                      <div className="w-full rounded overflow-hidden bg-white shadow-sm border border-black/10 aspect-[3/2] relative">
                        {tmpl.id === 'classic' && (
                          <>
                            <div className="h-1/3 w-full" style={{ backgroundColor: formData.brand_color }} />
                            <div className="absolute top-1 left-2 text-white font-bold" style={{ fontSize: 5 }}>ACME Co.</div>
                            <div className="absolute top-1 right-2 text-white font-bold" style={{ fontSize: 5 }}>INVOICE</div>
                            <div className="p-1.5 space-y-0.5">
                              <div className="h-0.5 w-3/4 bg-gray-200 rounded" />
                              <div className="h-0.5 w-1/2 bg-gray-200 rounded" />
                              <div className="h-0.5 w-5/6 bg-gray-100 rounded" />
                            </div>
                          </>
                        )}
                        {tmpl.id === 'modern' && (
                          <>
                            <div className="absolute left-0 top-0 bottom-0 w-1/4" style={{ background: `linear-gradient(to bottom, ${formData.brand_color}, ${formData.brand_color}88)` }} />
                            <div className="absolute left-1 top-1 text-white" style={{ fontSize: 4, fontWeight: 700 }}>ACME</div>
                            <div className="ml-6 p-1 space-y-0.5 mt-1">
                              <div className="h-0.5 w-full bg-gray-200 rounded" />
                              <div className="h-0.5 w-3/4 bg-gray-200 rounded" />
                              <div className="h-0.5 w-5/6 bg-gray-100 rounded" />
                            </div>
                          </>
                        )}
                        {tmpl.id === 'minimal' && (
                          <>
                            <div className="h-1 w-full" style={{ backgroundColor: formData.brand_color }} />
                            <div className="p-1.5 space-y-0.5">
                              <div className="flex justify-between">
                                <span style={{ fontSize: 4, fontWeight: 700, color: '#111' }}>ACME Co.</span>
                                <span style={{ fontSize: 4, color: formData.brand_color, fontWeight: 700 }}>INVOICE</span>
                              </div>
                              <div className="h-0.5 w-full bg-gray-200 rounded" />
                              <div className="h-0.5 w-3/4 bg-gray-100 rounded" />
                            </div>
                          </>
                        )}
                        {tmpl.id === 'bold' && (
                          <>
                            <div className="h-2/5 w-full bg-gray-900 flex items-center px-2 justify-between">
                              <span style={{ fontSize: 4, color: 'white', fontWeight: 700 }}>ACME Co.</span>
                              <span style={{ fontSize: 4, color: formData.brand_color, fontWeight: 700 }}>INVOICE</span>
                            </div>
                            <div className="p-1.5 space-y-0.5">
                              <div className="h-0.5 w-3/4 bg-gray-200 rounded" />
                              <div className="h-0.5 w-1/2 bg-gray-100 rounded" />
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{tmpl.name}</span>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{tmpl.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Themes Quick-Pick */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Color Themes</Label>
              <p className="text-sm text-muted-foreground">Quick-apply a coordinated color palette</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    disabled={!subscription.subscribed}
                    onClick={() => setFormData({ ...formData, brand_color: theme.invoice, estimate_color: theme.estimate })}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
                      ${!subscription.subscribed ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-muted/50 cursor-pointer'}`}
                  >
                    <div className="flex gap-0.5">
                      <div className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: theme.invoice }} />
                      <div className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: theme.estimate }} />
                    </div>
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Business Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={formData.logo_url}
                      alt="Business logo"
                      className="h-full w-full object-contain"
                    />
                    {subscription.subscribed && (
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={!subscription.subscribed}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!subscription.subscribed || isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Invoice Color */}
            <div className="space-y-3 rounded-lg border p-4" style={{ borderColor: formData.brand_color + '40' }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full shadow-inner"
                  style={{ backgroundColor: formData.brand_color }}
                />
                <Label className="text-base font-semibold">Invoice Accent Color</Label>
              </div>
              <p className="text-sm text-muted-foreground">Used for headers, table banners, and totals on invoices</p>
              <ColorPicker
                value={formData.brand_color}
                onChange={(hex) => setFormData({ ...formData, brand_color: hex })}
                disabled={!subscription.subscribed}
                label="Invoice"
              />
            </div>

            {/* Estimate Color */}
            <div className="space-y-3 rounded-lg border p-4" style={{ borderColor: formData.estimate_color + '40' }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full shadow-inner ring-2 ring-offset-2 ring-offset-background"
                  style={{ backgroundColor: formData.estimate_color, ringColor: formData.estimate_color }}
                />
                <Label className="text-base font-semibold">Estimate Accent Color</Label>
              </div>
              <p className="text-sm text-muted-foreground">Used for headers, table banners, and totals on estimates</p>
              <ColorPicker
                value={formData.estimate_color}
                onChange={(hex) => setFormData({ ...formData, estimate_color: hex })}
                disabled={!subscription.subscribed}
                label="Estimate"
              />
            </div>

            {!subscription.subscribed && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Unlock Premium Branding</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to Pro to choose invoice templates, customize colors, and upload your logo.
                </p>
              </div>
            )}

            {/* Live Preview */}
            {subscription.subscribed && (
              <div className="space-y-3 pt-2">
                <Label className="text-base font-semibold">Live Preview</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border overflow-hidden">
                    <div
                      className="p-3 text-white text-center text-sm font-semibold"
                      style={{ backgroundColor: formData.brand_color }}
                    >
                      Invoice Preview
                    </div>
                    <div className="p-3 bg-card text-xs text-muted-foreground">
                      <p>INV-00001</p>
                      <p className="font-bold text-foreground mt-1">$1,250.00</p>
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <div
                      className="p-3 text-white text-center text-sm font-semibold"
                      style={{ backgroundColor: formData.estimate_color }}
                    >
                      Estimate Preview
                    </div>
                    <div className="p-3 bg-card text-xs text-muted-foreground">
                      <p>EST-00001</p>
                      <p className="font-bold text-foreground mt-1">$1,250.00</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Regional Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location & Regional Pricing
            </CardTitle>
            <CardDescription>
              Set your location using Zip Code for accurate regional pricing in your estimates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  placeholder="94102"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupZip()}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleLookupZip}
                disabled={isDetectingLocation || !formData.zip_code}
                className="gap-2"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Lookup
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="col_multiplier">Cost of Living Multiplier</Label>
                <Badge variant="secondary">
                  {getColMultiplierLabel(formData.col_multiplier)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  id="col_multiplier"
                  type="number"
                  min="0.5"
                  max="2.5"
                  step="0.01"
                  value={formData.col_multiplier}
                  onChange={(e) => setFormData({ ...formData, col_multiplier: parseFloat(e.target.value) || 1.0 })}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, col_multiplier: 1.0 })}
                >
                  Reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Multiplier applied to estimates (1.0 = national average). Higher values = higher prices.
              </p>
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

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Legal
            </CardTitle>
            <CardDescription>
              Privacy policy and terms of service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              to="/privacy" 
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">Privacy Policy</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/terms" 
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">Terms of Service</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data including:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>All invoices and invoice items</li>
                      <li>All client information</li>
                      <li>Your business profile</li>
                      <li>Any active subscription</li>
                    </ul>
                    <div className="pt-2">
                      <Label htmlFor="confirm-delete" className="text-foreground">
                        Type <span className="font-bold">DELETE</span> to confirm:
                      </Label>
                      <Input
                        id="confirm-delete"
                        className="mt-2"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="DELETE"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Nerve Center - Only visible to authorized user */}
        {user?.email === NERVE_CENTER_EMAIL && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                The Nerve Center
              </CardTitle>
              <CardDescription>
                Automations, signals, and AI task orchestration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/nerve-center">
                <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                  <BrainCircuit className="h-4 w-4" />
                  Enter The Nerve Center
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

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
