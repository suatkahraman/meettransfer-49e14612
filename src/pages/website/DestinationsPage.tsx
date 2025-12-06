import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import DestinationCard from "@/components/website/DestinationCard";

const destinations = [
  {
    name: "Istanbul",
    airports: "IST & SAW",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
    link: "/istanbul-transfer",
  },
  {
    name: "Antalya",
    airports: "AYT",
    image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800",
    link: "/antalya-transfer",
  },
  {
    name: "Bodrum",
    airports: "BJV",
    image: "https://images.unsplash.com/photo-1568196555325-8c46f49ed55e?w=800",
    link: "/bodrum-transfer",
  },
  {
    name: "Dalaman",
    airports: "DLM",
    image: "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800",
    link: "/dalaman-transfer",
  },
  {
    name: "Izmir",
    airports: "ADB",
    image: "https://images.unsplash.com/photo-1565361849078-294849288a2d?w=800",
    link: "/izmir-transfer",
  },
  {
    name: "Cappadocia",
    airports: "NAV & ASR",
    image: "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800",
    link: "/cappadocia-transfer",
  },
  {
    name: "Ephesus & Pamukkale",
    airports: "Historical Tours",
    image: "https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=800",
    link: "/ephesus-pamukkale",
  },
  {
    name: "Luxury Chauffeur",
    airports: "VIP Service",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
    link: "/luxury-chauffeur",
  },
];

const DestinationsPage = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Our Destinations"
        subtitle="Premium Airport Transfers Across Turkey"
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {destinations.map((destination) => (
            <DestinationCard key={destination.name} {...destination} />
          ))}
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default DestinationsPage;
