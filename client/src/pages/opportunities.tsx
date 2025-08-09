import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Opportunity {
  ID: number;
  NAME: string;
  NOTE?: string;
  FINALTOTAL?: string;
  CURRENCY?: string;
  STATUSTYPEID: number;
  CONTACTID?: number;
  USERID: number;
  DATETIME?: string;
  OWNERUSERID?: number;
  ORID: number;
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    TITLE: '',
    DESCRIPTION: '',
    VALUE: '',
    CURRENCY: 'TRY',
    STAGE: 'lead',
    PROBABILITY: '',
    EXPECTED_CLOSE_DATE: '',
    CONTACT_ID: '',
    NOTES: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && hasNextPage
        && !loadingMore
        && !loading
      ) {
        fetchOpportunities(currentPage + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, hasNextPage, loadingMore, loading]);

  const fetchOpportunities = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/opportunities?page=${page}&limit=20`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Opportunities API response:', data);
        const newOpportunities = data.opportunities || [];
        const pagination = data.pagination;

        if (append) {
          setOpportunities(prev => [...prev, ...newOpportunities]);
        } else {
          setOpportunities(newOpportunities);
        }

        setHasNextPage(pagination?.hasNextPage || false);
        setCurrentPage(page);
      } else {
        setError('Fırsatlar yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDetailModal(true);
    setIsEditing(false);
  };

  const handleEditOpportunity = () => {
    setIsEditing(true);
  };

  const handleDeleteOpportunity = async () => {
    if (!selectedOpportunity) return;
    
    if (confirm('Bu fırsatı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/opportunities/${selectedOpportunity.ID}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          setShowDetailModal(false);
          setSelectedOpportunity(null);
          setCurrentPage(1);
          setHasNextPage(true);
          fetchOpportunities(1, false);
        }
      } catch (err) {
        setError('Fırsat silinirken hata oluştu');
      }
    }
  };

  const handleUpdateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/opportunities/${selectedOpportunity.ID}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          NAME: selectedOpportunity.NAME,
          NOTE: selectedOpportunity.NOTE,
          FINALTOTAL: selectedOpportunity.FINALTOTAL,
          CURRENCY: selectedOpportunity.CURRENCY,
          STATUSTYPEID: selectedOpportunity.STATUSTYPEID,
          CONTACTID: selectedOpportunity.CONTACTID,
          USERID: selectedOpportunity.USERID,
          OWNERUSERID: selectedOpportunity.OWNERUSERID,
          DATETIME: selectedOpportunity.DATETIME,
          ORID: selectedOpportunity.ORID
        })
      });

      if (response.ok) {
        setIsEditing(false);
        setShowDetailModal(false);
        setSelectedOpportunity(null);
        setCurrentPage(1);
        setHasNextPage(true);
        fetchOpportunities(1, false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Fırsat güncellenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    }
  };

  const handleAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const opportunityData = {
        ...newOpportunity,
        VALUE: newOpportunity.VALUE ? parseFloat(newOpportunity.VALUE) : null,
        PROBABILITY: newOpportunity.PROBABILITY ? parseInt(newOpportunity.PROBABILITY) : null,
        CONTACT_ID: newOpportunity.CONTACT_ID ? parseInt(newOpportunity.CONTACT_ID) : null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(opportunityData)
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewOpportunity({
          TITLE: '',
          DESCRIPTION: '',
          VALUE: '',
          CURRENCY: 'TRY',
          STAGE: 'lead',
          PROBABILITY: '',
          EXPECTED_CLOSE_DATE: '',
          CONTACT_ID: '',
          NOTES: ''
        });
        fetchOpportunities();
      } else {
        setError('Fırsat eklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    }
  };

  const updateOpportunityStage = async (opportunityId: number, newStage: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ STAGE: newStage })
      });

      if (response.ok) {
        fetchOpportunities();
      } else {
        setError('Fırsat aşaması güncellenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageFromId = (statusTypeId: number) => {
    switch (statusTypeId) {
      case 0: return 'Yeni';
      case 1: return 'Prospecting';
      case 2: return 'Qualification';
      case 3: return 'Proposal';
      case 7: return 'In Progress';
      case 10: return 'Negotiation';
      case 11: return 'Closed Won';
      case 12: return 'Closed Lost';
      default: return `Status ${statusTypeId}`;
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
          <h1 className="text-3xl font-bold text-gray-800">Fırsatlar</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Yeni Fırsat Ekle
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add Opportunity Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Yeni Fırsat Ekle</h2>
              <form onSubmit={handleAddOpportunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                  <input
                    type="text"
                    required
                    value={newOpportunity.TITLE}
                    onChange={(e) => setNewOpportunity({...newOpportunity, TITLE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={newOpportunity.DESCRIPTION}
                    onChange={(e) => setNewOpportunity({...newOpportunity, DESCRIPTION: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Değer</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newOpportunity.VALUE}
                      onChange={(e) => setNewOpportunity({...newOpportunity, VALUE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                    <select
                      value={newOpportunity.CURRENCY}
                      onChange={(e) => setNewOpportunity({...newOpportunity, CURRENCY: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aşama</label>
                    <select
                      value={newOpportunity.STAGE}
                      onChange={(e) => setNewOpportunity({...newOpportunity, STAGE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lead">Potansiyel</option>
                      <option value="qualified">Nitelikli</option>
                      <option value="proposal">Teklif</option>
                      <option value="negotiation">Müzakere</option>
                      <option value="closed_won">Kazanıldı</option>
                      <option value="closed_lost">Kaybedildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Olasılık (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newOpportunity.PROBABILITY}
                      onChange={(e) => setNewOpportunity({...newOpportunity, PROBABILITY: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Kapanış Tarihi</label>
                  <input
                    type="date"
                    value={newOpportunity.EXPECTED_CLOSE_DATE}
                    onChange={(e) => setNewOpportunity({...newOpportunity, EXPECTED_CLOSE_DATE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={newOpportunity.NOTES}
                    onChange={(e) => setNewOpportunity({...newOpportunity, NOTES: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
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

        {/* Detail Modal */}
        {showDetailModal && selectedOpportunity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Fırsat Düzenle' : 'Fırsat Detayları'}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateOpportunity} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                      <input
                        type="text"
                        value={selectedOpportunity.ID}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ORID</label>
                      <input
                        type="number"
                        value={selectedOpportunity.ORID || ''}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, ORID: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fırsat Adı *</label>
                    <input
                      type="text"
                      required
                      value={selectedOpportunity.NAME || ''}
                      onChange={(e) => setSelectedOpportunity({...selectedOpportunity, NAME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                    <textarea
                      value={selectedOpportunity.NOTE || ''}
                      onChange={(e) => setSelectedOpportunity({...selectedOpportunity, NOTE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Final Toplam</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedOpportunity.FINALTOTAL || ''}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, FINALTOTAL: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                      <select
                        value={selectedOpportunity.CURRENCY || 'TRY'}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, CURRENCY: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum Tipi ID</label>
                      <select
                        value={selectedOpportunity.STATUSTYPEID}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, STATUSTYPEID: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Yeni</option>
                        <option value={1}>Prospecting</option>
                        <option value={2}>Qualification</option>
                        <option value={3}>Proposal</option>
                        <option value={7}>In Progress</option>
                        <option value={10}>Negotiation</option>
                        <option value={11}>Closed Won</option>
                        <option value={12}>Closed Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kontak ID</label>
                      <input
                        type="number"
                        value={selectedOpportunity.CONTACTID || ''}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, CONTACTID: parseInt(e.target.value) || undefined})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı ID</label>
                      <input
                        type="number"
                        value={selectedOpportunity.USERID}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, USERID: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sahip Kullanıcı ID</label>
                      <input
                        type="number"
                        value={selectedOpportunity.OWNERUSERID || ''}
                        onChange={(e) => setSelectedOpportunity({...selectedOpportunity, OWNERUSERID: parseInt(e.target.value) || undefined})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="datetime-local"
                      value={selectedOpportunity.DATETIME ? new Date(selectedOpportunity.DATETIME).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setSelectedOpportunity({...selectedOpportunity, DATETIME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteOpportunity}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Sil
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.ID}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ORID</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.ORID || '-'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fırsat Adı</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.NAME}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">{selectedOpportunity.NOTE || '-'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Final Toplam</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {selectedOpportunity.FINALTOTAL ? `${parseFloat(selectedOpportunity.FINALTOTAL).toLocaleString()} ${selectedOpportunity.CURRENCY || 'TRY'}` : '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.CURRENCY || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(getStageFromId(selectedOpportunity.STATUSTYPEID))}`}>
                          {getStageFromId(selectedOpportunity.STATUSTYPEID)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kontak ID</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.CONTACTID || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı ID</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.USERID}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sahip Kullanıcı ID</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{selectedOpportunity.OWNERUSERID || '-'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      {selectedOpportunity.DATETIME ? new Date(selectedOpportunity.DATETIME).toLocaleString('tr-TR') : '-'}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Kapat
                    </button>
                    <button
                      onClick={handleEditOpportunity}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opportunities List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Değer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aşama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Olasılık</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kapanış Tarihi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(opportunities) && opportunities.map((opportunity) => (
                <tr 
                  key={opportunity.ID} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpportunityClick(opportunity)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{opportunity.NAME}</div>
                    <div className="text-sm text-gray-500">{opportunity.NOTE}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {opportunity.FINALTOTAL ? `${parseFloat(opportunity.FINALTOTAL).toLocaleString()} ${opportunity.CURRENCY || 'TRY'}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(getStageFromId(opportunity.STATUSTYPEID))}`}>
                      {getStageFromId(opportunity.STATUSTYPEID)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {opportunity.DATETIME ? new Date(opportunity.DATETIME).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        Düzenle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {Array.isArray(opportunities) && opportunities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz fırsat bulunmuyor.
            </div>
          )}
        </div>
      </div>
    );
}