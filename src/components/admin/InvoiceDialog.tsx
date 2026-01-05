import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Printer, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MTT-${year}${month}${day}-${random}`;
};

export const InvoiceDialog = ({ open, onOpenChange }: InvoiceDialogProps) => {
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [transferLines, setTransferLines] = useState<TransferLine[]>([
    { id: crypto.randomUUID(), date: '', time: '', passengerName: '', pickup: '', dropoff: '', price: 0 }
  ]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const handleExport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fatura - ${invoiceNumber}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm 20mm;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1a1a1a;
              width: 210mm;
              min-height: 297mm;
              background: white;
            }
            .invoice-container {
              padding: 10mm 0;
            }
            .invoice-header { 
              text-align: center; 
              margin-bottom: 25px;
              border-bottom: 3px solid #c9a961;
              padding-bottom: 20px;
            }
            .logo { max-width: 120px; margin-bottom: 8px; }
            .company-title { 
              font-size: 26px; 
              font-weight: bold; 
              color: #1a1a1a;
              letter-spacing: 1px;
            }
            .company-subtitle {
              font-size: 12px;
              color: #666;
              margin-top: 4px;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              padding: 10px 0;
            }
            .invoice-meta-item {
              text-align: center;
            }
            .invoice-meta-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
            }
            .invoice-meta-value {
              font-size: 14px;
              font-weight: 600;
              color: #1a1a1a;
            }
            .section { margin-bottom: 25px; }
            .section-title { 
              font-size: 12px; 
              font-weight: bold; 
              color: #c9a961;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .client-info { 
              padding: 15px;
              background: #fafafa;
              border-radius: 6px;
              border-left: 4px solid #c9a961;
            }
            .client-name { font-weight: bold; font-size: 16px; color: #1a1a1a; }
            .client-address { color: #555; margin-top: 8px; white-space: pre-line; font-size: 13px; line-height: 1.5; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 12px;
            }
            th { 
              background: #1a1a1a; 
              color: white; 
              padding: 10px 8px; 
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:last-child { text-align: right; }
            td { 
              padding: 10px 8px; 
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }
            tr:nth-child(even) { background: #fafafa; }
            .date-cell { white-space: nowrap; font-size: 11px; color: #666; }
            .price-cell { text-align: right; font-weight: 600; white-space: nowrap; }
            .total-section {
              margin-top: 20px;
              border-top: 2px solid #1a1a1a;
              padding-top: 15px;
            }
            .total-row { 
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: linear-gradient(135deg, #c9a961 0%, #b8954d 100%);
              color: white;
              padding: 15px 20px;
              border-radius: 6px;
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
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
              <div class="company-title">Meet Travel Transfer</div>
              <div class="company-subtitle">VIP Transfer Hizmetleri</div>
              <div class="invoice-meta">
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">Fatura No</div>
                  <div class="invoice-meta-value">${invoiceNumber}</div>
                </div>
                <div class="invoice-meta-item">
                  <div class="invoice-meta-label">Düzenleme Tarihi</div>
                  <div class="invoice-meta-value">${format(new Date(), 'dd.MM.yyyy', { locale: tr })}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Fatura Kesilen Firma</div>
              <div class="client-info">
                <div class="client-name">${companyName || '-'}</div>
                <div class="client-address">${companyAddress || '-'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Transfer Detayları</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">Tarih / Saat</th>
                    <th style="width: 20%;">Yolcu</th>
                    <th style="width: 25%;">Alış Noktası</th>
                    <th style="width: 25%;">Bırakış Noktası</th>
                    <th style="width: 15%;">Ücret</th>
                  </tr>
                </thead>
                <tbody>
                  ${transferLines.map(line => `
                    <tr>
                      <td class="date-cell">
                        ${formatDisplayDate(line.date)}<br/>
                        <span style="color: #999;">${line.time || '-'}</span>
                      </td>
                      <td><strong>${line.passengerName || '-'}</strong></td>
                      <td>${line.pickup || '-'}</td>
                      <td>${line.dropoff || '-'}</td>
                      <td class="price-cell">${formatCurrency(Number(line.price) || 0)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span>GENEL TOPLAM</span>
                <span>${formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div class="footer">
              <div class="footer-company">Meet Travel Transfer</div>
              Bu belge bilgisayar ortamında oluşturulmuştur.
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const resetForm = () => {
    setCompanyName('');
    setCompanyAddress('');
    setTransferLines([
      { id: crypto.randomUUID(), date: '', time: '', passengerName: '', pickup: '', dropoff: '', price: 0 }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Fatura Hazırla
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Preview */}
          <div className="text-center border-b pb-4">
            <img src={logo} alt="Meet Transfer Logo" className="h-14 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Meet Travel Transfer</h2>
            <p className="text-xs text-muted-foreground">VIP Transfer Hizmetleri</p>
            <div className="flex justify-center gap-8 mt-3">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Fatura No</div>
                <div className="text-sm font-semibold">{invoiceNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Tarih</div>
                <div className="text-sm font-semibold">{format(new Date(), 'dd.MM.yyyy', { locale: tr })}</div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-primary">Fatura Kesilen Firma</Label>
            <Input
              placeholder="Şirket Adı"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Textarea
              placeholder="Şirket Adresi"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Transfer Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-primary">Transfer Bilgileri</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTransferLine}>
                <Plus className="h-4 w-4 mr-1" />
                Satır Ekle
              </Button>
            </div>

            {transferLines.map((line) => (
              <div key={line.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Tarih</Label>
                    <Input
                      type="date"
                      value={line.date}
                      onChange={(e) => updateTransferLine(line.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Saat</Label>
                    <Input
                      type="time"
                      value={line.time}
                      onChange={(e) => updateTransferLine(line.id, 'time', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <Label className="text-xs text-muted-foreground">Yolcu Adı</Label>
                    <Input
                      placeholder="Yolcu adı"
                      value={line.passengerName}
                      onChange={(e) => updateTransferLine(line.id, 'passengerName', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Alış</Label>
                    <Input
                      placeholder="Alış noktası"
                      value={line.pickup}
                      onChange={(e) => updateTransferLine(line.id, 'pickup', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Bırakış</Label>
                    <Input
                      placeholder="Bırakış noktası"
                      value={line.dropoff}
                      onChange={(e) => updateTransferLine(line.id, 'dropoff', e.target.value)}
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-1 flex items-end">
                    <div className="w-full">
                      <Label className="text-xs text-muted-foreground">€</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={line.price || ''}
                        onChange={(e) => updateTransferLine(line.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransferLine(line.id)}
                    disabled={transferLines.length === 1}
                    className="text-destructive hover:text-destructive h-7 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="text-lg font-semibold">Genel Toplam</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Printer className="h-4 w-4" />
            PDF Olarak Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
