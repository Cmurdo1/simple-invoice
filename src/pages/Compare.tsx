import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, Upload, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

interface ComparisonResult {
  fairness_score: number;
  verdict: string;
  summary: string;
  line_items: Array<{
    description: string;
    quoted_price: number;
    fair_price: number;
    status: 'fair' | 'high' | 'low';
    note: string;
  }>;
  total_quoted: number;
  total_fair: number;
  savings_potential: number;
}

export default function Compare() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast.error('Please enter the estimate details');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-estimate', {
        body: { estimate_text: description },
        ...(user ? {} : {}),
      });

      if (error) throw error;
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to analyze estimate. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Fair Pricing';
    if (score >= 60) return 'Somewhat High';
    return 'Potentially Overpriced';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fair':
        return <Badge variant="outline" className="border-primary text-primary"><CheckCircle2 className="h-3 w-3 mr-1" /> Fair</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-destructive text-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> High</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Below Market</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead
        title="Free Estimate Checker | Honest Invoice"
        description="Check if your contractor's estimate is fair. AI-powered comparison against regional pricing data."
        canonicalUrl="/compare"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Honest Invoice" className="h-10 w-10" />
              <span className="text-xl font-bold">Honest Invoice</span>
            </Link>
            <div className="flex items-center gap-4">
              {!user && (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </>
              )}
              {user && (
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 mb-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Estimate Analysis</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Check If Your Estimate Is <span className="text-primary">Honest</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Paste your contractor's estimate below and we'll compare it against regional pricing data to see if you're being overcharged.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex gap-2">
                <Button
                  variant={inputMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('text')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Paste Text
                </Button>
                <Button
                  variant={inputMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
              <CardDescription>
                {inputMode === 'text'
                  ? 'Paste the job description, line items, and prices from your estimate'
                  : 'Upload a photo or PDF of your estimate (coming soon)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputMode === 'text' ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Example:\nRoof moss removal and treatment\n- Moss removal, main roof: $850\n- Moss removal, garage: $350\n- Zinc strip installation: $400\n- Gutter cleaning: $200\n- Disposal fees: $150\nTotal: $1,950`}
                  className="min-h-[200px] font-mono text-sm"
                />
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      File upload coming soon. Please use the text input for now.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !description.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Estimate...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Check This Estimate
                  </>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Free users get 10 comparisons/month.{' '}
                  <Link to="/signup" className="text-primary hover:underline">
                    Sign up for more
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Score Card */}
              <Card className="border-2" style={{
                borderColor: result.fairness_score >= 80 ? 'hsl(var(--primary))' : result.fairness_score >= 60 ? 'hsl(45, 93%, 47%)' : 'hsl(var(--destructive))'
              }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Fairness Score</p>
                  <p className={`text-6xl font-bold mb-2 ${getScoreColor(result.fairness_score)}`}>
                    {result.fairness_score}
                  </p>
                  <p className={`text-lg font-semibold mb-3 ${getScoreColor(result.fairness_score)}`}>
                    {getScoreLabel(result.fairness_score)}
                  </p>
                  <Progress value={result.fairness_score} className="h-3 mb-4" />
                  <p className="text-muted-foreground">{result.summary}</p>

                  {result.savings_potential > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium">
                        Potential savings: <span className="text-primary font-bold">${result.savings_potential.toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Line Item Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Line-by-Line Analysis</CardTitle>
                  <CardDescription>How each item compares to regional market rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.line_items.map((item, index) => (
                      <div key={index} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{item.description}</p>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.note}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-sm font-medium">Quoted: ${item.quoted_price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Fair: ${item.fair_price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between text-sm font-medium">
                    <span>Total Quoted: ${result.total_quoted.toFixed(2)}</span>
                    <span>Fair Estimate: ${result.total_fair.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              {!user && (
                <Card className="bg-primary/5 border-primary">
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold mb-2">Want to save this analysis?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a free account to save comparisons, get more checks per month, and access all features.
                    </p>
                    <Button asChild>
                      <Link to="/signup">Create Free Account</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
