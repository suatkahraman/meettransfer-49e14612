import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PriceItem {
  from: string;
  to: string;
  price: string;
}

interface PriceTableProps {
  items: PriceItem[];
  title?: string;
}

const PriceTable = ({ items, title }: PriceTableProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("from")}</TableHead>
            <TableHead>{t("to")}</TableHead>
            <TableHead className="text-right">{t("price")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.from}</TableCell>
              <TableCell>{item.to}</TableCell>
              <TableCell className="text-right text-accent font-bold">
                {item.price}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PriceTable;
