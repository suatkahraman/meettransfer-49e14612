import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackHandlerProps {
  children: React.ReactNode;
}

/**
 * This component handles OAuth callback by detecting access_token in URL hash
 * and waiting for Supabase to process the session before rendering children.
 */
const OAuthCallbackHandler = ({ children }: OAuthCallbackHandlerProps) => {
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if this is an OAuth callback with access_token
    if (hash && hash.includes('access_token=')) {
      setIsProcessingOAuth(true);
      
      // Supabase client automatically handles the hash and sets the session
      // We just need to wait for it and then clean up the URL
      const handleOAuthCallback = async () => {
        try {
          // Wait for Supabase to process the hash and get the session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth callback error:', error);
          }
          
          // Clean up the URL by removing the hash
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
          
          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            setIsProcessingOAuth(false);
          }, 100);
        } catch (error) {
          console.error('OAuth processing error:', error);
          setIsProcessingOAuth(false);
        }
      };
      
      handleOAuthCallback();
    }
  }, []);

  // Show loading state while processing OAuth callback
  if (isProcessingOAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OAuthCallbackHandler;
