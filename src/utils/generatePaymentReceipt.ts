import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';

interface ReceiptData {
  reservationCode: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  paymentStatus: string;
  language: 'TR' | 'EN';
  isAgency?: boolean;
  agencyName?: string;
}

const translations = {
  TR: {
    title: 'ÖDEME MAKBUZU',
    receiptNo: 'Makbuz No',
    date: 'Tarih',
    customerInfo: 'MÜŞTERİ BİLGİLERİ',
    name: 'Ad Soyad',
    agency: 'Acenta',
    transferDetails: 'TRANSFER BİLGİLERİ',
    reservationCode: 'Rezervasyon Kodu',
    route: 'Güzergah',
    transferDate: 'Transfer Tarihi',
    transferTime: 'Saat',
    paymentDetails: 'ÖDEME BİLGİLERİ',
    amount: 'Tutar',
    paymentMethod: 'Ödeme Yöntemi',
    paymentDate: 'Ödeme Tarihi',
    status: 'Durum',
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    creditCard: 'Kredi Kartı',
    paypal: 'PayPal',
    cash: 'Nakit',
    thankYou: 'Meet Transfer\'ı tercih ettiğiniz için teşekkür ederiz!',
    footer: 'Bu belge elektronik olarak oluşturulmuştur.',
    companyName: 'Meet Transfer',
    companyInfo: 'VIP Transfer Hizmetleri',
  },
  EN: {
    title: 'PAYMENT RECEIPT',
    receiptNo: 'Receipt No',
    date: 'Date',
    customerInfo: 'CUSTOMER INFORMATION',
    name: 'Name',
    agency: 'Agency',
    transferDetails: 'TRANSFER DETAILS',
    reservationCode: 'Reservation Code',
    route: 'Route',
    transferDate: 'Transfer Date',
    transferTime: 'Time',
    paymentDetails: 'PAYMENT DETAILS',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    paymentDate: 'Payment Date',
    status: 'Status',
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    creditCard: 'Credit Card',
    paypal: 'PayPal',
    cash: 'Cash',
    thankYou: 'Thank you for choosing Meet Transfer!',
    footer: 'This document was generated electronically.',
    companyName: 'Meet Transfer',
    companyInfo: 'VIP Transfer Services',
  }
};

export const generatePaymentReceipt = async (data: ReceiptData): Promise<void> => {
  const t = translations[data.language];
  const dateLocale = data.language === 'TR' ? tr : enUS;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [234, 88, 12]; // Orange-600
  const darkColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Load and add company logo
  try {
    const logoUrl = 'https://meettransfer.app/images/meet-transfer-logo.png';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        // Create canvas to convert image to base64
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          // Add logo to PDF (positioned in header, left side)
          doc.addImage(imgData, 'PNG', margin, yPos, 35, 15);
        }
        resolve();
      };
      img.onerror = () => {
        console.warn('Could not load logo, continuing without it');
        resolve();
      };
      img.src = logoUrl;
    });
  } catch (error) {
    console.warn('Error loading logo:', error);
  }

  // Company info (next to logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(t.companyInfo, margin, yPos + 22);

  // Title (right side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(t.title, pageWidth - margin, yPos + 14, { align: 'right' });

  yPos = 60;

  // Receipt info row
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const receiptNo = `MT-${data.reservationCode}-${Date.now().toString().slice(-6)}`;
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: dateLocale });
  
  doc.text(`${t.receiptNo}: ${receiptNo}`, margin, yPos);
  doc.text(`${t.date}: ${currentDate}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 15;

  // Helper function to draw section
  const drawSection = (title: string, startY: number): number => {
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(margin, startY, contentWidth, 8, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 4, startY + 5.5);
    return startY + 12;
  };

  // Helper function to draw field
  const drawField = (label: string, value: string, y: number, isLast: boolean = false): number => {
    doc.setTextColor(...lightGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 4, y);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 4, y + 5);
    
    if (!isLast) {
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.line(margin, y + 9, pageWidth - margin, y + 9);
    }
    
    return y + 14;
  };

  // Customer Information Section
  yPos = drawSection(t.customerInfo, yPos);
  if (data.isAgency && data.agencyName) {
    yPos = drawField(t.agency, data.agencyName, yPos);
  }
  yPos = drawField(t.name, data.customerName, yPos, true);

  yPos += 8;

  // Transfer Details Section
  yPos = drawSection(t.transferDetails, yPos);
  yPos = drawField(t.reservationCode, `#${data.reservationCode}`, yPos);
  yPos = drawField(t.route, `${data.pickup} → ${data.dropoff}`, yPos);
  
  const formattedDate = format(new Date(data.pickupDate), 'dd MMMM yyyy', { locale: dateLocale });
  yPos = drawField(t.transferDate, formattedDate, yPos);
  yPos = drawField(t.transferTime, data.pickupTime, yPos, true);

  yPos += 8;

  // Payment Details Section
  yPos = drawSection(t.paymentDetails, yPos);
  
  // Amount with larger font
  doc.setTextColor(...lightGray);
  doc.setFontSize(9);
  doc.text(t.amount, margin + 4, yPos);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.amount, data.currency), margin + 4, yPos + 8);
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, yPos + 12, pageWidth - margin, yPos + 12);
  yPos += 18;

  // Payment method
  let methodText = t.cash;
  if (data.paymentMethod === 'stripe') methodText = t.creditCard;
  else if (data.paymentMethod === 'paypal') methodText = t.paypal;
  else if (data.paymentStatus === 'pay_on_transfer') methodText = t.cashToDriver;
  
  yPos = drawField(t.paymentMethod, methodText, yPos);

  // Payment date
  if (data.paymentDate) {
    const paymentDateFormatted = format(new Date(data.paymentDate), 'dd MMMM yyyy HH:mm', { locale: dateLocale });
    yPos = drawField(t.paymentDate, paymentDateFormatted, yPos);
  }

  // Status
  let statusText = t.pending;
  if (data.paymentStatus === 'paid') statusText = t.paid;
  else if (data.paymentStatus === 'pay_on_transfer') statusText = t.cashToDriver;
  
  doc.setTextColor(...lightGray);
  doc.setFontSize(9);
  doc.text(t.status, margin + 4, yPos);
  
  // Status badge
  const badgeColor: [number, number, number] = data.paymentStatus === 'paid' 
    ? [34, 197, 94] // Green
    : data.paymentStatus === 'pay_on_transfer'
    ? [59, 130, 246] // Blue
    : [234, 179, 8]; // Yellow
  
  doc.setFillColor(...badgeColor);
  doc.roundedRect(margin + 4, yPos + 2, doc.getTextWidth(statusText) + 8, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, margin + 8, yPos + 6);

  yPos += 25;

  // Thank you message
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(margin, yPos, contentWidth, 12, 3, 3, 'F');
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.thankYou, pageWidth / 2, yPos + 7.5, { align: 'center' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(t.footer, pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.meettransfer.com', pageWidth / 2, footerY + 4, { align: 'center' });

  // Save PDF
  const fileName = `MeetTransfer_Receipt_${data.reservationCode}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
