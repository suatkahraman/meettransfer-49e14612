import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Building2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import UniversalLanguageSelector from '@/components/UniversalLanguageSelector';

const SignupChoicePage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header with iOS safe area support */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t('back')}</span>
          </Link>
          <UniversalLanguageSelector variant="compact" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-center text-sm font-medium text-primary">
            {t('loginWelcomeFeature')}
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {t('signupChoiceTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('signupChoiceSubtitle')}
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
                    <h3 className="text-lg font-semibold text-foreground">{t('customerAccountTitle')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('customerAccountDesc')}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>

            {/* Agency Registration Card */}
            <Link to="/signup/agency">
              <Card className="cursor-pointer transition-all hover:border-accent hover:shadow-lg group">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Building2 className="h-7 w-7 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{t('agencyPartnerTitle')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('agencyPartnerDesc')}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    {t('agencyPartnerNote')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              {t('alreadyHaveAccountQuestion')}{' '}
              {/* Müşteri Girişi */}
              <div className="my-2">
                <iframe src="https://meettransfer.com/login" width="100%" height="600" frameBorder="0"></iframe>
              </div>
              {/* Şoför Girişi */}
              <div className="my-2">
                <iframe src="https://meettransfer.com/login/driver" width="100%" height="600" frameBorder="0"></iframe>
              </div>
              {/* Acenta Girişi */}
              <div className="my-2">
                <iframe src="https://meettransfer.com/login/agency" width="100%" height="600" frameBorder="0"></iframe>
              </div>
              {/* Kayıt Ol */}
              <div className="my-2">
                <iframe src="https://meettransfer.com/signup" width="100%" height="600" frameBorder="0"></iframe>
              </div>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupChoicePage;
