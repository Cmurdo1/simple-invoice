import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useCreateInvoice, useAddInvoiceItems, useRecalculateInvoiceTotals } from '@/hooks/useInvoices';
import { useProfile } from '@/hooks/useProfile';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Loader2, Wand2, Sparkles, ArrowRight, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { ExtractedLineItem } from '@/types/database';
import { cn } from '@/lib/utils';

export default function MagicCreate() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: profile } = useProfile();
  const createInvoice = useCreateInvoice();
  const addInvoiceItems = useAddInvoiceItems();
  const recalculateTotals = useRecalculateInvoiceTotals();

  const [jobDescription, setJobDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedLineItem[] | null>(null);
  const [creating, setCreating] = useState(false);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setJobDescription((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + transcript;
      });
    },
    onError: (error) => {
      if (error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      } else {
        toast.error('Speech recognition error. Please try again.');
      }
    },
  });

  const handleExtract = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setExtracting(true);
    setExtractedItems(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-line-items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ job_description: jobDescription }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to extract line items');
      }

      const data = await response.json();
      setExtractedItems(data.items);
      toast.success(`Extracted ${data.items.length} line items`);
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract items. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!extractedItems || extractedItems.length === 0) {
      toast.error('Please extract line items first');
      return;
    }

    setCreating(true);

    try {
      // Create the invoice
      const invoice = await createInvoice.mutateAsync({
        client_id: selectedClientId || null,
        job_description: jobDescription,
      });

      // Add the extracted items
      await addInvoiceItems.mutateAsync({
        invoice_id: invoice.id,
        items: extractedItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          sort_order: index,
        })),
      });

      // Recalculate totals
      await recalculateTotals.mutateAsync({
        invoice_id: invoice.id,
        tax_rate: profile?.tax_rate || 0,
      });

      toast.success('Invoice created!');
      navigate(`/invoice/${invoice.id}`);
    } catch (error) {
      console.error('Create invoice error:', error);
      toast.error('Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const estimatedTotal = extractedItems?.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  ) || 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Magic Create</h1>
          <p className="text-muted-foreground">
            Describe the job and let AI extract the line items for you
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Job Description
            </CardTitle>
            <CardDescription>
              Describe the work you did in plain language. Include materials, labor, quantities, and any other details.
              {isSupported && ' You can also use voice input by clicking the microphone button.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (optional)</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Job Description</Label>
                {isSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleListening}
                    className={cn(
                      "gap-2 transition-all",
                      isListening && "animate-pulse"
                    )}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Example: Replaced 2 toilets ($150 each), fixed leaky kitchen faucet, snaked main drain line. Labor: 4 hours at $85/hour."
                  className={cn(
                    "min-h-[150px] resize-none transition-all",
                    isListening && "border-destructive ring-2 ring-destructive/20"
                  )}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                {isListening && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-sm text-destructive">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive"></span>
                    </span>
                    Listening...
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleExtract}
              disabled={extracting || !jobDescription.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Auto-Extract Details
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {extractedItems && extractedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Extracted Line Items</CardTitle>
              <CardDescription>
                Review and adjust the extracted items before creating the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Description</th>
                      <th className="p-3 text-right text-sm font-medium">Qty</th>
                      <th className="p-3 text-right text-sm font-medium">Price</th>
                      <th className="p-3 text-right text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedItems.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-right text-sm">{item.quantity}</td>
                        <td className="p-3 text-right text-sm">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td colSpan={3} className="p-3 text-right font-medium">
                        Subtotal
                      </td>
                      <td className="p-3 text-right font-bold">
                        ${estimatedTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Button
                onClick={handleCreateInvoice}
                disabled={creating}
                className="w-full gap-2"
                size="lg"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    Create Invoice
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
