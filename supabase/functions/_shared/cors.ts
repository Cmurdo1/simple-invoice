export const corsHeaders = {
  'Access-Control-Allow-Origin': 
    Deno.env.get('NODE_ENV') === 'development'
      ? '*' // Allow all origins in development
      : 'https://honestinvoice.com', // Restrict to your domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
