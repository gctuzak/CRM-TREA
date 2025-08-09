import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

interface Contact {
  ID: number;
  NAME: string;
  CONTROLNAME?: string;
  TITLE?: string;
  JOBTITLE?: string;
  ADDRESS?: string;
  CITY?: string;
  STATE?: string;
  COUNTRY?: string;
  ZIP?: string;
  PARENTCONTACTNAME?: string;
  NOTE?: string;
  ORGANIZATIONTYPEID?: number;
  TYPE?: string[];
  DATETIME?: string;
  emails?: ContactEmail[];
  phones?: ContactPhone[];
}

interface ContactEmail {
  ID: number;
  CONTACTID: number;
  EMAIL: string;
  ORID: number;
  USERID: number;
}

interface ContactPhone {
  ID: number;
  CONTACTID: number;
  NUMBER: string;
  CONTROLNUMBER: string;
  TYPE: string;
  ORID: number;
  USERID: number;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [newContact, setNewContact] = useState({
    NAME: '',
    COMPANY: '',
    TITLE: '',
    DEPARTMENT: '',
    ADDRESS: '',
    CITY: '',
    COUNTRY: '',
    POSTAL_CODE: '',
    WEBSITE: '',
    NOTES: '',
    SOURCE: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchContacts();
  }, []);

  // Sayfa yüklendiğinde otomatik focus
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.setSelectionRange(searchInputRef.current.value.length, searchInputRef.current.value.length);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setHasNextPage(true);
    fetchContacts(1, false, searchTerm);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Önceki timeout'u temizle
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce ile arama yap (300ms bekle)
    const newTimeout = setTimeout(() => {
      setCurrentPage(1);
      setHasNextPage(true);
      fetchContacts(1, false, value);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setHasNextPage(true);
    fetchContacts(1, false, '');
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // 1000px before bottom
        && hasNextPage
        && !loadingMore
        && !loading
      ) {
        fetchContacts(currentPage + 1, true, searchTerm);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, hasNextPage, loadingMore, loading, searchTerm]);

  const fetchContacts = async (page = 1, append = false, search = '') => {
    const wasInputFocused = document.activeElement === searchInputRef.current;
    
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const searchParam = search || searchTerm;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchParam) {
        queryParams.append('search', searchParam);
      }

      const response = await api.get(`/api/contacts?${queryParams.toString()}`);
      console.log('API Response:', response);
      const newContacts = response.contacts || [];
      const pagination = response.pagination;

      if (append) {
        setContacts(prev => [...prev, ...newContacts]);
      } else {
        setContacts(newContacts);
      }

