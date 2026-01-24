import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';

interface ReservationItem {
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name?: string | null;
  dropoff_place_name?: string | null;
  pickup_date: string;
  customer_name: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_provider: string | null;
  payment_completed_at: string | null;
}

interface MonthlyStatementData {
  agencyName: string;
  month: Date;
  reservations: ReservationItem[];
  language: 'TR' | 'EN';
}

const translations = {
  TR: {
    title: 'AYLIK HESAP ÖZETİ',
    period: 'Dönem',
    agency: 'Acenta',
    generatedAt: 'Oluşturulma Tarihi',
    summary: 'ÖZET',
    totalReservations: 'Toplam Rezervasyon',
    paidOnline: 'Online Ödenen',
    totalAmount: 'Toplam Tutar',
    reservationDetails: 'REZERVASYON DETAYLARI',
    code: 'Kod',
    date: 'Tarih',
    customer: 'Müşteri',
    route: 'Güzergah',
    amount: 'Tutar',
    status: 'Durum',
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Nakit',
    companyInfo: 'VIP Transfer Hizmetleri',
    footer: 'Bu belge elektronik olarak oluşturulmuştur.',
    noData: 'Bu dönem için veri bulunmamaktadır.',
    stripe: 'Kredi Kartı',
    paypal: 'PayPal',
  },
  EN: {
    title: 'MONTHLY ACCOUNT STATEMENT',
    period: 'Period',
    agency: 'Agency',
    generatedAt: 'Generated At',
    summary: 'SUMMARY',
    totalReservations: 'Total Reservations',
    paidOnline: 'Paid Online',
    totalAmount: 'Total Amount',
    reservationDetails: 'RESERVATION DETAILS',
    code: 'Code',
    date: 'Date',
    customer: 'Customer',
    route: 'Route',
    amount: 'Amount',
    status: 'Status',
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash',
    companyInfo: 'VIP Transfer Services',
    footer: 'This document was generated electronically.',
    noData: 'No data available for this period.',
    stripe: 'Credit Card',
    paypal: 'PayPal',
  }
};

export const generateAgencyMonthlyStatement = async (data: MonthlyStatementData): Promise<void> => {
  const t = translations[data.language];
  const dateLocale = data.language === 'TR' ? tr : enUS;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [234, 88, 12]; // Orange-600
  const darkColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Load and add company logo
  try {
    const logoUrl = 'https://meettransfer.app/images/meet-transfer-logo.png';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', margin, yPos, 30, 13);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = logoUrl;
    });
  } catch (error) {
    console.warn('Error loading logo:', error);
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.title, pageWidth - margin, yPos + 10, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t.companyInfo, margin, yPos + 18);

  yPos = 50;

  // Period and Agency info
  const monthStart = startOfMonth(data.month);
  const monthEnd = endOfMonth(data.month);
  const periodText = `${format(monthStart, 'dd MMMM', { locale: dateLocale })} - ${format(monthEnd, 'dd MMMM yyyy', { locale: dateLocale })}`;
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.text(`${t.agency}: ${data.agencyName}`, margin, yPos);
  doc.text(`${t.period}: ${periodText}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.text(`${t.generatedAt}: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: dateLocale })}`, margin, yPos);

  yPos += 12;

  // Filter only paid online payments for this month
  const monthReservations = data.reservations.filter(r => {
    if (!r.payment_completed_at) return false;
    const paymentDate = new Date(r.payment_completed_at);
    return paymentDate >= monthStart && paymentDate <= monthEnd && 
           r.payment_status === 'paid' && 
           ['stripe', 'paypal'].includes(r.payment_provider || '');
  });

  // Summary section
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t.summary, margin + 5, yPos + 7);

  // Calculate totals by currency
  const totalsByCurrency: Record<string, number> = {};
  monthReservations.forEach(r => {
    const currency = r.currency || 'EUR';
    totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + r.amount;
  });

  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const summaryY = yPos + 14;
  doc.text(`${t.totalReservations}: ${monthReservations.length}`, margin + 5, summaryY);
  
  // Display totals by currency
  let totalText = `${t.totalAmount}: `;
  if (Object.keys(totalsByCurrency).length === 0) {
    totalText += '-';
  } else {
    totalText += Object.entries(totalsByCurrency)
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(' | ');
  }
  doc.text(totalText, margin + 5, summaryY + 6);

  yPos += 35;

  // Reservation details table
  if (monthReservations.length === 0) {
    doc.setTextColor(...lightGray);
    doc.setFontSize(10);
    doc.text(t.noData, pageWidth / 2, yPos + 10, { align: 'center' });
  } else {
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.reservationDetails, margin, yPos);
    yPos += 5;

    const tableData = monthReservations.map(r => {
      const route = `${r.pickup_place_name || r.pickup} → ${r.dropoff_place_name || r.dropoff}`;
      const truncatedRoute = route.length > 35 ? route.substring(0, 32) + '...' : route;
      const paymentMethodText = r.payment_provider === 'stripe' ? t.stripe : 
                                 r.payment_provider === 'paypal' ? t.paypal : '-';
      
      return [
        `#${r.reservation_code || '-'}`,
        format(new Date(r.pickup_date), 'dd/MM/yy', { locale: dateLocale }),
        r.customer_name.length > 15 ? r.customer_name.substring(0, 12) + '...' : r.customer_name,
        truncatedRoute,
        formatCurrency(r.amount, r.currency),
        paymentMethodText,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [[t.code, t.date, t.customer, t.route, t.amount, t.status]],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: darkColor,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 25 },
        3: { cellWidth: 55 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(t.footer, pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.meettransfer.com', pageWidth / 2, footerY + 4, { align: 'center' });

  // Save PDF
  const monthStr = format(data.month, 'yyyy-MM');
  const fileName = `MeetTransfer_Statement_${data.agencyName.replace(/\s+/g, '_')}_${monthStr}.pdf`;
  doc.save(fileName);
};
