import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Save, Building2, Percent, Palette, Lock, Upload, X, Image as ImageIcon, FileText, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { subscription, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 0,
    brand_color: '#228B22',
    logo_url: '',
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
        logo_url: profile.logo_url || '',
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

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        business_name: formData.business_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_rate: formData.tax_rate,
        brand_color: subscription.subscribed ? formData.brand_color : null,
        logo_url: subscription.subscribed ? formData.logo_url || null : null,
      });
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
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Business Logo</Label>
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
              {!subscription.subscribed && (
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to add your logo to invoices and PDFs.
                </p>
              )}
            </div>

            {/* Brand Color */}
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
