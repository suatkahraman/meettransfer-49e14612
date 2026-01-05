import { useState, useRef } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/meet-transfer-logo.webp';

interface TransferLine {
  id: string;
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
  const printRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [transferLines, setTransferLines] = useState<TransferLine[]>([
    { id: crypto.randomUUID(), passengerName: '', pickup: '', dropoff: '', price: 0 }
  ]);

  const addTransferLine = () => {
    setTransferLines([
      ...transferLines,
      { id: crypto.randomUUID(), passengerName: '', pickup: '', dropoff: '', price: 0 }
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fatura - ${invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #1a1a1a;
            }
            .invoice-header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #c9a961;
              padding-bottom: 20px;
            }
            .logo { max-width: 150px; margin-bottom: 10px; }
            .company-title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1a1a1a;
              margin-bottom: 5px;
            }
            .invoice-number { 
              font-size: 14px; 
              color: #666; 
              margin-top: 10px;
            }
            .invoice-date { 
              font-size: 12px; 
              color: #888; 
            }
            .section { margin-bottom: 25px; }
            .section-title { 
              font-size: 14px; 
              font-weight: bold; 
              color: #c9a961;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .client-info { 
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .client-name { font-weight: bold; font-size: 16px; }
            .client-address { color: #666; margin-top: 5px; white-space: pre-line; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th { 
              background: #1a1a1a; 
              color: white; 
              padding: 12px 10px; 
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
            }
            td { 
              padding: 12px 10px; 
              border-bottom: 1px solid #eee;
              font-size: 13px;
            }
            .price-cell { text-align: right; font-weight: 500; }
            .total-row { 
              background: #c9a961; 
              color: white;
            }
            .total-row td { 
              font-weight: bold; 
              font-size: 16px;
              padding: 15px 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #888;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <img src="${logo}" class="logo" alt="Logo" />
            <div class="company-title">Meet Travel Transfer</div>
            <div class="invoice-number">Fatura No: ${invoiceNumber}</div>
            <div class="invoice-date">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Fatura Kesilen Firma</div>
            <div class="client-info">
              <div class="client-name">${companyName || '-'}</div>
              <div class="client-address">${companyAddress || '-'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Transfer Bilgileri</div>
            <table>
              <thead>
                <tr>
                  <th>Yolcu Adı</th>
                  <th>Alış</th>
                  <th>Bırakış</th>
                  <th style="text-align: right;">Ücret</th>
                </tr>
              </thead>
              <tbody>
                ${transferLines.map(line => `
                  <tr>
                    <td>${line.passengerName || '-'}</td>
                    <td>${line.pickup || '-'}</td>
                    <td>${line.dropoff || '-'}</td>
                    <td class="price-cell">${formatCurrency(Number(line.price) || 0)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">GENEL TOPLAM</td>
                  <td class="price-cell">${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Meet Travel Transfer - VIP Transfer Hizmetleri
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const resetForm = () => {
    setCompanyName('');
    setCompanyAddress('');
    setTransferLines([
      { id: crypto.randomUUID(), passengerName: '', pickup: '', dropoff: '', price: 0 }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Fatura Hazırla
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6">
          {/* Header Preview */}
          <div className="text-center border-b pb-4">
            <img src={logo} alt="Meet Transfer Logo" className="h-16 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Meet Travel Transfer</h2>
            <p className="text-sm text-muted-foreground">Fatura No: {invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
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

            {transferLines.map((line, index) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-muted/30">
                <div className="col-span-12 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Yolcu Adı</Label>
                  <Input
                    placeholder="Yolcu adı"
                    value={line.passengerName}
                    onChange={(e) => updateTransferLine(line.id, 'passengerName', e.target.value)}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Alış</Label>
                  <Input
                    placeholder="Alış noktası"
                    value={line.pickup}
                    onChange={(e) => updateTransferLine(line.id, 'pickup', e.target.value)}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Bırakış</Label>
                  <Input
                    placeholder="Bırakış noktası"
                    value={line.dropoff}
                    onChange={(e) => updateTransferLine(line.id, 'dropoff', e.target.value)}
                  />
                </div>
                <div className="col-span-10 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Ücret (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={line.price || ''}
                    onChange={(e) => updateTransferLine(line.id, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTransferLine(line.id)}
                    disabled={transferLines.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Yazdır / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
