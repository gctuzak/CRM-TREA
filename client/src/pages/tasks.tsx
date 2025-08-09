import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Task {
  ID: number;
  NOTE?: string;
  DATETIMEDUE?: string;
  TYPEID: number;
  STATUS: string;
  USERID: number;
  CONTACTID?: number;
  OPPORTUNITYID?: number;
  DATETIME?: string;
  ORID: number;
  contact?: {
    ID: number;
    NAME: string;
  };
  opportunity?: {
    ID: number;
    NAME: string;
  };
  taskType?: {
    ID: number;
    NAME: string;
  };
  user?: {
    ID: number;
    NAME: string;
  };
}

interface User {
  ID: number;
  NAME: string;
  EMAIL?: string;
  ROLE?: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newTask, setNewTask] = useState({
    NOTE: '',
    STATUS: 'New',
    TYPEID: '',
    CONTACTID: '',
    OPPORTUNITYID: '',
    DATETIME: new Date().toISOString().split('T')[0],
    DATETIMEDUE: '',
    USERID: ''
  });
  const [taskTypes, setTaskTypes] = useState<{ID: number, NAME: string}[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
    fetchTaskTypes();
    fetchUsers();
  }, []);

  const fetchTaskTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/types`);
      if (response.ok) {
        const data = await response.json();
        setTaskTypes(data.taskTypes || []);
      }
    } catch (err) {
      console.error('Task types yüklenirken hata:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  };

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
        fetchTasks(currentPage + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, hasNextPage, loadingMore, loading]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setIsEditing(false);
  };

  const handleEditTask = () => {
    setIsEditing(true);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${selectedTask.ID}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          setShowDetailModal(false);
          setSelectedTask(null);
          setCurrentPage(1);
          setHasNextPage(true);
          fetchTasks(1, false);
        }
      } catch (err) {
        setError('Görev silinirken hata oluştu');
      }
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${selectedTask.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: selectedTask.NOTE,
          status: selectedTask.STATUS,
          datetimedue: selectedTask.DATETIMEDUE
        })
      });

      if (response.ok) {
        setIsEditing(false);
        setCurrentPage(1);
        setHasNextPage(true);
        fetchTasks(1, false);
      }
    } catch (err) {
      setError('Görev güncellenirken hata oluştu');
    }
  };

  const fetchTasks = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks?page=${page}&limit=20`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tasks API response:', data);
        const newTasks = data.tasks || [];
        const pagination = data.pagination;

        if (append) {
          setTasks(prev => [...prev, ...newTasks]);
        } else {
          setTasks(newTasks);
        }

        setHasNextPage(pagination?.hasNextPage || false);
        setCurrentPage(page);
      } else {
        setError('Görevler yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        note: newTask.NOTE,
        status: newTask.STATUS,
        typeId: parseInt(newTask.TYPEID),
        userId: parseInt(newTask.USERID),
        datetime: newTask.DATETIME ? new Date(newTask.DATETIME).toISOString() : new Date().toISOString(),
        datetimeDue: newTask.DATETIMEDUE ? new Date(newTask.DATETIMEDUE).toISOString() : null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewTask({
          NOTE: '',
          DATETIMEDUE: '',
          DATETIME: new Date().toISOString().slice(0, 16),
          STATUS: 'New',
          TYPEID: '',
          USERID: ''
        });
        setCurrentPage(1);
        setHasNextPage(true);
        fetchTasks(1, false);
      } else {
        setError('Görev eklenirken hata oluştu');
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
          <h1 className="text-3xl font-bold text-gray-800">Görevler</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Yeni Görev Ekle
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add Task Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Yeni Görev Ekle</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Görev Açıklaması *</label>
                  <textarea
                    required
                    value={newTask.NOTE}
                    onChange={(e) => setNewTask({...newTask, NOTE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Görev açıklamasını girin..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Kullanıcı *</label>
                    <select
                      required
                      value={newTask.USERID}
                      onChange={(e) => setNewTask({...newTask, USERID: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kullanıcı seçin...</option>
                      {users.map(user => (
                        <option key={user.ID} value={user.ID}>
                          {user.NAME} {user.EMAIL && `(${user.EMAIL})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      value={newTask.STATUS}
                      onChange={(e) => setNewTask({...newTask, STATUS: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="New">Yeni</option>
                      <option value="In progress">Devam Ediyor</option>
                      <option value="Completed">Tamamlandı</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTask.DATETIME}
                      onChange={(e) => setNewTask({...newTask, DATETIME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input
                      type="datetime-local"
                      value={newTask.DATETIMEDUE}
                      onChange={(e) => setNewTask({...newTask, DATETIMEDUE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Görev Tipi *</label>
                  <select
                    required
                    value={newTask.TYPEID}
                    onChange={(e) => setNewTask({...newTask, TYPEID: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Görev tipi seçin...</option>
                    {taskTypes.map(type => (
                      <option key={type.ID} value={type.ID}>
                        {type.NAME}
                      </option>
                    ))}
                  </select>
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

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görev & İlişkiler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(tasks) && tasks.map((task) => (
                <tr 
                  key={task.ID} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <div className="font-medium text-blue-600 mb-1">
                        📋 {task.taskType?.NAME || 'Görev Tipi Belirtilmemiş'}
                      </div>
                      <div className="text-gray-600 text-xs truncate">
                        {task.NOTE ? 
                          task.NOTE.length > 80 ? 
                            task.NOTE.substring(0, 80) + '...' : 
                            task.NOTE 
                          : 'Detay açıklama yok'
                        }
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {task.user && (
                          <div className="text-xs text-blue-600">
                            👨‍💼 {task.user.NAME}
                          </div>
                        )}
                        {task.contact && (
                          <div className="text-xs text-gray-500">
                            👤 {task.contact.NAME}
                          </div>
                        )}
                        {task.opportunity && (
                          <div className="text-xs text-green-600">
                            🎯 {task.opportunity.NAME}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {task.DATETIMEDUE ? new Date(task.DATETIMEDUE).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {task.DATETIME ? new Date(task.DATETIME).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      task.STATUS === 'Completed' ? 'bg-green-100 text-green-800' :
                      task.STATUS === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.STATUS === 'Completed' ? 'Tamamlandı' :
                       task.STATUS === 'In progress' ? 'Devam Ediyor' : 'Yeni'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {Array.isArray(tasks) && tasks.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Henüz görev bulunmuyor.
            </div>
          )}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Daha fazla görev yükleniyor...</span>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && !loadingMore && tasks.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={() => fetchTasks(currentPage + 1, true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Daha Fazla Yükle
            </button>
          </div>
        )}

        {/* End of Results Indicator */}
        {!hasNextPage && tasks.length > 0 && (
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">Tüm görevler yüklendi ({tasks.length} görev)</span>
          </div>
        )}

        {/* Task Detail Modal */}
        {showDetailModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Görev Düzenle' : 'Görev Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTask(null);
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
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Görev Açıklaması</label>
                    <textarea
                      value={selectedTask.NOTE || ''}
                      onChange={(e) => setSelectedTask({...selectedTask, NOTE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                      <select
                        value={selectedTask.STATUS}
                        onChange={(e) => setSelectedTask({...selectedTask, STATUS: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="New">Yeni</option>
                        <option value="In progress">Devam Ediyor</option>
                        <option value="Completed">Tamamlandı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                      <input
                        type="datetime-local"
                        value={selectedTask.DATETIMEDUE ? new Date(selectedTask.DATETIMEDUE).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setSelectedTask({...selectedTask, DATETIMEDUE: e.target.value ? new Date(e.target.value).toISOString() : null})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
                          <span className="text-sm font-medium text-gray-500">Görev Açıklaması:</span>
                          <p className="text-gray-900">{selectedTask.NOTE || 'Açıklama yok'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Durum:</span>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedTask.STATUS === 'Completed' ? 'bg-green-100 text-green-800' :
                            selectedTask.STATUS === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedTask.STATUS === 'Completed' ? 'Tamamlandı' :
                             selectedTask.STATUS === 'In progress' ? 'Devam Ediyor' : 'Yeni'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Tip ID:</span>
                          <p className="text-gray-900">{selectedTask.TYPEID || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Tarih Bilgileri</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Oluşturulma Tarihi:</span>
                          <p className="text-gray-900">
                            {selectedTask.DATETIME ? new Date(selectedTask.DATETIME).toLocaleString('tr-TR') : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Bitiş Tarihi:</span>
                          <p className="text-gray-900">
                            {selectedTask.DATETIMEDUE ? new Date(selectedTask.DATETIMEDUE).toLocaleString('tr-TR') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">İlişkili Bilgiler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Kontak ID:</span>
                        <p className="text-gray-900">{selectedTask.CONTACTID || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fırsat ID:</span>
                        <p className="text-gray-900">{selectedTask.OPPORTUNITYID || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Kullanıcı ID:</span>
                        <p className="text-gray-900">{selectedTask.USERID}</p>
                      </div>
                    </div>
                  </div>

                  {/* System Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sistem Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 text-gray-900">{selectedTask.ID}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ORID:</span>
                        <span className="ml-2 text-gray-900">{selectedTask.ORID}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                      onClick={handleEditTask}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={handleDeleteTask}
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
      </div>
    );
}