      setHasNextPage(pagination?.hasNextPage || false);
      setCurrentPage(page);
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      
      // Focus'u geri ver
      if (wasInputFocused && searchInputRef.current) {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 0);
      }
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
    setIsEditing(false);
  };

  const handleEditContact = () => {
    setIsEditing(true);
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    
    if (confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) {
      try {
        await api.delete(`/api/contacts/${selectedContact.ID}`);
        setShowDetailModal(false);
        setSelectedContact(null);
        // Refresh the list
        setCurrentPage(1);
        setHasNextPage(true);
        fetchContacts(1, false, searchTerm);
      } catch (err) {
        setError('Kişi silinirken hata oluştu');
      }
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      const response = await api.put(`/api/contacts/${selectedContact.ID}`, {
        name: selectedContact.NAME,
        jobtitle: selectedContact.JOBTITLE,
        address: selectedContact.ADDRESS,
        city: selectedContact.CITY,
        state: selectedContact.STATE,
        country: selectedContact.COUNTRY,
        zip: selectedContact.ZIP,
        note: selectedContact.NOTE
      });

      if (response.status === 200) {
        setIsEditing(false);
        // Refresh the list
        setCurrentPage(1);
        setHasNextPage(true);
        fetchContacts(1, false, searchTerm);
      }
    } catch (err) {
      setError('Kişi güncellenirken hata oluştu');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Authentication disabled - no token needed
      // Doğru alan adlarını kullanarak API'ye gönder
      const contactData = {
        name: newContact.NAME,
        company: newContact.COMPANY,
        title: newContact.TITLE,
        department: newContact.DEPARTMENT,
        address: newContact.ADDRESS,
        city: newContact.CITY,
        country: newContact.COUNTRY,
        postalCode: newContact.POSTAL_CODE,
        website: newContact.WEBSITE,
        notes: newContact.NOTES,
        source: newContact.SOURCE
      };
      const response = await api.post('/api/contacts', contactData);
      if (response.status === 201) {
        setShowAddForm(false);
        setNewContact({
          NAME: '',
          COMPANY: '',
          TITLE: '',
          DEPARTMENT: '',
          ADDRESS: '',
          CITY: '',
          COUNTRY: '',
          POSTAL_CODE: '',
          WEBSITE: '',
          NOTES: '',
          SOURCE: ''
        });
        // Reset to first page and reload
        setCurrentPage(1);
        setHasNextPage(true);
        fetchContacts(1, false, searchTerm);
      } else {
        setError('Kontak eklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kontaklar</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Yeni Kontak Ekle
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="İsim, şirket, pozisyon veya şehir ile arama yapın..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                tabIndex={1}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Ara
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Temizle
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add Contact Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Yeni Kontak Ekle</h2>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                    <input
                      type="text"
                      required
                      value={newContact.NAME}
                      onChange={(e) => setNewContact({...newContact, NAME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şirket</label>
                    <input
                      type="text"
                      value={newContact.COMPANY}
                      onChange={(e) => setNewContact({...newContact, COMPANY: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                    <input
                      type="text"
                      value={newContact.TITLE}
                      onChange={(e) => setNewContact({...newContact, TITLE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
                    <input
                      type="text"
                      value={newContact.DEPARTMENT}
                      onChange={(e) => setNewContact({...newContact, DEPARTMENT: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                    <input
                      type="text"
                      value={newContact.CITY}
                      onChange={(e) => setNewContact({...newContact, CITY: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={newContact.ADDRESS}
                    onChange={(e) => setNewContact({...newContact, ADDRESS: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Detail Modal */}
        {showDetailModal && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Kişi Düzenle' : 'Kişi Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedContact(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isEditing ? (
                /* Edit Form */
                <form onSubmit={handleUpdateContact} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İsim *</label>
                      <input
                        type="text"
                        required
                        value={selectedContact.NAME}
                        onChange={(e) => setSelectedContact({...selectedContact, NAME: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
                      <input
                        type="text"
                        value={selectedContact.JOBTITLE || ''}
                        onChange={(e) => setSelectedContact({...selectedContact, JOBTITLE: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea
                      value={selectedContact.ADDRESS || ''}
                      onChange={(e) => setSelectedContact({...selectedContact, ADDRESS: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                      <input
                        type="text"
                        value={selectedContact.CITY || ''}
                        onChange={(e) => setSelectedContact({...selectedContact, CITY: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İlçe/Bölge</label>
                      <input
                        type="text"
                        value={selectedContact.STATE || ''}
                        onChange={(e) => setSelectedContact({...selectedContact, STATE: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                      <input
                        type="text"
                        value={selectedContact.COUNTRY || ''}
                        onChange={(e) => setSelectedContact({...selectedContact, COUNTRY: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                    <textarea
                      value={selectedContact.NOTE || ''}
                      onChange={(e) => setSelectedContact({...selectedContact, NOTE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Güncelle
                    </button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Temel Bilgiler</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">İsim:</span>
                          <p className="text-gray-900">{selectedContact.NAME}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Tip:</span>
                          <p className="text-gray-900">
                            {selectedContact.TYPE?.includes('P') ? 'Kişi' : 'Şirket'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Bağlı Şirket:</span>
                          <p className="text-gray-900">{selectedContact.PARENTCONTACTNAME || '-'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Pozisyon:</span>
                          <p className="text-gray-900">{selectedContact.JOBTITLE || selectedContact.TITLE || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">İletişim Bilgileri</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">E-posta:</span>
                          {selectedContact.emails && selectedContact.emails.length > 0 ? (
                            <div className="space-y-1">
                              {selectedContact.emails.map((email, index) => (
                                <p key={index} className="text-gray-900">{email.EMAIL}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">-</p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Telefon:</span>
                          {selectedContact.phones && selectedContact.phones.length > 0 ? (
                            <div className="space-y-1">
                              {selectedContact.phones.map((phone, index) => (
                                <p key={index} className="text-gray-900">{phone.NUMBER}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Adres Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Adres:</span>
                        <p className="text-gray-900">{selectedContact.ADDRESS || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Şehir:</span>
                        <p className="text-gray-900">{selectedContact.CITY || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">İlçe/Bölge:</span>
                        <p className="text-gray-900">{selectedContact.STATE || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Ülke:</span>
                        <p className="text-gray-900">{selectedContact.COUNTRY || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Posta Kodu:</span>
                        <p className="text-gray-900">{selectedContact.ZIP || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedContact.NOTE && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Notlar</h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedContact.NOTE}</p>
                    </div>
                  )}

                  {/* System Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sistem Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 text-gray-900">{selectedContact.ID}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Organizasyon Tipi ID:</span>
                        <span className="ml-2 text-gray-900">{selectedContact.ORGANIZATIONTYPEID || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Oluşturulma Tarihi:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedContact.DATETIME ? new Date(selectedContact.DATETIME).toLocaleString('tr-TR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                      onClick={handleEditContact}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={handleDeleteContact}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bağlı Şirket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozisyon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasyon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(contacts) && contacts.map((contact) => (
                <tr 
                  key={contact.ID} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleContactClick(contact)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.NAME}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.TYPE?.includes('P') ? 'Kişi' : 'Şirket'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.PARENTCONTACTNAME || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.JOBTITLE || contact.TITLE || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.CITY || '-'}</div>
                    <div className="text-sm text-gray-500">{contact.STATE || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.emails && contact.emails.length > 0 ? contact.emails[0].EMAIL : '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.phones && contact.phones.length > 0 ? contact.phones[0].NUMBER : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.DATETIME ? new Date(contact.DATETIME).toLocaleDateString('tr-TR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {Array.isArray(contacts) && contacts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Henüz kontak bulunmuyor.
            </div>
          )}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Daha fazla kayıt yükleniyor...</span>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && !loadingMore && contacts.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={() => fetchContacts(currentPage + 1, true, searchTerm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Daha Fazla Yükle
            </button>
          </div>
        )}

        {/* End of Results Indicator */}
        {!hasNextPage && contacts.length > 0 && (
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">Tüm kayıtlar yüklendi ({contacts.length} kayıt)</span>
          </div>
        )}
    </div>
  );
}