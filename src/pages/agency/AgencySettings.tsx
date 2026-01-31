import { useNavigate } from 'react-router-dom';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AccountDeletionCard from '@/components/security/AccountDeletionCard';

const AgencySettings = () => {
  const navigate = useNavigate();
  const { t } = useAgencyTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center gap-3 sticky top-0 z-10 safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{t('accountSettings') || 'Hesap Ayarları'}</h1>
      </header>

      {/* Content */}
      <main className="p-4 max-w-lg mx-auto space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AccountDeletionCard />
        </motion.div>
      </main>
    </div>
  );
};

export default AgencySettings;
