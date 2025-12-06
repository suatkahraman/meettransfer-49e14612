import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';

const adminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone must be at least 7 digits').max(20).regex(/^[+\d\s\-()]+$/, 'Invalid phone format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  setupKey: z.string().min(1, 'Setup key is required'),
});

const AdminSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: 'System Admin',
    email: '',
    phone: '',
    password: '',
    setupKey: '',
  });

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    try {
      // Try to call the setup function with empty data to check status
      // This is a simple way to check if admin exists without exposing data
      const { data } = await supabase.functions.invoke('setup-initial-admin', {
        body: {
          email: 'check@check.com',
          password: 'check',
          name: 'check',
          phone: 'check',
          setupKey: 'INVALID_KEY'
        },
      });
      
      // If we get "admin exists" message, admin is already set up
      if (data?.message?.includes('already exists')) {
        setAdminExists(true);
      }
    } catch (err) {
      // Ignore errors during check
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = adminSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-initial-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          setupKey: formData.setupKey,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to create admin');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success === false) {
        toast.info(data.message);
        setAdminExists(true);
        return;
      }

      toast.success('Admin account created successfully!');
      navigate('/auth');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-serif">Admin Already Exists</CardTitle>
            <CardDescription>
              An admin account has already been set up. Please login with your admin credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl font-serif">Initial Admin Setup</CardTitle>
          <CardDescription>
            Create the first admin account for Meet Transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+90 5XX XXX XXXX"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimum 6 characters"
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label>Setup Key</Label>
              <Input
                type="password"
                value={formData.setupKey}
                onChange={(e) => setFormData({...formData, setupKey: e.target.value})}
                placeholder="Enter the setup key"
                className={errors.setupKey ? 'border-destructive' : ''}
              />
              {errors.setupKey && <p className="text-sm text-destructive">{errors.setupKey}</p>}
              <p className="text-xs text-muted-foreground">
                Contact your system administrator for the setup key
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/auth')}
            >
              Already have an account? Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;