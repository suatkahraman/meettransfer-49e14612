import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { ArrowLeft, Loader2, Building2, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

// Password format: 1 uppercase, 1 lowercase, at least 4 digits (e.g., Ab2215)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const agencySignupSchema = z.object({
  agencyName: z.string().trim().min(2, 'Agency name must be at least 2 characters').max(100),
  contactName: z.string().trim().min(2, 'Contact name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  email: z.string().trim().email('Invalid email address').max(255),
  password: passwordSchema,
  currency: z.enum(['EUR', 'USD', 'TRY', 'GBP']),
  city: z.string().trim().min(1, 'City is required'),
  comments: z.string().max(500).optional(),
});

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR - Euro' },
  { value: 'USD', label: '$ USD - US Dollar' },
  { value: 'TRY', label: '₺ TRY - Turkish Lira' },
  { value: 'GBP', label: '£ GBP - British Pound' },
];

const CITIES = [
  { value: 'istanbul', labelTR: 'İstanbul', labelEN: 'Istanbul' },
  { value: 'antalya', labelTR: 'Antalya', labelEN: 'Antalya' },
  { value: 'bodrum', labelTR: 'Bodrum', labelEN: 'Bodrum' },
  { value: 'dalaman', labelTR: 'Dalaman', labelEN: 'Dalaman' },
  { value: 'izmir', labelTR: 'İzmir', labelEN: 'Izmir' },
  { value: 'ankara', labelTR: 'Ankara', labelEN: 'Ankara' },
  { value: 'cappadocia', labelTR: 'Kapadokya', labelEN: 'Cappadocia' },
  { value: 'fethiye', labelTR: 'Fethiye', labelEN: 'Fethiye' },
  { value: 'marmaris', labelTR: 'Marmaris', labelEN: 'Marmaris' },
  { value: 'other', labelTR: 'Diğer', labelEN: 'Other' },
];

const AgencySignupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState('EUR');
  const [city, setCity] = useState('');
  const [copied, setCopied] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareUrl = window.location.origin + '/signup/agency';
    const shareText = t('agencySignupShareText');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meet Transfer - Agency Registration',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink(shareUrl);
        }
      }
    } else {
      handleCopyLink(shareUrl);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  // Role-based redirect if already logged in
  useEffect(() => {
    if (user && !roleLoading && role) {
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'driver':
          navigate('/driver', { replace: true });
          break;
        case 'agency':
          navigate('/agency', { replace: true });
          break;
        default:
          navigate('/customer', { replace: true });
      }
    }
  }, [user, role, roleLoading, navigate]);

  // If already logged in, show loading
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const agencyName = formData.get('agencyName') as string;
    const contactName = formData.get('contactName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const comments = formData.get('comments') as string;

    try {
      const validation = agencySignupSchema.parse({ 
        agencyName: agencyName.trim(), 
        contactName: contactName.trim(),
        phone: phone.trim(), 
        email: email.trim(), 
        password,
        currency,
        city,
        comments: comments?.trim() || '',
      });

      // Create agency application - admin will need to approve
      const { error: insertError } = await supabase
        .from('agency_applications' as any)
        .insert({
          agency_name: validation.agencyName,
          contact_name: validation.contactName,
          email: validation.email,
          phone: validation.phone,
          currency: validation.currency,
          city: validation.city,
          comments: validation.comments || null,
          password_hash: validation.password,
          status: 'pending',
        } as any);

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('already exists')) {
          toast.error(t('emailAlreadyRegistered'));
        } else {
          console.error('Agency application error:', insertError);
          toast.error(t('loginFailed'));
        }
        return;
      }

      // Notify admin about new agency application
      try {
        await supabase.functions.invoke('notify-admin-agency-application', {
          body: {
            agency_name: validation.agencyName,
            contact_name: validation.contactName,
            email: validation.email,
            phone: validation.phone,
            currency: validation.currency,
            city: validation.city,
            comments: validation.comments || null,
          }
        });
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
      }

      toast.success(t('applicationSubmitted'));
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(t('loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t('back')}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-9 w-9"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">{t('agencyRegistration')}</CardTitle>
            <CardDescription>{t('partnerWithMeetTransfer')}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">{t('agencyName')} *</Label>
                <Input 
                  id="agencyName" 
                  name="agencyName" 
                  type="text" 
                  placeholder="Your Travel Agency" 
                  required 
                  className="h-12"
                />
                {errors.agencyName && <p className="text-sm text-destructive">{errors.agencyName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">{t('contactPerson')} *</Label>
                <Input 
                  id="contactName" 
                  name="contactName" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  className="h-12"
                  autoComplete="name"
                />
                {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')} *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="+90 5XX XXX XXXX" 
                  required 
                  className="h-12"
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')} *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="agency@email.com" 
                  required 
                  className="h-12"
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t('city')} *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t('selectCity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {language === 'TR' ? c.labelTR : c.labelEN}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('preferredCurrencyLabel')} *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')} *</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Ab2215" 
                  required 
                  className="h-12"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  {t('passwordFormat')}
                </p>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">{t('additionalInfo')}</Label>
                <Textarea 
                  id="comments" 
                  name="comments" 
                  placeholder={t('additionalInfoPlaceholder')}
                  className="min-h-[80px]"
                />
                {errors.comments && <p className="text-sm text-destructive">{errors.comments}</p>}
              </div>

              {/* KVKK Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="kvkk"
                  name="kvkk"
                  required
                  className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <Label htmlFor="kvkk" className="text-sm text-muted-foreground leading-tight">
                  <Link to="/privacy" target="_blank" className="text-accent hover:underline">
                    {t('kvkkLink')}
                  </Link>
                  {" "}{t('kvkkText').replace(t('kvkkLink'), '').replace("I have read and accept the ", "").replace(". ", " ")}
                </Label>
              </div>
              {errors.kvkk && <p className="text-sm text-destructive">{errors.kvkk}</p>}
              
              <Button 
                type="submit" 
                variant="accent"
                className="w-full h-12 rounded-xl text-base font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('submittingApplication')}
                  </>
                ) : (
                  t('submitApplication')
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center text-sm text-muted-foreground">
              {t('alreadyHaveAccount')}
            </div>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                {t('login')}
              </Button>
            </Link>
            <div className="text-center text-sm text-muted-foreground">
              {t('notAnAgency')}{' '}
              <Link to="/signup" className="text-accent hover:underline">
                {t('customerSignUp')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AgencySignupScreen;