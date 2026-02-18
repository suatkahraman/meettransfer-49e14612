import WebsiteLayout from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/contexts/LanguageContext";

// Simple test component to isolate the issue
const IndexSimple = () => {
  const { t } = useLanguage();

  return (
    <WebsiteLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {t("welcomeBack", "Welcome Back!")}
          </h1>
          <p className="text-lg text-muted-foreground">
            Homepage is loading... If you see this, the issue is in the Hero component.
          </p>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default IndexSimple;