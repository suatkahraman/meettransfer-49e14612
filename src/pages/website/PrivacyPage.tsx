import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";

const PrivacyPage = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Privacy Policy - Meet Transfer Airport Transfer Service"
        description="Privacy policy for Meet Transfer airport transfer services. Learn how we collect, use, and protect your personal information."
        keywords="Meet Transfer privacy, data protection, personal information, GDPR, privacy policy"
        canonicalPath="/privacy"
        noIndex={false}
      />
      <SchemaOrg
        schemas={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Privacy Policy', url: '/privacy' },
            ],
          },
        ]}
      />

      <PageHeader
        title="Privacy Policy"
        subtitle="How we protect your personal information"
      />

      <div className="max-w-4xl mx-auto px-4 py-8 prose prose-sm max-w-none">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Meet Transfer - Privacy Policy</h1>

        <h2>1. Information We Collect</h2>
        <p>
          We collect personal information that you voluntarily provide to us when booking our transfer services, including:
        </p>
        <ul>
          <li>Full name and contact information (phone number, email address)</li>
          <li>Flight details and travel itinerary</li>
          <li>Pickup and drop-off locations</li>
          <li>Special requests or preferences</li>
          <li>Payment information (processed securely through our payment partners)</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect solely for the purpose of providing our transfer services:
        </p>
        <ul>
          <li>To process and confirm your booking</li>
          <li>To communicate with you about your transfer</li>
          <li>To monitor flight status and adjust pickup times</li>
          <li>To assign appropriate drivers and vehicles</li>
          <li>To improve our services based on feedback</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
        </p>
        <ul>
          <li><strong>With our drivers:</strong> We share necessary details (name, pickup location, contact number) with assigned drivers to complete your transfer</li>
          <li><strong>With payment processors:</strong> To securely process your payments</li>
          <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
        </p>
        <ul>
          <li>Encrypted data transmission (SSL/TLS)</li>
          <li>Secure server infrastructure</li>
          <li>Regular security audits</li>
          <li>Limited access to personal data on a need-to-know basis</li>
        </ul>

        <h2>5. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Booking records are kept for accounting and legal purposes for a period of 5 years.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          Under applicable data protection laws, you have the following rights:
        </p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Request transfer of your data to another service</li>
          <li><strong>Objection:</strong> Object to certain processing of your data</li>
        </ul>

        <h2>7. Cookies and Tracking</h2>
        <p>
          Our website uses cookies to improve user experience and analyze website traffic. You can control cookie preferences through your browser settings. We use:
        </p>
        <ul>
          <li><strong>Essential cookies:</strong> Required for website functionality</li>
          <li><strong>Analytics cookies:</strong> To understand how visitors use our site</li>
          <li><strong>Marketing cookies:</strong> To deliver relevant advertisements (optional)</li>
        </ul>

        <h2>8. Third-Party Services</h2>
        <p>
          We may use third-party services that collect and process data according to their own privacy policies:
        </p>
        <ul>
          <li>Google Analytics for website analytics</li>
          <li>WhatsApp for customer communication</li>
          <li>Payment processors for secure transactions</li>
        </ul>

        <h2>9. International Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or wish to exercise your rights, please contact us:
        </p>
        <p>
          <strong>Meet Transfer</strong><br />
          Email: info@meettransfer.app<br />
          Phone/WhatsApp: +1 (555) 805-1101<br />
          Address: Istanbul, Turkey
        </p>

        <p className="text-muted-foreground text-sm mt-8">
          Last updated: December 2024
        </p>
      </div>
    </WebsiteLayout>
  );
};

export default PrivacyPage;
