import { motion } from 'framer-motion';
import AccountDeletionCard from '@/components/security/AccountDeletionCard';

const DriverSettings = () => {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
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

export default DriverSettings;
