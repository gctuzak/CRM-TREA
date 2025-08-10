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

  const fetchTasks = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const response = await fetch(`/api/tasks?page=${page}&limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        if (append) {
          setTasks(prev => [...prev, ...data.tasks]);
        } else {
          setTasks(data.tasks || []);
        }
        setHasNextPage(data.pagination?.hasNextPage || false);
        setCurrentPage(page);
      } else {
        setError(data.message || 'Görevler yüklenirken hata oluştu');
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError('Görevler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      const response = await fetch('/api/tasks/types');
      const data = await response.json();
      if (response.ok) {
        setTaskTypes(data.taskTypes || []);
      }
    } catch (err) {
      console.error('Fetch task types error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: newTask.NOTE,
          status: newTask.STATUS,
          typeId: parseInt(newTask.TYPEID) || 0,
          contactId: newTask.CONTACTID ? parseInt(newTask.CONTACTID) : null,
          opportunityId: parseInt(newTask.OPPORTUNITYID) || 0,
          datetime: newTask.DATETIME,
          datetimeDue: newTask.DATETIMEDUE || null,
          userId: parseInt(newTask.USERID) || 1
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowAddForm(false);
        setNewTask({
          NOTE: '',
          STATUS: 'New',
          TYPEID: '',
          CONTACTID: '',
          OPPORTUNITYID: '',
          DATETIME: new Date().toISOString().split('T')[0],
          DATETIMEDUE: '',
          USERID: ''
        });
        fetchTasks(); // Refresh the list
      } else {
        setError(data.message || 'Görev eklenirken hata oluştu');
      }
    } catch (err) {
      console.error('Add task error:', err);
      setError('Görev eklenirken hata oluştu');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleEditTask = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTask) return;
    
    try {
      const response = await fetch(`/api/tasks/${selectedTask.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: selectedTask.NOTE,
          status: selectedTask.STATUS,
          typeId: selectedTask.TYPEID,
          contactId: selectedTask.CONTACTID,
          opportunityId: selectedTask.OPPORTUNITYID,
          datetimeDue: selectedTask.DATETIMEDUE,
          userId: selectedTask.USERID
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsEditing(false);
        fetchTasks(); // Refresh the list
      } else {
        setError(data.message || 'Görev güncellenirken hata oluştu');
      }
    } catch (err) {
      console.error('Update task error:', err);
      setError('Görev güncellenirken hata oluştu');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowDetailModal(false);
        fetchTasks(); // Refresh the list
      } else {
        setError(data.message || 'Görev silinirken hata oluştu');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      setError('Görev silinirken hata oluştu');
    }
  };

  const loadMoreTasks = () => {
    if (hasNextPage && !loadingMore) {
      fetchTasks(currentPage + 1, true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'New':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'Tamamlandı';
      case 'In progress':
        return 'Devam Ediyor';
      case 'New':
        return 'Yeni';
      default:
        return status;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Görevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Görevler</h1>
              <p className="mt-2 text-gray-600">Tüm görevlerinizi buradan yönetebilirsiniz</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Yeni Görev
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Görev Detayları
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bitiş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
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
                            💼 {task.opportunity.NAME}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(task.STATUS)
                    }`}>
                      {getStatusText(task.STATUS)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.DATETIMEDUE ? 
                      new Date(task.DATETIMEDUE).toLocaleDateString('tr-TR') : 
                      'Belirtilmemiş'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Görüntüle
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.ID);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="px-6 py-4 border-t border-gray-200 text-center">
              <button
                onClick={loadMoreTasks}
                disabled={loadingMore}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && (!Array.isArray(tasks) || tasks.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz görev yok</h3>
              <p className="text-gray-500 mb-4">İlk görevinizi oluşturmak için yukarıdaki butonu kullanın.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yeni Görev Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Yeni Görev Ekle</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görev Açıklaması
                  </label>
                  <textarea
                    value={newTask.NOTE}
                    onChange={(e) => setNewTask({...newTask, NOTE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Görev açıklamasını girin..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durum
                    </label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Görev Tipi
                    </label>
                    <select
                      value={newTask.TYPEID}
                      onChange={(e) => setNewTask({...newTask, TYPEID: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seçiniz</option>
                      {taskTypes.map(type => (
                        <option key={type.ID} value={type.ID}>{type.NAME}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kullanıcı
                    </label>
                    <select
                      value={newTask.USERID}
                      onChange={(e) => setNewTask({...newTask, USERID: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seçiniz</option>
                      {users.map(user => (
                        <option key={user.ID} value={user.ID}>{user.NAME}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={newTask.DATETIMEDUE}
                      onChange={(e) => setNewTask({...newTask, DATETIMEDUE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Görev Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Görev Detayları</h3>
                <div className="flex space-x-2">
                  {!isEditing && (
                    <button
                      onClick={handleEditTask}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Düzenle
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Kaydet
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setIsEditing(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
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
                         selectedTask.STATUS === 'In progress' ? 'Devam Ediyor' :
                         selectedTask.STATUS === 'New' ? 'Yeni' : selectedTask.STATUS}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Görev Tipi:</span>
                      <p className="text-gray-900">{selectedTask.taskType?.NAME || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tarih Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Oluşturulma Tarihi:</span>
                      <p className="text-gray-900">
                        {selectedTask.DATETIME ? 
                          new Date(selectedTask.DATETIME).toLocaleString('tr-TR') : 
                          'Belirtilmemiş'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Bitiş Tarihi:</span>
                      <p className="text-gray-900">
                        {selectedTask.DATETIMEDUE ? 
                          new Date(selectedTask.DATETIMEDUE).toLocaleString('tr-TR') : 
                          'Belirtilmemiş'
                        }
                      </p>
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
                      <span className="text-sm font-medium text-gray-500">Müşteri Temsilcisi:</span>
                      <p className="text-gray-900">{selectedTask.user?.NAME || `ID: ${selectedTask.USERID}`}</p>
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

                {/* Related Records */}
                {(selectedTask.contact || selectedTask.opportunity) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">İlişkili Kayıtlar</h3>
                    <div className="space-y-2">
                      {selectedTask.contact && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Kontak:</span>
                          <button
                            onClick={() => router.push(`/contacts/${selectedTask.contact?.ID}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            {selectedTask.contact.NAME}
                          </button>
                        </div>
                      )}
                      {selectedTask.opportunity && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Fırsat:</span>
                          <button
                            onClick={() => router.push(`/opportunities/${selectedTask.opportunity?.ID}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            {selectedTask.opportunity.NAME}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}