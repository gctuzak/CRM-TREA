import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';

import toast from 'react-hot-toast';

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user' as 'admin' | 'manager' | 'user'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchUsers = async (search?: string) => {
    try {
      const params = search ? { search } : {};
      const response = await usersApi.getUsers(params);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.createUser(newUser);
      toast.success('Kullanıcı başarıyla eklendi');
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'user'
      });
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı eklenirken hata oluştu');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await usersApi.updateUser(editingUser.ID, {
        name: editingUser.NAME,
        email: editingUser.EMAIL,
        phone: editingUser.PHONE,
        role: editingUser.ROLE,
        status: editingUser.STATUS
      });
      toast.success('Kullanıcı başarıyla güncellendi');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleStatusChange = async (userId: number, status: 'active' | 'inactive') => {
    try {
      await usersApi.updateUserStatus(userId, status);
      toast.success('Kullanıcı durumu güncellendi');
      await fetchUsers(searchTerm);
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await usersApi.deleteUser(userId);
      toast.success('Kullanıcı başarıyla silindi');
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner-large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Kullanıcılar</h1>
          <p className="text-muted">Sistem kullanıcılarını yönetin</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kullanıcı ara..."
            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {currentUser?.ROLE === 'admin' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Yeni Kullanıcı Ekle
            </button>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Kullanıcı Ekle</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'manager' | 'user'})}
                  className="input"
                >
                  <option value="user">Kullanıcı</option>
                  <option value="manager">Yönetici</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Kullanıcı Düzenle</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                <input
                  type="text"
                  required
                  value={editingUser.NAME}
                  onChange={(e) => setEditingUser({...editingUser, NAME: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                <input
                  type="email"
                  required
                  value={editingUser.EMAIL}
                  onChange={(e) => setEditingUser({...editingUser, EMAIL: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editingUser.PHONE || ''}
                  onChange={(e) => setEditingUser({...editingUser, PHONE: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={editingUser.ROLE}
                  onChange={(e) => setEditingUser({...editingUser, ROLE: e.target.value as 'admin' | 'manager' | 'user'})}
                  className="input"
                >
                  <option value="user">Kullanıcı</option>
                  <option value="manager">Yönetici</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                <select
                  value={editingUser.STATUS}
                  onChange={(e) => setEditingUser({...editingUser, STATUS: e.target.value as 'active' | 'inactive'})}
                  className="input"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Toplam {users.length} kullanıcı {searchTerm && `"${searchTerm}" için`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Giriş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.NAME?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.NAME}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.PHONE}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.EMAIL}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.ROLE)}`}>
                        {user.ROLE === 'admin' ? 'Admin' : 
                         user.ROLE === 'manager' ? 'Yönetici' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.STATUS)}`}>
                        {user.STATUS === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.LAST_LOGIN ? formatDate(user.LAST_LOGIN) : 'Hiç giriş yapmamış'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {currentUser?.ROLE === 'admin' && user.ID !== currentUser.ID ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                            title="Kullanıcıyı düzenle"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleStatusChange(user.ID, user.STATUS === 'active' ? 'inactive' : 'active')}
                            className={`font-medium ${user.STATUS === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={user.STATUS === 'active' ? 'Kullanıcıyı pasifleştir' : 'Kullanıcıyı aktifleştir'}
                          >
                            {user.STATUS === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.ID)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            title="Kullanıcıyı sil"
                          >
                            Sil
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz kullanıcı bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(UsersPage);