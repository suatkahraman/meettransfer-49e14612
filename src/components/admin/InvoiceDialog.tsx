import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr, enUS, de, fr, ar } from 'date-fns/locale';
import { Plus, Printer, Trash2, FileDown, Save, History, ChevronLeft, Eye, Search, Globe, Coins, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENCY_OPTIONS, getCurrencySymbol } from '@/lib/currency';
import logo from '@/assets/meet-transfer-logo.webp';

interface TransferLine {
  id: string;
  date: string;
  time: string;
  passengerName: string;
  pickup: string;
  dropoff: string;
  price: number;
}

interface SavedInvoice {
  id: string;
  invoice_number: string;
  company_name: string;
  company_address: string | null;
  transfer_lines: TransferLine[];
  total_amount: number;
  currency: string;
  created_at: string;
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type InvoiceLanguage = 'tr' | 'en' | 'de' | 'fr' | 'ar';

const INVOICE_LANGUAGES = [
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'ar', label: 'العربية', flag: '🇦🇪' },
];

const INVOICE_TRANSLATIONS: Record<InvoiceLanguage, {
  invoiceTitle: string;
  invoiceNo: string;
  issueDate: string;
  billedTo: string;
  transferDetails: string;
  dateTime: string;
  passenger: string;
  pickup: string;
  dropoff: string;
  price: string;
  grandTotal: string;
  companySubtitle: string;
  footerNote: string;
}> = {
  tr: {
    invoiceTitle: 'FATURA',
    invoiceNo: 'Fatura No',
    issueDate: 'Düzenleme Tarihi',
    billedTo: 'Fatura Kesilen Firma',
    transferDetails: 'Transfer Detayları',
    dateTime: 'Tarih / Saat',
    passenger: 'Yolcu',
    pickup: 'Alış Noktası',
    dropoff: 'Bırakış Noktası',
    price: 'Ücret',
    grandTotal: 'GENEL TOPLAM',
    companySubtitle: 'VIP Transfer Hizmetleri',
    footerNote: 'Bu belge bilgisayar ortamında oluşturulmuştur.'
  },
  en: {
    invoiceTitle: 'INVOICE',
    invoiceNo: 'Invoice No',
    issueDate: 'Issue Date',
    billedTo: 'Billed To',
    transferDetails: 'Transfer Details',
    dateTime: 'Date / Time',
    passenger: 'Passenger',
    pickup: 'Pickup Point',
    dropoff: 'Drop-off Point',
    price: 'Price',
    grandTotal: 'GRAND TOTAL',
    companySubtitle: 'VIP Transfer Services',
    footerNote: 'This document was generated electronically.'
  },
  de: {
    invoiceTitle: 'RECHNUNG',
    invoiceNo: 'Rechnungsnr.',
    issueDate: 'Ausstellungsdatum',
    billedTo: 'Rechnungsempfänger',
    transferDetails: 'Transfer Details',
    dateTime: 'Datum / Zeit',
    passenger: 'Passagier',
    pickup: 'Abholpunkt',
    dropoff: 'Absetzpunkt',
    price: 'Preis',
    grandTotal: 'GESAMTBETRAG',
    companySubtitle: 'VIP Transfer Dienstleistungen',
    footerNote: 'Dieses Dokument wurde elektronisch erstellt.'
  },
  fr: {
    invoiceTitle: 'FACTURE',
    invoiceNo: 'N° de facture',
    issueDate: 'Date d\'émission',
    billedTo: 'Facturer à',
    transferDetails: 'Détails du transfert',
    dateTime: 'Date / Heure',
    passenger: 'Passager',
    pickup: 'Point de prise en charge',
    dropoff: 'Point de dépôt',
    price: 'Prix',
    grandTotal: 'TOTAL GÉNÉRAL',
    companySubtitle: 'Services de transfert VIP',
    footerNote: 'Ce document a été généré électroniquement.'
  },
  ar: {
    invoiceTitle: 'فاتورة',
    invoiceNo: 'رقم الفاتورة',
    issueDate: 'تاريخ الإصدار',
    billedTo: 'مفوتر إلى',
    transferDetails: 'تفاصيل النقل',
    dateTime: 'التاريخ / الوقت',
    passenger: 'الراكب',
    pickup: 'نقطة الالتقاط',
    dropoff: 'نقطة الإنزال',
    price: 'السعر',
    grandTotal: 'المجموع الكلي',
    companySubtitle: 'خدمات النقل VIP',
    footerNote: 'تم إنشاء هذه الوثيقة إلكترونياً.'
  }
};

