import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import WhatsAppButton from "./WhatsAppButton";

interface PriceItem {
  from: string;
  to: string;
  price?: string;
}

interface PriceTableProps {
  items: PriceItem[];
  title?: string;
}

const PriceTable = ({ items, title }: PriceTableProps) => {
  const { t } = useLanguage();

  // Helper function to get translated price
  const getDisplayPrice = (price?: string) => {
    // If no price or it's a request price indicator, return translated version
    if (!price || price === "Request Price" || price === "Fiyat Talep Et") {
      return t("requestPrice");
    }
    return price;
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("from")}</TableHead>
            <TableHead>{t("to")}</TableHead>
            <TableHead className="text-right">{t("price")}</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.from}</TableCell>
              <TableCell>{item.to}</TableCell>
              <TableCell className="text-right text-accent font-bold">
                {getDisplayPrice(item.price)}
              </TableCell>
              <TableCell className="text-right">
                <WhatsAppButton
                  variant="small"
                  message={`Hi, I'd like to request a price for transfer from ${item.from} to ${item.to}.`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PriceTable;
