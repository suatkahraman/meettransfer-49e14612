import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Building2, Loader2, Share2, Copy } from 'lucide-react';
import { CURRENCY_OPTIONS, CURRENCY_CODES } from '@/lib/currency';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const agencySignupSchema = z.object({
  agencyName: z.string().trim().min(2, 'Agency name must be at least 2 characters').max(200),
  contactName: z.string().trim().min(2, 'Contact name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  email: z.string().trim().email('Invalid email address').max(255),
  password: passwordSchema,
  currency: z.enum(CURRENCY_CODES),
  city: z.string().trim().min(1, 'City is required'),
  comments: z.string().max(500).optional(),
});

// City is now a free text input instead of dropdown

export default function AgencySignupScreen() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  const [formData, setFormData] = useState({
    agencyName: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    currency: 'EUR',
    city: '',
    comments: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOTE: Hooks must be declared unconditionally.
  // These callbacks were previously declared after an early return,
  // which caused "Rendered more hooks than during the previous render" crashes.
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Join Meet Transfer as an Agency Partner',
      text: 'Register your travel agency and start earning with Meet Transfer!',
      url: shareUrl,
    };

    try {
      // Some browsers support navigator.share but not navigator.canShare.
      // Guard against calling an undefined function.
      const canShare = typeof (navigator as any).canShare === 'function'
        ? (navigator as any).canShare(shareData)
        : false;

      if (typeof navigator.share === 'function' && canShare) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed', error);
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && !roleLoading && user && role) {
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'agency':
          navigate('/agency');
          break;
        case 'customer':
          navigate('/customer');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  // Show loading while checking auth status
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = agencySignupSchema.parse(formData);

      // Hash the password before storing (simple hash for demo - in production use bcrypt on server)
      const passwordHash = btoa(validatedData.password);

      // Insert application into database
      const { error: insertError } = await supabase
        .from('agency_applications')
        .insert({
          agency_name: validatedData.agencyName,
          contact_name: validatedData.contactName,
          phone: validatedData.phone,
          email: validatedData.email,
          password_hash: passwordHash,
          currency: validatedData.currency,
          city: validatedData.city,
          comments: validatedData.comments || null,
          status: 'pending',
        });

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          toast.error('An application with this email already exists');
        } else {
          throw insertError;
        }
        return;
      }

      // Notify admins about new application
      try {
        await supabase.functions.invoke('notify-agency-application', {
          body: {
            agencyName: validatedData.agencyName,
            contactName: validatedData.contactName,
            email: validatedData.email,
            phone: validatedData.phone,
          },
        });
      } catch (notifyError) {
        console.error('Failed to notify admins:', notifyError);
        // Don't fail the application if notification fails
      }

      toast.success('Application submitted successfully! We will review and contact you soon.');
      
      // Reset form
      setFormData({
        agencyName: '',
        contactName: '',
        phone: '',
        email: '',
        password: '',
        currency: 'EUR',
        city: '',
        comments: '',
      });

      // Redirect to homepage after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Signup error:', error);
        toast.error('Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Agency Registration</CardTitle>
          <CardDescription className="text-muted-foreground">
            Apply to become a Meet Transfer partner agency
          </CardDescription>
          
          {/* Share buttons */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {/* Agency Name */}
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name *</Label>
              <Input
                id="agencyName"
                type="text"
                placeholder="Your agency name"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className={errors.agencyName ? 'border-destructive' : ''}
              />
              {errors.agencyName && (
                <p className="text-sm text-destructive">{errors.agencyName}</p>
              )}
            </div>

            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person *</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Full name"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className={errors.contactName ? 'border-destructive' : ''}
              />
              {errors.contactName && (
                <p className="text-sm text-destructive">{errors.contactName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+90 555 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="agency@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Istanbul, Antalya, Izmir"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className={errors.currency ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                placeholder="Tell us about your agency, services, or any questions..."
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className={errors.comments ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.comments && (
                <p className="text-sm text-destructive">{errors.comments}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Looking for customer booking?{' '}
              <Link to="/customer-signup" className="text-primary hover:underline font-medium">
                Customer signup
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