const getDateLocale = (lang: InvoiceLanguage) => {
  switch (lang) {
    case 'en': return enUS;
    case 'de': return de;
    case 'fr': return fr;
    case 'ar': return ar;
    default: return tr;
  }
};

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MTT-${year}${month}${day}-${random}`;
};

export const InvoiceDialog = ({ open, onOpenChange }: InvoiceDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedLanguage, setSelectedLanguage] = useState<InvoiceLanguage>('tr');
  const [transferLines, setTransferLines] = useState<TransferLine[]>([
    { id: crypto.randomUUID(), date: '', time: '', passengerName: '', pickup: '', dropoff: '', price: 0 }
  ]);
  const [saving, setSaving] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<SavedInvoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const fetchSavedInvoices = async () => {
    setLoadingInvoices(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setSavedInvoices(data.map(inv => ({
        ...inv,
        transfer_lines: (inv.transfer_lines as unknown as TransferLine[]) || []
      })));
    }
    setLoadingInvoices(false);
  };

  useEffect(() => {
    if (open && activeTab === 'history') {
      fetchSavedInvoices();
    }
  }, [open, activeTab]);

  const addTransferLine = () => {
    setTransferLines([
      ...transferLines,
      { id: crypto.randomUUID(), date: '', time: '', passengerName: '', pickup: '', dropoff: '', price: 0 }
    ]);
  };

  const removeTransferLine = (id: string) => {
    if (transferLines.length > 1) {
      setTransferLines(transferLines.filter(line => line.id !== id));
    }
  };

  const updateTransferLine = (id: string, field: keyof TransferLine, value: string | number) => {
    setTransferLines(transferLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const totalAmount = transferLines.reduce((sum, line) => sum + (Number(line.price) || 0), 0);

  const formatCurrencyAmount = (amount: number, currency: string = selectedCurrency) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error('Şirket adı zorunludur');
      return;
    }

    setSaving(true);
    
    if (editingInvoiceId) {
      // Update existing invoice
      const { error } = await supabase.from('invoices').update({
        invoice_number: invoiceNumber,
        company_name: companyName,
        company_address: companyAddress,
        transfer_lines: JSON.parse(JSON.stringify(transferLines)),
        total_amount: totalAmount,
        currency: selectedCurrency,
      }).eq('id', editingInvoiceId);

      if (error) {
        toast.error('Fatura güncellenemedi');
        console.error(error);
      } else {
        toast.success('Fatura güncellendi');
        fetchSavedInvoices();
        setEditingInvoiceId(null);
      }
    } else {
      // Insert new invoice
      const { error } = await supabase.from('invoices').insert([{
        invoice_number: invoiceNumber,
        company_name: companyName,
        company_address: companyAddress,
        transfer_lines: JSON.parse(JSON.stringify(transferLines)),
        total_amount: totalAmount,
        currency: selectedCurrency,
        created_by: user?.id
      }]);

      if (error) {
        toast.error('Fatura kaydedilemedi');
        console.error(error);
      } else {
        toast.success('Fatura kaydedildi');
        fetchSavedInvoices();
      }
    }
    setSaving(false);
  };

  const handleExport = (invoice?: SavedInvoice) => {
    const inv = invoice || { 
      invoice_number: invoiceNumber, 
      company_name: companyName, 
      company_address: companyAddress, 
      transfer_lines: transferLines, 
      total_amount: totalAmount,
      currency: selectedCurrency,
      created_at: new Date().toISOString()
    };

    const t = INVOICE_TRANSLATIONS[selectedLanguage];
    const dateLocale = getDateLocale(selectedLanguage);
    const isRTL = selectedLanguage === 'ar';
    const currencyToUse = inv.currency || selectedCurrency;

    const formatExportDate = (dateStr: string) => {
      if (!dateStr) return '-';
      try {
        return format(new Date(dateStr), 'dd.MM.yyyy', { locale: dateLocale });
      } catch {
        return dateStr;
      }
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head>
          <title>${t.invoiceTitle} - ${inv.invoice_number}</title>
          <style>
            @page { size: A4; margin: 15mm 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1a1a1a;
              background: white;
              padding: 20px;
              direction: ${isRTL ? 'rtl' : 'ltr'};
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 3px solid #c9a961;
              padding-bottom: 25px;
            }
            .logo { max-width: 100px; margin-bottom: 10px; }
            .company-title { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1a1a1a;
              letter-spacing: 2px;
            }
            .company-subtitle {
              font-size: 12px;
              color: #888;
              margin-top: 5px;
              letter-spacing: 1px;
            }
            .invoice-meta {
              display: flex;
              justify-content: center;
              gap: 60px;
              margin-top: 20px;
            }
            .invoice-meta-item { text-align: center; }
            .invoice-meta-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .invoice-meta-value {
              font-size: 15px;
              font-weight: 600;
              color: #1a1a1a;
              margin-top: 3px;
            }
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 11px; 
              font-weight: 700; 
              color: #c9a961;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .client-info { 
              padding: 18px;
              background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
              border-radius: 8px;
              border-${isRTL ? 'right' : 'left'}: 4px solid #c9a961;
            }
            .client-name { font-weight: 700; font-size: 17px; color: #1a1a1a; }
            .client-address { color: #555; margin-top: 8px; white-space: pre-line; font-size: 13px; line-height: 1.6; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 12px;
              font-size: 12px;
            }
            th { 
              background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
              color: white; 
              padding: 12px 10px; 
              text-align: ${isRTL ? 'right' : 'left'};
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:last-child { text-align: ${isRTL ? 'left' : 'right'}; }
            td { 
              padding: 12px 10px; 
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }
            tr:nth-child(even) { background: #fafafa; }
            .date-cell { white-space: nowrap; font-size: 11px; }
            .date-main { color: #1a1a1a; font-weight: 500; }
            .date-time { color: #888; font-size: 10px; }
            .price-cell { text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; white-space: nowrap; color: #1a1a1a; }
            .total-section {
              margin-top: 25px;
              padding-top: 20px;
            }
            .total-row { 
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: linear-gradient(135deg, #c9a961 0%, #b8954d 100%);
              color: white;
              padding: 18px 25px;
              border-radius: 8px;
              font-size: 20px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(201, 169, 97, 0.3);
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #888;
              font-size: 10px;
            }
            .footer-company {
              font-weight: 600;
              color: #666;
              margin-bottom: 5px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <img src="${logo}" class="logo" alt="Logo" />
              <div class="company-title">MEET TRAVEL TRANSFER</div>
              <div class="company-subtitle">${t.companySubtitle}</div>
              <div class="invoice-meta">
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">${t.invoiceNo}</div>
                  <div class="invoice-meta-value">${inv.invoice_number}</div>
                </div>
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">${t.issueDate}</div>
                  <div class="invoice-meta-value">${format(new Date(inv.created_at), 'dd.MM.yyyy', { locale: dateLocale })}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">${t.billedTo}</div>
              <div class="client-info">
                <div class="client-name">${inv.company_name || '-'}</div>
                <div class="client-address">${inv.company_address || '-'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${t.transferDetails}</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">${t.dateTime}</th>
                    <th style="width: 20%;">${t.passenger}</th>
                    <th style="width: 25%;">${t.pickup}</th>
                    <th style="width: 25%;">${t.dropoff}</th>
                    <th style="width: 15%;">${t.price}</th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.transfer_lines.map(line => `
                    <tr>
                      <td class="date-cell">
                        <div class="date-main">${formatExportDate(line.date)}</div>
                        <div class="date-time">${line.time || '-'}</div>
                      </td>
                      <td><strong>${line.passengerName || '-'}</strong></td>
                      <td>${line.pickup || '-'}</td>
                      <td>${line.dropoff || '-'}</td>
                      <td class="price-cell">${formatCurrencyAmount(Number(line.price) || 0, currencyToUse)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span>${t.grandTotal}</span>
                <span>${formatCurrencyAmount(inv.total_amount, currencyToUse)}</span>
              </div>
            </div>

            <div class="footer">
              <div class="footer-company">Meet Travel Transfer</div>
              ${t.footerNote}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleShareWhatsApp = async (invoice?: SavedInvoice) => {
    const inv = invoice || { 
      invoice_number: invoiceNumber, 
      company_name: companyName, 
      company_address: companyAddress, 
      transfer_lines: transferLines, 
      total_amount: totalAmount,
      currency: selectedCurrency,
      created_at: new Date().toISOString()
    };

    const t = INVOICE_TRANSLATIONS[selectedLanguage];
    const dateLocale = getDateLocale(selectedLanguage);
    const isRTL = selectedLanguage === 'ar';
    const currencyToUse = inv.currency || selectedCurrency;

    const formatExportDate = (dateStr: string) => {
      if (!dateStr) return '-';
      try {
        return format(new Date(dateStr), 'dd.MM.yyyy', { locale: dateLocale });
      } catch {
        return dateStr;
      }
    };

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head>
          <title>${t.invoiceTitle} - ${inv.invoice_number}</title>
          <style>
            @page { size: A4; margin: 15mm 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1a1a1a;
              background: white;
              padding: 20px;
              direction: ${isRTL ? 'rtl' : 'ltr'};
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 3px solid #c9a961;
              padding-bottom: 25px;
            }
            .logo { max-width: 100px; margin-bottom: 10px; }
            .company-title { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1a1a1a;
              letter-spacing: 2px;
            }
            .company-subtitle {
              font-size: 12px;
              color: #888;
              margin-top: 5px;
              letter-spacing: 1px;
            }
            .invoice-meta {
              display: flex;
              justify-content: center;
              gap: 60px;
              margin-top: 20px;
            }
            .invoice-meta-item { text-align: center; }
            .invoice-meta-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .invoice-meta-value {
              font-size: 15px;
              font-weight: 600;
              color: #1a1a1a;
              margin-top: 3px;
            }
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 11px; 
              font-weight: 700; 
              color: #c9a961;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .client-info { 
              padding: 18px;
              background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
              border-radius: 8px;
              border-${isRTL ? 'right' : 'left'}: 4px solid #c9a961;
            }
            .client-name { font-weight: 700; font-size: 17px; color: #1a1a1a; }
            .client-address { color: #555; margin-top: 8px; white-space: pre-line; font-size: 13px; line-height: 1.6; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 12px;
              font-size: 12px;
            }
            th { 
              background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
              color: white; 
              padding: 12px 10px; 
              text-align: ${isRTL ? 'right' : 'left'};
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:last-child { text-align: ${isRTL ? 'left' : 'right'}; }
            td { 
              padding: 12px 10px; 
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }
            tr:nth-child(even) { background: #fafafa; }
            .date-cell { white-space: nowrap; font-size: 11px; }
            .date-main { color: #1a1a1a; font-weight: 500; }
            .date-time { color: #888; font-size: 10px; }
            .price-cell { text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; white-space: nowrap; color: #1a1a1a; }
            .total-section {
              margin-top: 25px;
              padding-top: 20px;
            }
            .total-row { 
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: linear-gradient(135deg, #c9a961 0%, #b8954d 100%);
              color: white;
              padding: 18px 25px;
              border-radius: 8px;
              font-size: 20px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(201, 169, 97, 0.3);
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #888;
              font-size: 10px;
            }
            .footer-company {
              font-weight: 600;
              color: #666;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <img src="${logo}" class="logo" alt="Logo" />
              <div class="company-title">MEET TRAVEL TRANSFER</div>
              <div class="company-subtitle">${t.companySubtitle}</div>
              <div class="invoice-meta">
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">${t.invoiceNo}</div>
                  <div class="invoice-meta-value">${inv.invoice_number}</div>
                </div>
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">${t.issueDate}</div>
                  <div class="invoice-meta-value">${format(new Date(inv.created_at), 'dd.MM.yyyy', { locale: dateLocale })}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">${t.billedTo}</div>
              <div class="client-info">
                <div class="client-name">${inv.company_name || '-'}</div>
                <div class="client-address">${inv.company_address || '-'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${t.transferDetails}</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">${t.dateTime}</th>
                    <th style="width: 20%;">${t.passenger}</th>
                    <th style="width: 25%;">${t.pickup}</th>
                    <th style="width: 25%;">${t.dropoff}</th>
                    <th style="width: 15%;">${t.price}</th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.transfer_lines.map(line => `
                    <tr>
                      <td class="date-cell">
                        <div class="date-main">${formatExportDate(line.date)}</div>
                        <div class="date-time">${line.time || '-'}</div>
                      </td>
                      <td><strong>${line.passengerName || '-'}</strong></td>
                      <td>${line.pickup || '-'}</td>
                      <td>${line.dropoff || '-'}</td>
                      <td class="price-cell">${formatCurrencyAmount(Number(line.price) || 0, currencyToUse)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span>${t.grandTotal}</span>
                <span>${formatCurrencyAmount(inv.total_amount, currencyToUse)}</span>
              </div>
            </div>

            <div class="footer">
              <div class="footer-company">Meet Travel Transfer</div>
              ${t.footerNote}
            </div>
          </div>
        </body>
      </html>
    `;

    // Check if Web Share API with files is supported
    if (navigator.share && navigator.canShare) {
      try {
        // Create a hidden iframe to render and print to PDF
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '800px';
        iframe.style.height = '1200px';
        document.body.appendChild(iframe);
        
        iframe.contentDocument?.write(htmlContent);
        iframe.contentDocument?.close();

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use print-to-PDF via canvas approach - create blob from HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], `Fatura-${inv.invoice_number}.html`, { type: 'text/html' });
        
        document.body.removeChild(iframe);

        // Check if we can share files
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Fatura - ${inv.invoice_number}`,
            text: `${inv.company_name} - ${formatCurrencyAmount(inv.total_amount, currencyToUse)}`
          });
          return;
        }
      } catch (error) {
        console.log('File share not supported, falling back to text share');
      }
    }

    // Fallback: Open PDF in new window and prompt to save/share
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Add a message at the top for the user
      const shareMessage = document.createElement('div');
      shareMessage.innerHTML = `
        <div style="background: #25D366; color: white; padding: 15px; text-align: center; font-family: sans-serif; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
          <strong>PDF olarak kaydet:</strong> Ctrl+P (veya Cmd+P) → "PDF olarak kaydet" seçin → Sonra WhatsApp'ta paylaşın
          <button onclick="this.parentElement.remove(); window.print();" style="margin-left: 20px; background: white; color: #25D366; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
            PDF Oluştur
          </button>
        </div>
      `;
      printWindow.document.body.insertBefore(shareMessage, printWindow.document.body.firstChild);
    }

    toast.info('PDF olarak kaydedin ve WhatsApp\'ta paylaşın');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) {
      toast.success('Fatura silindi');
      fetchSavedInvoices();
      setViewingInvoice(null);
    } else {
      toast.error('Fatura silinemedi');
    }
  };

  const resetForm = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setCompanyName('');
    setCompanyAddress('');
    setSelectedCurrency('EUR');
    setSelectedLanguage('tr');
    setTransferLines([
      { id: crypto.randomUUID(), date: '', time: '', passengerName: '', pickup: '', dropoff: '', price: 0 }
    ]);
    setViewingInvoice(null);
    setEditingInvoiceId(null);
    setActiveTab('create');
  };

  const loadInvoiceToView = (invoice: SavedInvoice) => {
    setViewingInvoice(invoice);
  };

  const loadInvoiceToEdit = (invoice: SavedInvoice) => {
    setInvoiceNumber(invoice.invoice_number);
    setCompanyName(invoice.company_name);
    setCompanyAddress(invoice.company_address || '');
    setSelectedCurrency(invoice.currency);
    setTransferLines(invoice.transfer_lines.map(line => ({
      ...line,
      id: line.id || crypto.randomUUID()
    })));
    setEditingInvoiceId(invoice.id);
    setViewingInvoice(null);
    setActiveTab('create');
  };

  const filteredInvoices = savedInvoices.filter(inv => 
    inv.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Fatura Yönetimi
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              {editingInvoiceId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingInvoiceId ? 'Fatura Düzenle' : 'Yeni Fatura'}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Kayıtlı Faturalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-[calc(70vh-120px)] pr-4">
              <div className="space-y-5">
                {/* Header Preview */}
                <div className="text-center border-b pb-4 bg-gradient-to-b from-muted/30 to-transparent rounded-t-lg pt-4">
                  <img src={logo} alt="Meet Transfer Logo" className="h-12 mx-auto mb-2" />
                  <h2 className="text-lg font-bold tracking-wide">MEET TRAVEL TRANSFER</h2>
                  <p className="text-[10px] text-muted-foreground tracking-widest">VIP TRANSFER HİZMETLERİ</p>
                  <div className="flex justify-center gap-8 mt-3">
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Fatura No</div>
                      <div className="text-sm font-semibold font-mono">{invoiceNumber}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Tarih</div>
                      <div className="text-sm font-semibold">{format(new Date(), 'dd.MM.yyyy', { locale: tr })}</div>
                    </div>
                  </div>
                </div>

                {/* Language & Currency Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Fatura Dili
                    </Label>
                    <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as InvoiceLanguage)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVOICE_LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Para Birimi
                    </Label>
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map(curr => (
                          <SelectItem key={curr.value} value={curr.value}>
                            <span className="flex items-center gap-2">
                              <span>{curr.flag}</span>
                              <span>{curr.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Company Info */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Fatura Kesilen Firma</Label>
                  <Input
                    placeholder="Şirket Adı *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="font-medium"
                  />
                  <Textarea
                    placeholder="Şirket Adresi (opsiyonel)"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <Separator />

                {/* Transfer Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Transfer Bilgileri</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTransferLine} className="h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      Satır Ekle
                    </Button>
                  </div>

                  {transferLines.map((line, index) => (
                    <div key={line.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-[10px]">Transfer {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransferLine(line.id)}
                          disabled={transferLines.length === 1}
                          className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Sil
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Tarih</Label>
                          <Input
                            type="date"
                            value={line.date}
                            onChange={(e) => updateTransferLine(line.id, 'date', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Saat</Label>
                          <Input
                            type="time"
                            value={line.time}
                            onChange={(e) => updateTransferLine(line.id, 'time', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label className="text-[10px] text-muted-foreground">Yolcu</Label>
                          <Input
                            placeholder="Ad Soyad"
                            value={line.passengerName}
                            onChange={(e) => updateTransferLine(line.id, 'passengerName', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Alış</Label>
                          <Input
                            placeholder="Nereden"
                            value={line.pickup}
                            onChange={(e) => updateTransferLine(line.id, 'pickup', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Bırakış</Label>
                          <Input
                            placeholder="Nereye"
                            value={line.dropoff}
                            onChange={(e) => updateTransferLine(line.id, 'dropoff', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Ücret ({getCurrencySymbol(selectedCurrency)})</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={line.price || ''}
                            onChange={(e) => updateTransferLine(line.id, 'price', parseFloat(e.target.value) || 0)}
                            className="h-9 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <span className="font-semibold">Genel Toplam</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrencyAmount(totalAmount)}</span>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  İptal
                </Button>
                {editingInvoiceId && (
                  <Button variant="ghost" onClick={resetForm} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Yeni Fatura
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Kaydediliyor...' : editingInvoiceId ? 'Güncelle' : 'Kaydet'}
                </Button>
                <Button variant="outline" onClick={() => handleShareWhatsApp()} className="gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white border-0">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button onClick={() => handleExport()} className="gap-2">
                  <Printer className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            {viewingInvoice ? (
              <div className="h-full flex flex-col">
                <Button variant="ghost" size="sm" onClick={() => setViewingInvoice(null)} className="self-start mb-4 gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Geri
                </Button>
                <div className="flex-1 overflow-auto">
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-muted-foreground">Fatura No</div>
                        <div className="font-mono font-semibold">{viewingInvoice.invoice_number}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Tarih</div>
                        <div className="font-semibold">{format(new Date(viewingInvoice.created_at), 'dd.MM.yyyy', { locale: tr })}</div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Firma</div>
                      <div className="font-semibold">{viewingInvoice.company_name}</div>
                      {viewingInvoice.company_address && (
                        <div className="text-sm text-muted-foreground mt-1">{viewingInvoice.company_address}</div>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Transferler ({viewingInvoice.transfer_lines.length})</div>
                      <div className="space-y-2">
                        {viewingInvoice.transfer_lines.map((line, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-background rounded border text-sm">
                            <div className="flex-1">
                              <div className="font-medium">{line.passengerName || '-'}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDisplayDate(line.date)} {line.time} • {line.pickup} → {line.dropoff}
                              </div>
                            </div>
                            <div className="font-semibold">{formatCurrencyAmount(line.price, viewingInvoice.currency)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-semibold">Toplam</span>
                      <span className="text-xl font-bold text-primary">{formatCurrencyAmount(viewingInvoice.total_amount, viewingInvoice.currency)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(viewingInvoice.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="secondary" size="sm" onClick={() => loadInvoiceToEdit(viewingInvoice)} className="gap-1">
                      <Pencil className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShareWhatsApp(viewingInvoice)} className="gap-1 bg-[#25D366] hover:bg-[#22c55e] text-white border-0">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button size="sm" onClick={() => handleExport(viewingInvoice)} className="gap-1">
                      <Printer className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Fatura veya firma ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="flex-1">
                  {loadingInvoices ? (
                    <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kayıtlı fatura yok'}
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {filteredInvoices.map(inv => (
                        <div 
                          key={inv.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => loadInvoiceToView(inv)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{inv.invoice_number}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {format(new Date(inv.created_at), 'dd.MM.yy', { locale: tr })}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{inv.company_name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary mr-2">{formatCurrencyAmount(inv.total_amount, inv.currency)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadInvoiceToEdit(inv);
                              }}
                              title="Düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#25D366] hover:text-[#22c55e] hover:bg-[#25D366]/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareWhatsApp(inv);
                              }}
                              title="WhatsApp ile Paylaş"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport(inv);
                              }}
                              title="PDF İndir"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadInvoiceToView(inv);
                              }}
                              title="Görüntüle"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
