import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';

interface AgencyReservationsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
}

export const AgencyReservationsExportDialog = ({
  open,
  onOpenChange,
  agencyId,
  agencyName,
}: AgencyReservationsExportDialogProps) => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Lütfen başlangıç ve bitiş tarihlerini seçin');
      return;
    }

    if (startDate > endDate) {
      toast.error('Başlangıç tarihi bitiş tarihinden sonra olamaz');
      return;
    }

    setExporting(true);

    try {
      // Fetch all reservations for this agency within the date range with pagination
      let allReservations: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            reservation_code,
            customer_name,
            customer_phone,
            pickup,
            dropoff,
            pickup_date,
            pickup_time,
            vehicle_type,
            price,
            price_currency,
            payment_type,
            payment_status,
            status,
            driver_notes,
            customer_notes,
            passenger_names,
            luggage_count,
            baby_seat_count,
            flight_number,
            passenger_cash_amount,
            passenger_cash_currency,
            created_at,
            updated_at,
            drivers (name, plate_number)
          `)
          .eq('agency_id', agencyId)
          .gte('pickup_date', format(startDate, 'yyyy-MM-dd'))
          .lte('pickup_date', format(endDate, 'yyyy-MM-dd'))
          .order('pickup_date', { ascending: true })
          .order('pickup_time', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allReservations = [...allReservations, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      if (allReservations.length === 0) {
        toast.error('Bu tarih aralığında rezervasyon bulunamadı');
        setExporting(false);
        return;
      }

      // Fetch agency_reservation_details for pricing info
      const reservationIds = allReservations.map(r => r.id);
      let allDetails: any[] = [];
      page = 0;
      hasMore = true;

      while (hasMore) {
        const { data: details, error: detailsError } = await supabase
          .from('agency_reservation_details')
          .select('reservation_id, customer_price, agency_price_currency, agency_notes, payment_status')
          .in('reservation_id', reservationIds.slice(page * pageSize, (page + 1) * pageSize));

        if (detailsError) {
          console.error('Details fetch error:', detailsError);
        }

        if (details && details.length > 0) {
          allDetails = [...allDetails, ...details];
          hasMore = details.length === pageSize && (page + 1) * pageSize < reservationIds.length;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Create a map for quick lookup
      const detailsMap = new Map(allDetails.map(d => [d.reservation_id, d]));

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Meet Transfer';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Rezervasyonlar');

      // Define columns
      worksheet.columns = [
        { header: 'Rezervasyon Kodu', key: 'reservation_code', width: 15 },
        { header: 'Tarih', key: 'pickup_date', width: 12 },
        { header: 'Saat', key: 'pickup_time', width: 8 },
        { header: 'Müşteri Adı', key: 'customer_name', width: 25 },
        { header: 'Telefon', key: 'customer_phone', width: 18 },
        { header: 'Alış Noktası', key: 'pickup', width: 35 },
        { header: 'Varış Noktası', key: 'dropoff', width: 35 },
        { header: 'Araç Tipi', key: 'vehicle_type', width: 15 },
        { header: 'Yolcu Listesi', key: 'passenger_names', width: 30 },
        { header: 'Valiz', key: 'luggage_count', width: 8 },
        { header: 'Bebek Koltuğu', key: 'baby_seat_count', width: 12 },
        { header: 'Uçuş No', key: 'flight_number', width: 12 },
        { header: 'Fiyat (Sistem)', key: 'system_price', width: 15 },
        { header: 'Müşteri Fiyatı', key: 'customer_price', width: 15 },
        { header: 'Para Birimi', key: 'currency', width: 10 },
        { header: 'Yolcu Nakit', key: 'passenger_cash', width: 15 },
        { header: 'Ödeme Tipi', key: 'payment_type', width: 15 },
        { header: 'Ödeme Durumu', key: 'payment_status', width: 15 },
        { header: 'Durum', key: 'status', width: 15 },
        { header: 'Şoför', key: 'driver_name', width: 20 },
        { header: 'Plaka', key: 'plate_number', width: 12 },
        { header: 'Müşteri Notları', key: 'customer_notes', width: 30 },
        { header: 'Şoför Notları', key: 'driver_notes', width: 30 },
        { header: 'Acenta Notları', key: 'agency_notes', width: 30 },
        { header: 'Oluşturulma', key: 'created_at', width: 18 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1a365d' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Vehicle type translations
      const vehicleTypeMap: Record<string, string> = {
        'mercedes-vito': 'Mercedes Vito',
        'mercedes-sprinter': 'Mercedes Sprinter',
        'vip-minibus': 'VIP Minibüs',
        'sedan': 'Sedan',
        'suv': 'SUV',
      };

      // Status translations
      const statusMap: Record<string, string> = {
        'pending': 'Bekliyor',
        'pending_admin_review': 'Admin Onayı Bekliyor',
        'waiting_for_customer_approval': 'Müşteri Onayı Bekliyor',
        'waiting_for_agency_approval': 'Acenta Onayı Bekliyor',
        'customer_approved': 'Müşteri Onayladı',
        'confirmed': 'Onaylandı',
        'sent_to_driver': 'Şoföre Gönderildi',
        'active': 'Aktif',
        'in_progress': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi',
        'cancelled_by_customer': 'Müşteri İptali',
        'cancelled_by_agency': 'Acenta İptali',
        'no_show': 'Gelmedi',
      };

      // Payment type translations
      const paymentTypeMap: Record<string, string> = {
        'cash': 'Nakit',
        'card': 'Kredi Kartı',
        'online': 'Online',
        'transfer': 'Havale',
        'agency': 'Acenta',
      };

      // Payment status translations
      const paymentStatusMap: Record<string, string> = {
        'pending': 'Bekliyor',
        'paid': 'Ödendi',
        'partial': 'Kısmi',
        'pay_on_transfer': 'Transfer Ödemeli',
        'not_paid': 'Ödenmedi',
      };

      // Add data rows
      allReservations.forEach((reservation, index) => {
        const details = detailsMap.get(reservation.id);
        const passengerNames = reservation.passenger_names?.length > 0 
          ? reservation.passenger_names.join(', ') 
          : '';

        worksheet.addRow({
          reservation_code: reservation.reservation_code || '-',
          pickup_date: format(new Date(reservation.pickup_date), 'dd.MM.yyyy'),
          pickup_time: reservation.pickup_time?.slice(0, 5) || '-',
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone,
          pickup: reservation.pickup,
          dropoff: reservation.dropoff,
          vehicle_type: vehicleTypeMap[reservation.vehicle_type] || reservation.vehicle_type,
          passenger_names: passengerNames,
          luggage_count: reservation.luggage_count || 0,
          baby_seat_count: reservation.baby_seat_count || 0,
          flight_number: reservation.flight_number || '-',
          system_price: reservation.price ? `${reservation.price}` : '-',
          customer_price: details?.customer_price ? `${details.customer_price}` : '-',
          currency: details?.agency_price_currency || reservation.price_currency || 'TRY',
          passenger_cash: reservation.passenger_cash_amount 
            ? `${reservation.passenger_cash_amount} ${reservation.passenger_cash_currency || 'TRY'}` 
            : '-',
          payment_type: paymentTypeMap[reservation.payment_type] || reservation.payment_type,
          payment_status: paymentStatusMap[reservation.payment_status] || reservation.payment_status || '-',
          status: statusMap[reservation.status] || reservation.status,
          driver_name: reservation.drivers?.name || '-',
          plate_number: reservation.drivers?.plate_number || '-',
          customer_notes: reservation.customer_notes || '-',
          driver_notes: reservation.driver_notes || '-',
          agency_notes: details?.agency_notes || '-',
          created_at: format(new Date(reservation.created_at), 'dd.MM.yyyy HH:mm'),
        });

        // Alternate row colors
        if (index % 2 === 1) {
          worksheet.getRow(index + 2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
          };
        }
      });

      // Add summary section
      worksheet.addRow([]);
      worksheet.addRow([]);
      
      const summaryStartRow = worksheet.rowCount + 1;
      worksheet.addRow(['ÖZET BİLGİLER']);
      worksheet.getRow(summaryStartRow).font = { bold: true, size: 14 };
      
      worksheet.addRow(['Acenta:', agencyName]);
      worksheet.addRow(['Tarih Aralığı:', `${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`]);
      worksheet.addRow(['Toplam Rezervasyon:', allReservations.length]);
      
      // Calculate totals by currency
      const totals: Record<string, { count: number; price: number; customerPrice: number }> = {};
      allReservations.forEach(r => {
        const details = detailsMap.get(r.id);
        const currency = details?.agency_price_currency || r.price_currency || 'TRY';
        if (!totals[currency]) {
          totals[currency] = { count: 0, price: 0, customerPrice: 0 };
        }
        totals[currency].count++;
        totals[currency].price += r.price || 0;
        totals[currency].customerPrice += details?.customer_price || 0;
      });

      worksheet.addRow([]);
      worksheet.addRow(['Para Birimi', 'Rezervasyon Sayısı', 'Sistem Fiyatı Toplamı', 'Müşteri Fiyatı Toplamı']);
      worksheet.getRow(worksheet.rowCount).font = { bold: true };

      Object.entries(totals).forEach(([currency, data]) => {
        worksheet.addRow([currency, data.count, data.price.toFixed(2), data.customerPrice.toFixed(2)]);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.width && column.width < 10) {
          column.width = 10;
        }
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agencyName.replace(/[^a-zA-Z0-9]/g, '_')}_Rezervasyonlar_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${allReservations.length} rezervasyon Excel'e aktarıldı`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Dışa aktarma başarısız');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Rezervasyonları Dışa Aktar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            <strong>{agencyName}</strong> acentasının rezervasyonlarını seçili tarih aralığında Excel dosyası olarak indirin.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd MMM yyyy', { locale: tr }) : 'Tarih seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }
                    }}
                    locale={tr}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd MMM yyyy', { locale: tr }) : 'Tarih seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }
                    }}
                    locale={tr}
                    disabled={(date) => startDate ? date < startDate : false}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setStartDate(startOfMonth(now));
                setEndDate(endOfMonth(now));
              }}
            >
              Bu Ay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                setStartDate(startOfMonth(lastMonth));
                setEndDate(endOfMonth(lastMonth));
              }}
            >
              Geçen Ay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setStartDate(new Date(now.getFullYear(), 0, 1));
                setEndDate(new Date(now.getFullYear(), 11, 31));
              }}
            >
              Bu Yıl
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const lastYear = now.getFullYear() - 1;
                setStartDate(new Date(lastYear, 0, 1));
                setEndDate(new Date(lastYear, 11, 31));
              }}
            >
              Geçen Yıl
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>Dışa aktarılıyor...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Excel İndir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
