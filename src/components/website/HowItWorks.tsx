import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, CreditCard, Car, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const isTR = language.toLowerCase() === "tr";

  const steps = [
    {
      number: "01",
      icon: Search,
      titleKey: "howStep1Title",
      titleFallback: "Book Your Transfer",
      descKey: "howStep1Desc",
      descFallback: "Enter your route, select date and time, choose your vehicle. Get instant pricing.",
      color: "from-blue-500 to-indigo-600",
      features: isTR 
        ? ["Anında fiyat", "Tüm araçlar", "7/24 rezervasyon"]
        : ["Instant pricing", "All vehicles", "24/7 booking"],
    },
    {
      number: "02",
      icon: CreditCard,
      titleKey: "howStep2Title",
      titleFallback: "Confirm & Pay",
      descKey: "howStep2Desc",
      descFallback: "Enter passenger details, add extras if needed. Pay securely and receive confirmation.",
      color: "from-emerald-500 to-teal-600",
      features: isTR 
        ? ["Güvenli ödeme", "Anında onay", "E-posta voucher"]
        : ["Secure payment", "Instant confirm", "Email voucher"],
    },
    {
      number: "03",
      icon: Car,
      titleKey: "howStep3Title",
      titleFallback: "Meet Your Driver",
      descKey: "howStep3Desc",
      descFallback: "Receive driver details 6 hours before. They'll wait with your name sign at the pickup point.",
      color: "from-amber-500 to-orange-600",
      features: isTR 
        ? ["İsim tabelası", "Şoför bilgisi", "Uçuş takibi"]
        : ["Name sign", "Driver info", "Flight tracking"],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="h-4 w-4" />
            {isTR ? "3 Kolay Adım" : "3 Easy Steps"}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("howItWorks") || "How It Works"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorksDesc") || "Book your premium transfer in minutes"}
          </p>
        </motion.div>

        {/* Steps - Timeline Style */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number Circle */}
                <motion.div 
                  className="relative mx-auto w-16 h-16 mb-6 z-10"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl rotate-6 opacity-80`} />
                  <div className={`relative w-full h-full bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{step.number}</span>
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div 
                  className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
                  whileHover={{ y: -4 }}
                >
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary transition-colors">
                    {t(step.titleKey) || step.titleFallback}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-center mb-4">
                    {t(step.descKey) || step.descFallback}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {step.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link 
            to={getLocalizedPath("/book")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            {isTR ? "Hemen Rezervasyon Yap" : "Book Your Transfer Now"}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
