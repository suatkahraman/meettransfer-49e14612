import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Building2, ArrowRight } from 'lucide-react';

const SignupChoicePage = () => {
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
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Join Meet Transfer
            </h1>
            <p className="text-muted-foreground">
              Choose how you'd like to register
            </p>
          </div>

          <div className="space-y-4">
            {/* Customer Registration Card */}
            <Link to="/signup/customer">
              <Card className="cursor-pointer transition-all hover:border-accent hover:shadow-lg group">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Customer Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Book premium transfers for your personal or business travel
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>

            {/* Agency Registration Card */}
            <Link to="/signup/agency">
              <Card className="cursor-pointer transition-all hover:border-accent hover:shadow-lg group">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Building2 className="h-7 w-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Agency Partner</h3>
                    <p className="text-sm text-muted-foreground">
                      Partner with us to offer transfer services to your clients
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:underline font-medium">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupChoicePage;
