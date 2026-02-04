import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { startOAuthSignIn } from '@/lib/oauthSignIn';

/**
 * OAuth Start Page - Bridge for iOS PWA standalone mode
 * 
 * Opens in a new Safari window and initiates OAuth flow using Lovable managed OAuth.
 * This bypasses the 404 issue that occurs when redirecting within the PWA.
 */
const OAuthStart = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const provider = searchParams.get('provider') as 'google' | 'apple' | null;
  
  useEffect(() => {
    const startOAuth = async () => {
      if (!provider || (provider !== 'google' && provider !== 'apple')) {
        setError('Invalid provider');
        return;
      }

      try {
        const { error: oauthError } = await startOAuthSignIn(provider);

        if (oauthError) {
          console.error('OAuth start error:', oauthError);
          setError(oauthError.message || 'OAuth failed');
        }
        // If no error, the page will redirect to the provider
      } catch (err: any) {
        console.error('OAuth start exception:', err);
        setError(err?.message || 'Failed to start OAuth');
      }
    };

    startOAuth();
  }, [provider]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="text-primary underline"
          >
            Close this window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          {provider === 'apple' ? 'Apple' : 'Google'} ile giriş yapılıyor...
        </p>
      </div>
    </div>
  );
};

export default OAuthStart;
