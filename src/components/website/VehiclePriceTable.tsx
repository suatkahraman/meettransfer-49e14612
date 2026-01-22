import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBlogT } from "@/components/blog/BlogLayout";

export type VehiclePriceRow = {
  to: string;
  sedan: string;
  vito: string;
  maybachMinivan: string;
  vipVito: string;
  sprinter: string;
};

interface VehiclePriceTableProps {
  caption?: string;
  rows: VehiclePriceRow[];
}

export default function VehiclePriceTable({ caption, rows }: VehiclePriceTableProps) {
  const { t } = useBlogT();

  return (
    <div className="not-prose">
      <Table>
        {caption ? (
          <caption className="text-sm text-muted-foreground caption-top mb-2">
            {caption}
          </caption>
        ) : null}
        <TableHeader>
          <TableRow>
            <TableHead>{t("blogPriceTableTo")}</TableHead>
            <TableHead>{t("blogVehicleSedan")}</TableHead>
            <TableHead>{t("blogVehicleVito")}</TableHead>
            <TableHead>{t("blogVehicleMaybachMinivan")}</TableHead>
            <TableHead>{t("blogVehicleVipVito")}</TableHead>
            <TableHead>{t("blogVehicleSprinter")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.to}>
              <TableCell className="font-medium">{r.to}</TableCell>
              <TableCell>{r.sedan}</TableCell>
              <TableCell>{r.vito}</TableCell>
              <TableCell>{r.maybachMinivan}</TableCell>
              <TableCell>{r.vipVito}</TableCell>
              <TableCell>{r.sprinter}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
