import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CustomerPayment, AgencyPayment } from '@/hooks/useAdminPayments';

export const exportPaymentsToExcel = async (
  customerPayments: CustomerPayment[],
  agencyPayments: AgencyPayment[],
  activeTab: 'customer' | 'agency'
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MeetTransfer';
  workbook.created = new Date();

  const now = format(new Date(), 'dd-MM-yyyy_HH-mm');

  if (activeTab === 'customer') {
    const sheet = workbook.addWorksheet('Müşteri Ödemeleri');
    
    // Header styling
    sheet.columns = [
      { header: 'Rezervasyon Kodu', key: 'code', width: 15 },
      { header: 'Müşteri', key: 'customer', width: 25 },
      { header: 'Telefon', key: 'phone', width: 18 },
      { header: 'Alış', key: 'pickup', width: 30 },
      { header: 'Bırakış', key: 'dropoff', width: 30 },
      { header: 'Transfer Tarihi', key: 'transferDate', width: 15 },
      { header: 'Tutar', key: 'amount', width: 12 },
      { header: 'Para Birimi', key: 'currency', width: 12 },
      { header: 'Ödeme Durumu', key: 'status', width: 15 },
      { header: 'Ödeme Yöntemi', key: 'provider', width: 15 },
      { header: 'Ödeme Tarihi', key: 'paymentDate', width: 18 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    customerPayments.forEach(payment => {
      const statusMap: Record<string, string> = {
        paid: 'Ödendi',
        pending: 'Bekliyor',
        partial: 'Kısmi',
        pay_on_transfer: 'Nakit'
      };

      sheet.addRow({
        code: payment.reservation_code || '-',
        customer: payment.customer_name,
        phone: payment.customer_phone,
        pickup: payment.pickup,
        dropoff: payment.dropoff,
        transferDate: format(new Date(payment.pickup_date), 'dd.MM.yyyy', { locale: tr }),
        amount: payment.price || 0,
        currency: payment.price_currency || 'EUR',
        status: statusMap[payment.payment_status || ''] || payment.payment_status || '-',
        provider: payment.payment_provider || '-',
        paymentDate: payment.payment_completed_at 
          ? format(new Date(payment.payment_completed_at), 'dd.MM.yyyy HH:mm', { locale: tr })
          : '-'
      });
    });

    // Add totals row
    const totalRow = sheet.addRow({
      code: '',
      customer: 'TOPLAM',
      phone: '',
      pickup: '',
      dropoff: '',
      transferDate: '',
      amount: customerPayments.reduce((sum, p) => sum + (p.price || 0), 0),
      currency: '',
      status: `${customerPayments.filter(p => p.payment_status === 'paid').length} ödendi`,
      provider: '',
      paymentDate: ''
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Format amount column as currency
    sheet.getColumn('amount').numFmt = '#,##0.00';

  } else {
    const sheet = workbook.addWorksheet('Acenta Ödemeleri');
    
    sheet.columns = [
      { header: 'Acenta', key: 'agency', width: 30 },
      { header: 'Tutar', key: 'amount', width: 15 },
      { header: 'Para Birimi', key: 'currency', width: 12 },
      { header: 'Ödeme Tarihi', key: 'paymentDate', width: 18 },
      { header: 'Notlar', key: 'notes', width: 40 },
      { header: 'Kayıt Tarihi', key: 'createdAt', width: 18 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' }
    };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    agencyPayments.forEach(payment => {
      sheet.addRow({
        agency: payment.agency_name,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: format(new Date(payment.payment_date), 'dd.MM.yyyy', { locale: tr }),
        notes: payment.notes || '-',
        createdAt: format(new Date(payment.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })
      });
    });

    // Add totals row
    const totalRow = sheet.addRow({
      agency: 'TOPLAM',
      amount: agencyPayments.reduce((sum, p) => sum + p.amount, 0),
      currency: '',
      paymentDate: `${agencyPayments.length} ödeme`,
      notes: '',
      createdAt: ''
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Format amount column as currency
    sheet.getColumn('amount').numFmt = '#,##0.00';
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `odemeler_${activeTab === 'customer' ? 'musteri' : 'acenta'}_${now}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
