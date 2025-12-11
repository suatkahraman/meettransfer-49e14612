import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Settings, Users, Shield } from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();

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
