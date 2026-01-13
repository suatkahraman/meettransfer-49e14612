import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";

const TermsPage = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Terms & Conditions - Meet Transfer Airport Transfer Service"
        description="Terms and conditions for Meet Transfer airport transfer services. Booking, payment, cancellation policy, waiting time, and privacy information."
        keywords="Meet Transfer terms, transfer service terms, cancellation policy, booking terms, airport transfer conditions"
        canonicalPath="/terms"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        noIndex={false}
      />
      <SchemaOrg
        schemas={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Terms & Conditions', url: '/terms' },
            ],
          },
        ]}
      />

      <PageHeader
        title="Terms & Conditions"
        subtitle="Please read carefully before booking"
      />

      <div className="max-w-4xl mx-auto px-4 py-8 prose prose-sm max-w-none">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Meet Transfer - Terms & Conditions</h1>

        {/* Prominent Cancellation Policy Banner */}
        <div className="not-prose mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400 m-0">Free Cancellation Policy</h2>
              <p className="text-green-600 dark:text-green-500 text-sm m-0">Flexible booking with peace of mind</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
              <div className="text-3xl mb-2">🆓</div>
              <p className="font-bold text-green-700 dark:text-green-400 text-lg mb-1">FREE</p>
              <p className="text-sm text-muted-foreground">Up to 24 hours before pickup</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="font-bold text-yellow-600 dark:text-yellow-400 text-lg mb-1">50% Charge</p>
              <p className="text-sm text-muted-foreground">Within 24 hours of pickup</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
              <div className="text-3xl mb-2">❌</div>
              <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-1">100% Charge</p>
              <p className="text-sm text-muted-foreground">No-shows or within 2 hours</p>
            </div>
          </div>
        </div>

        <h2>1. Booking & Confirmation</h2>
        <p>
          All bookings are subject to availability. Upon successful booking,
          you will receive a confirmation email and/or WhatsApp message with
          your transfer details. Please review all information and notify us
          immediately of any errors.
        </p>

        <h2>2. Payment Terms</h2>
        <p>
          We accept cash payment to driver, credit card, and invoice payment
          for corporate clients. For cash payments, please ensure you have the
          exact amount in the agreed currency. Credit card payments may be
          subject to a small processing fee.
        </p>

        <h2>3. Cancellation Policy</h2>
        <p>
          Our cancellation policy is designed to be fair and flexible:
        </p>
        <ul>
          <li><strong className="text-green-600">Free cancellation</strong> up to 24 hours before pickup</li>
          <li><strong className="text-yellow-600">50% charge</strong> for cancellations within 24 hours</li>
          <li><strong className="text-red-600">100% charge</strong> for no-shows or cancellations within 2 hours</li>
        </ul>

        <h2>4. Waiting Time</h2>
        <p>
          For airport pickups, we provide 60 minutes of free waiting time from
          the scheduled flight arrival. For other pickups, 15 minutes of free
          waiting time is included. Additional waiting time may be charged at
          €1 per minute.
        </p>

        <h2>5. Flight Delays</h2>
        <p>
          We monitor all flights and adjust pickup times accordingly at no
          extra cost. In case of significant delays (more than 2 hours), please
          contact us to confirm your transfer.
        </p>

        <h2>6. Luggage & Passengers</h2>
        <p>
          Please ensure the vehicle type you book can accommodate your group
          size and luggage. Each passenger is allowed one suitcase and one
          carry-on bag. Additional luggage may require a larger vehicle at
          extra cost.
        </p>

        <h2>7. Child Seats</h2>
        <p>
          Child seats and booster seats are available free of charge upon
          request. Please specify the child's age and weight when booking so
          we can provide the appropriate seat.
        </p>

        <h2>8. Privacy</h2>
        <p>
          Your privacy is important to us. Please review our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          for detailed information about how we collect, use, and protect your
          personal data.
        </p>

        <h2>9. Liability</h2>
        <p>
          Meet Transfer is fully insured for passenger transportation. However,
          we are not liable for delays caused by traffic, weather, or other
          circumstances beyond our control. We recommend allowing sufficient
          time for airport transfers.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to update these terms and conditions at any
          time. The latest version will always be available on our website.
          Continued use of our services constitutes acceptance of any changes.
        </p>

        <h2>Contact Information</h2>
        <p>
          <strong>Meet Transfer</strong><br />
          Email: info@meettransfer.app<br />
          Phone/WhatsApp: +1 (555) 805-1101
        </p>

        <p className="text-muted-foreground text-sm mt-8">
          Last updated: December 2024
        </p>
      </div>
    </WebsiteLayout>
  );
};

export default TermsPage;
