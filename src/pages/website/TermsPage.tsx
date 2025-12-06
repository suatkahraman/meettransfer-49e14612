import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";

const TermsPage = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Terms & Conditions"
        subtitle="Please read carefully before booking"
      />

      <div className="max-w-4xl mx-auto px-4 py-8 prose prose-sm max-w-none">
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
        <ul>
          <li>Free cancellation up to 24 hours before pickup</li>
          <li>50% charge for cancellations within 24 hours</li>
          <li>100% charge for no-shows or cancellations within 2 hours</li>
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

        <h2>8. Privacy Policy</h2>
        <p>
          We collect personal information solely for the purpose of providing
          our transfer services. Your data is stored securely and never shared
          with third parties for marketing purposes. We may share information
          with our drivers solely for service delivery.
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
          Meet Transfer<br />
          Email: info@meettransfer.com<br />
          Phone/WhatsApp: +90 530 123 4567<br />
          Address: Istanbul, Turkey
        </p>

        <p className="text-muted-foreground text-sm mt-8">
          Last updated: December 2024
        </p>
      </div>
    </WebsiteLayout>
  );
};

export default TermsPage;
