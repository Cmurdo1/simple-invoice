import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/useClients';
import { Loader2, Plus, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error('Client name is required');
      return;
    }

    try {
      await createClient.mutateAsync({
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
        address: newClient.address || null,
      });
      setIsDialogOpen(false);
      setNewClient({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient.mutateAsync(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client contacts
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Add a new client to your contact list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Client name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClient} disabled={createClient.isPending}>
                  {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clients?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No clients yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add your first client to start invoicing
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients?.map((client) => (
                  <Card key={client.id} className="relative">
                    <CardContent className="pt-6">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{client.name}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{client.address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
