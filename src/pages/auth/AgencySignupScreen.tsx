import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
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
  comments: z.string().max(500).optional(),
});

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR - Euro' },
  { value: 'USD', label: '$ USD - US Dollar' },
  { value: 'TRY', label: '₺ TRY - Turkish Lira' },
  { value: 'GBP', label: '£ GBP - British Pound' },
];

const AgencySignupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState('EUR');
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

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
        comments: comments?.trim() || '',
      });

      // Create agency application - admin will need to approve
      // Use rpc or direct insert since table may not be in generated types yet
      const { error: insertError } = await supabase
        .from('agency_applications' as any)
        .insert({
          agency_name: validation.agencyName,
          contact_name: validation.contactName,
          email: validation.email,
          phone: validation.phone,
          currency: validation.currency,
          comments: validation.comments || null,
          password_hash: validation.password, // Will be used when approved
          status: 'pending',
        } as any);

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('already exists')) {
          toast.error('This email is already registered. Please contact us or try logging in.');
        } else {
          console.error('Agency application error:', insertError);
          toast.error('Failed to submit application. Please try again.');
        }
        return;
      }

      toast.success('Agency application submitted! We will review and contact you shortly.');
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
        toast.error('An error occurred during sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">Agency Registration</CardTitle>
            <CardDescription>Partner with Meet Transfer for premium transfers</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name *</Label>
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
                <Label htmlFor="contactName">Contact Person *</Label>
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
                <Label htmlFor="phone">Phone *</Label>
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
                <Label htmlFor="email">Email *</Label>
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
                <Label htmlFor="currency">Preferred Currency *</Label>
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
                <Label htmlFor="password">Password *</Label>
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
                  1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)
                </p>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Ek Bilgiler</Label>
                <Textarea 
                  id="comments" 
                  name="comments" 
                  placeholder="Acentanız hakkında bilgi, aylık beklenen transfer sayısı vb."
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
                    KVKK Aydınlatma Metni
                  </Link>
                  'ni okudum ve kabul ediyorum. Kişisel verilerimin işlenmesine onay veriyorum.
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
                    Gönderiliyor...
                  </>
                ) : (
                  'Başvuru Gönder'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?
            </div>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                Log In
              </Button>
            </Link>
            <div className="text-center text-sm text-muted-foreground">
              Not an agency?{' '}
              <Link to="/signup" className="text-accent hover:underline">
                Customer Sign Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AgencySignupScreen;
