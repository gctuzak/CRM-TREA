import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System settings (admin only)
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'ITEM YAPI CRM',
    companyEmail: 'info@itemyapi.com',
    companyPhone: '+90 212 XXX XX XX',
    companyAddress: 'İstanbul, Türkiye',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/Istanbul'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.NAME || '',
        email: user.EMAIL || '',
        phone: user.PHONE || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authApi.updateProfile(profileData);
      updateUser(response.user);
      toast.success('Profil başarıyla güncellendi');
    } catch (error) {
      toast.error('Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    
    try {
      await authApi.changePassword(passwordData);
      toast.success('Şifre başarıyla değiştirildi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Şifre değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // System settings API call would go here
      toast.success('Sistem ayarları güncellendi');
    } catch (error) {
      toast.error('Sistem ayarları güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'password', name: 'Şifre', icon: '🔒' },
    ...(user?.ROLE === 'admin' ? [{ id: 'system', name: 'Sistem', icon: '⚙️' }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Ayarlar</h1>
        <p className="text-muted">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Profil Bilgileri</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="input"
                      />
                    </div>

                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="input"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Şifre Değiştir</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mevcut Şifre *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">En az 6 karakter olmalıdır</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre Tekrar *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="input"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* System Tab (Admin Only) */}
          {activeTab === 'system' && user?.ROLE === 'admin' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Şirket Bilgileri</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSystemSettingsUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Şirket Adı
                      </label>
                      <input
                        type="text"
                        value={systemSettings.companyName}
                        onChange={(e) => setSystemSettings({...systemSettings, companyName: e.target.value})}
                        className="input"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-posta
                        </label>
                        <input
                          type="email"
                          value={systemSettings.companyEmail}
                          onChange={(e) => setSystemSettings({...systemSettings, companyEmail: e.target.value})}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={systemSettings.companyPhone}
                          onChange={(e) => setSystemSettings({...systemSettings, companyPhone: e.target.value})}
                          className="input"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres
                      </label>
                      <textarea
                        value={systemSettings.companyAddress}
                        onChange={(e) => setSystemSettings({...systemSettings, companyAddress: e.target.value})}
                        className="input"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Güncelleniyor...' : 'Şirket Bilgilerini Güncelle'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Sistem Ayarları</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Para Birimi
                        </label>
                        <select
                          value={systemSettings.currency}
                          onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                          className="input"
                        >
                          <option value="TRY">TRY (₺)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tarih Formatı
                        </label>
                        <select
                          value={systemSettings.dateFormat}
                          onChange={(e) => setSystemSettings({...systemSettings, dateFormat: e.target.value})}
                          className="input"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Saat Dilimi
                        </label>
                        <select
                          value={systemSettings.timezone}
                          onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                          className="input"
                        >
                          <option value="Europe/Istanbul">İstanbul</option>
                          <option value="Europe/London">Londra</option>
                          <option value="America/New_York">New York</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSystemSettingsUpdate}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Güncelleniyor...' : 'Sistem Ayarlarını Güncelle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);