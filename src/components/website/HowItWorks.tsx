import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, FileCheck, UserCheck } from "lucide-react";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: "1",
      icon: Search,
      titleKey: "howStep1Title",
      titleFallback: "Enter your route and select car",
      descKey: "howStep1Desc",
      descFallback: "Enter all the required data in the search field and then choose the desired vehicle.",
    },
    {
      number: "2",
      icon: FileCheck,
      titleKey: "howStep2Title",
      titleFallback: "Complete booking form",
      descKey: "howStep2Desc",
      descFallback: "Enter the details of the lead passenger, add extras if you wish. Proceed to payment and receive your voucher.",
    },
    {
      number: "3",
      icon: UserCheck,
      titleKey: "howStep3Title",
      titleFallback: "Meet your driver",
      descKey: "howStep3Desc",
      descFallback: "You will receive your driver's details 6 hours prior to pickup and he will be waiting for you on-site with a Name Sign.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("howItWorks") || "How does it work"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorksDesc") || "Book your transfer in 3 simple steps"}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Step Number - Large Background */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg z-10">
                {step.number}
              </div>

              {/* Card */}
              <div className="pt-12 pb-8 px-6 bg-card rounded-2xl border hover:shadow-lg transition-shadow">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">
                  {t(step.titleKey) || step.titleFallback}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(step.descKey) || step.descFallback}
                </p>
              </div>

              {/* Connector Line (not for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;