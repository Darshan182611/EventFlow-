import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { FaUsers, FaUserShield, FaSearch } from 'react-icons/fa';

const ROLES = ['user', 'admin', 'volunteer', 'accountant', 'event_manager'];
const ROLE_COLORS = {
    admin: 'bg-red-100 text-red-700', event_manager: 'bg-blue-100 text-blue-700',
    volunteer: 'bg-green-100 text-green-700', accountant: 'bg-purple-100 text-purple-700',
    user: 'bg-gray-100 text-gray-700'
};

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/'); return; }
        fetchUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try { const { data } = await api.get('/users'); setUsers(data); } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const changeRole = async (userId, newRole) => {
        try { await api.put(`/users/${userId}/role`, { role: newRole }); fetchUsers(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3"><FaUserShield /> User Management</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 transition text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {/* Role Stats */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {ROLES.map(r => (
                        <span key={r} className={`${ROLE_COLORS[r]} px-3 py-1 rounded-full text-xs font-bold capitalize`}>
                            {r.replace('_', ' ')}: {users.filter(u => u.role === r).length}
                        </span>
                    ))}
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Name</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Email</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Type</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Role</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="py-3 px-4 font-semibold">{u.name}</td>
                                    <td className="py-3 px-4 text-gray-500">{u.email}</td>
                                    <td className="py-3 px-4 capitalize text-gray-500">{u.userType || 'general'}</td>
                                    <td className="py-3 px-4"><span className={`${ROLE_COLORS[u.role]} px-2 py-0.5 rounded text-xs font-bold capitalize`}>{u.role.replace('_', ' ')}</span></td>
                                    <td className="py-3 px-4">
                                        <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="px-2 py-1 border rounded text-xs">
                                            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
