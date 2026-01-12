import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Settings, Users, Shield, ShieldAlert, ChevronRight, Euro, Star, RefreshCw, CheckCircle } from 'lucide-react';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [isRefreshingReviews, setIsRefreshingReviews] = useState(false);
  const [lastRefreshResult, setLastRefreshResult] = useState<{rating: number; count: number} | null>(null);

  const handleForceRefreshReviews = async () => {
    setIsRefreshingReviews(true);
    setLastRefreshResult(null);
    
    try {
      // First, clear the cache
      const { error: deleteError } = await supabase
        .from('google_reviews_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (deleteError) {
        console.error('Cache clear error:', deleteError);
      }

      // Then fetch fresh reviews
      const { data, error } = await supabase.functions.invoke('get-google-reviews', {
        body: { language: 'en', forceRefresh: true }
      });

      if (error) {
        throw error;
      }

      if (data?.rating && data?.totalReviews) {
        setLastRefreshResult({ rating: data.rating, count: data.totalReviews });
        toast.success(`Google Reviews güncellendi: ${data.rating} ★ (${data.totalReviews} yorum)`);
      } else {
        toast.warning('Değerler alındı ancak veri eksik olabilir');
      }
    } catch (error) {
      console.error('Force refresh error:', error);
      toast.error('Google Reviews güncellenemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsRefreshingReviews(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Ayarlar</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="space-y-4">
          {/* Notification Settings */}
          <NotificationSettingsPanel language="TR" />

          {/* Google Reviews Force Refresh */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Google Reviews
              </CardTitle>
              <CardDescription>
                Google yorumları cache'ini temizle ve güncel değerleri çek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleForceRefreshReviews}
                  disabled={isRefreshingReviews}
                  variant="outline"
                >
                  {isRefreshingReviews ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Refresh
                    </>
                  )}
                </Button>
                
                {lastRefreshResult && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{lastRefreshResult.rating} ★ ({lastRefreshResult.count} yorum)</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Bu işlem Google Places API'den güncel yorum ve puan bilgilerini çeker.
                Cache otomatik olarak 24 saat sonra yenilenir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kullanıcı Yönetimi
              </CardTitle>
              <CardDescription>
                Kullanıcı hesaplarını ve rollerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Kullanıcı yönetimi özellikleri yakında eklenecek. Şu anda şoförleri Şoförler sayfasından yönetebilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/login-attempts')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Giriş Denemeleri
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Başarılı ve başarısız giriş denemelerini görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Rate limiting aktif: 5 dakikada 5 başarısız deneme sonrası hesap 15 dakika kilitlenir.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/price-thresholds')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-amber-600" />
                  Minimum Fiyat Eşikleri
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Otomatik fiyat uyarı limitlerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Araç tiplerine göre minimum fiyat eşikleri belirleyin. Bu eşiklerin altındaki fiyatlar için uyarı gösterilir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Güvenlik
              </CardTitle>
              <CardDescription>
                Güvenlik ve erişim ayarları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Güvenlik ayarları yakında eklenecek.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Genel
              </CardTitle>
              <CardDescription>
                Genel uygulama ayarları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Genel ayarlar yakında eklenecek.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
