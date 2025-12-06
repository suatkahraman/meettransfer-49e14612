import { useState } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    value: "+90 530 123 4567",
    href: "tel:+905301234567",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "+90 530 123 4567",
    href: "https://wa.me/905301234567",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@meettransfer.com",
    href: "mailto:info@meettransfer.com",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Istanbul, Turkey",
    href: null,
  },
];

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent successfully! We will contact you shortly.");
    setFormData({ name: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <WebsiteLayout>
      <PageHeader
        title="Contact Us"
        subtitle="We're Here to Help 24/7"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contactInfo.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="font-medium text-sm mb-1">{item.title}</div>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground">{item.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Fastest Way to Reach Us</h3>
          <p className="text-muted-foreground mb-4">
            Get instant responses via WhatsApp
          </p>
          <WhatsAppButton variant="large" />
        </div>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="+90 5XX XXX XXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  placeholder="How can we help you?"
                  rows={5}
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                className="w-full h-12 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : t("send")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </WebsiteLayout>
  );
};

export default ContactPage;
