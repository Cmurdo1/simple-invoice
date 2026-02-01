import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const token = searchParams.get('token');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoiceId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invalid Feedback Link</h2>
              <p className="text-muted-foreground">
                This feedback link is invalid or has expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('submit-feedback', {
        body: {
          invoice_id: invoiceId,
          token,
          rating,
          comment: comment.trim() || null,
          client_name: clientName.trim() || null,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">Thank You!</h2>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Rate Your Experience</CardTitle>
          <CardDescription>
            How was your experience with this invoice?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Your Name (optional)</Label>
            <Input
              id="clientName"
              placeholder="John Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comments (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts about the service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Powered by <span className="font-medium">HonestInvoice</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}