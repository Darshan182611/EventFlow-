import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaCheck, FaTimes, FaChartBar, FaQrcode, FaTicketAlt, FaCertificate, FaUsers, FaCalendarAlt } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Event form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', date: '', location: '', category: 'Tech', totalSeats: 100, ticketPrice: 0, image: '' });
    const [tiers, setTiers] = useState([]);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'event_manager' && user.role !== 'accountant')) {
            navigate('/');
            return;
        }
        fetchAll();
    }, [user]);

    const fetchAll = async () => {
        try {
            const [evRes, bkRes] = await Promise.all([api.get('/events'), api.get('/bookings/my')]);
            setEvents(evRes.data);
            setBookings(bkRes.data);
            try {
                const stRes = await api.get('/analytics/overview');
                setStats(stRes.data);
            } catch (e) { }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const addTier = () => setTiers([...tiers, { name: 'General', price: 0, totalSeats: 50, description: '' }]);
    const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i));
    const updateTier = (i, field, val) => { const t = [...tiers]; t[i][field] = val; setTiers(t); };

    const createEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', { ...form, ticketTiers: tiers.length > 0 ? tiers : undefined });
            setShowForm(false);
            setForm({ title: '', description: '', date: '', location: '', category: 'Tech', totalSeats: 100, ticketPrice: 0, image: '' });
            setTiers([]);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const confirmBooking = async (id) => {
        try { await api.put(`/bookings/${id}/confirm`, { paymentStatus: 'paid' }); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const cancelBooking = async (id) => {
        try { await api.delete(`/bookings/${id}`); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const deleteEvent = async (id) => {
        if (window.confirm('Delete this event?')) {
            try { await api.delete(`/events/${id}`); fetchAll(); } catch (err) { alert('Error'); }
        }
    };

    const generateCerts = async (eventId) => {
        try {
            const { data } = await api.post(`/certificates/generate/${eventId}`);
            alert(data.message);
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
        { id: 'events', label: 'Events', icon: <FaCalendarAlt /> },
        { id: 'bookings', label: 'Bookings', icon: <FaTicketAlt /> },
    ];
    if (user.role === 'admin') tabs.push({ id: 'users', label: 'Users', icon: <FaUsers /> });

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Command Center</h1>
                    <p className="text-gray-500 text-sm mt-1">Role: <span className="font-bold capitalize text-gray-700">{user.role.replace('_', ' ')}</span></p>
                </div>
                <div className="flex gap-3">
                    <Link to="/check-in" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-black transition"><FaQrcode /> Check-in Scanner</Link>
                    {user.role === 'admin' && <Link to="/users" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-300 transition"><FaUsers /> Manage Users</Link>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Events', val: stats.totalEvents !== undefined ? stats.totalEvents : events.length, color: 'bg-blue-50 text-blue-700', action: () => setActiveTab('events') },
                            { label: 'Total Bookings', val: stats.totalBookings !== undefined ? stats.totalBookings : bookings.length, color: 'bg-green-50 text-green-700', action: () => setActiveTab('bookings') },
                            { label: 'Pending', val: stats.pendingBookings !== undefined ? stats.pendingBookings : pendingBookings.length, color: 'bg-yellow-50 text-yellow-700', action: () => setActiveTab('bookings') },
                            { label: 'Revenue', val: `₹${stats.totalRevenue !== undefined ? stats.totalRevenue : totalRevenue}`, color: 'bg-purple-50 text-purple-700' },
                        ].map((s, i) => (
                            <div key={i} onClick={s.action} className={`${s.color} p-5 rounded-xl ${s.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{s.label}</p>
                                <p className="text-3xl font-black mt-1">{s.val}</p>
                            </div>
                        ))}
                    </div>

                    {stats.totalCheckedIn !== undefined && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total Users', val: stats.totalUsers, action: () => { if (user.role === 'admin') navigate('/users'); } },
                                { label: 'Tickets Issued', val: stats.totalTickets, action: () => setActiveTab('bookings') },
                                { label: 'Checked In', val: stats.totalCheckedIn },
                                { label: 'Attendance Rate', val: `${stats.attendanceRate}%` },
                            ].map((s, i) => (
                                <div key={i} onClick={s.action} className={`bg-gray-50 p-5 rounded-xl border border-gray-100 ${s.action ? 'cursor-pointer hover:bg-gray-100 hover:shadow-sm transition-all' : ''}`}>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{s.val || 0}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent pending */}
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Pending Approvals ({pendingBookings.length})</h3>
                    {pendingBookings.length === 0 ? <p className="text-gray-500 text-sm mb-6">No pending bookings</p> : (
                        <div className="space-y-2 mb-6">
                            {pendingBookings.slice(0, 5).map(b => (
                                <div key={b._id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">{b.userId?.name || 'User'} → {b.eventId?.title || 'Event'}</p>
                                        <p className="text-xs text-gray-500">{b.ticketTier} • ₹{b.amount}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => confirmBooking(b._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-600"><FaCheck /></button>
                                        <button onClick={() => cancelBooking(b._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-600"><FaTimes /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
                <>
                    <button onClick={() => setShowForm(!showForm)} className="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 mb-6 hover:bg-black transition">
                        <FaPlus /> {showForm ? 'Cancel' : 'Create Event'}
                    </button>

                    {showForm && (
                        <form onSubmit={createEvent} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="px-4 py-2 border rounded-lg" placeholder="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                <input className="px-4 py-2 border rounded-lg" placeholder="Location" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                <input type="date" className="px-4 py-2 border rounded-lg" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                <select className="px-4 py-2 border rounded-lg" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {['Tech', 'Music', 'Business', 'Sports', 'Art', 'Workshop', 'Meetup'].map(c => <option key={c}>{c}</option>)}
                                </select>
                                <input type="number" className="px-4 py-2 border rounded-lg" placeholder="Total Seats" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: Number(e.target.value) })} />
                                <input type="number" className="px-4 py-2 border rounded-lg" placeholder="Ticket Price (₹)" value={form.ticketPrice} onChange={e => setForm({ ...form, ticketPrice: Number(e.target.value) })} />
                                <input className="px-4 py-2 border rounded-lg md:col-span-2" placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                            </div>
                            <textarea className="w-full px-4 py-2 border rounded-lg" rows="3" placeholder="Description" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

                            {/* Ticket Tiers */}
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-gray-800">Ticket Tiers (Optional)</h4>
                                    <button type="button" onClick={addTier} className="text-sm bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200 transition">+ Add Tier</button>
                                </div>
                                {tiers.map((tier, i) => (
                                    <div key={i} className="flex gap-2 mb-2 items-center">
                                        <select className="px-2 py-1.5 border rounded text-sm" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)}>
                                            {['Free', 'General', 'VIP', 'Early Bird', 'Student'].map(n => <option key={n}>{n}</option>)}
                                        </select>
                                        <input type="number" className="px-2 py-1.5 border rounded w-24 text-sm" placeholder="₹ Price" value={tier.price} onChange={e => updateTier(i, 'price', Number(e.target.value))} />
                                        <input type="number" className="px-2 py-1.5 border rounded w-24 text-sm" placeholder="Seats" value={tier.totalSeats} onChange={e => updateTier(i, 'totalSeats', Number(e.target.value))} />
                                        <input className="px-2 py-1.5 border rounded flex-grow text-sm" placeholder="Description" value={tier.description} onChange={e => updateTier(i, 'description', e.target.value)} />
                                        <button type="button" onClick={() => removeTier(i)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition">Create Event</button>
                        </form>
                    )}

                    <div className="space-y-3">
                        {events.map(ev => (
                            <div key={ev._id} className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition">
                                <div>
                                    <h3 className="font-bold text-gray-900">{ev.title}</h3>
                                    <p className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString()} • {ev.location} • {ev.availableSeats}/{ev.totalSeats} seats</p>
                                    {ev.ticketTiers?.length > 0 && <p className="text-xs text-gray-400 mt-1">{ev.ticketTiers.map(t => `${t.name}: ₹${t.price}`).join(' | ')}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => generateCerts(ev._id)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-100 transition" title="Generate Certificates"><FaCertificate /></button>
                                    <button onClick={() => deleteEvent(ev._id)} className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-100 transition"><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="space-y-3">
                    {bookings.length === 0 ? <p className="text-gray-500 text-center py-10">No bookings yet</p> : bookings.map(b => (
                        <div key={b._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-sm text-gray-900">{b.userId?.name || 'User'} → {b.eventId?.title || 'Deleted Event'}</p>
                                <p className="text-xs text-gray-500">{b.ticketTier} • ₹{b.amount} • <span className={`font-bold ${b.status === 'confirmed' ? 'text-green-600' : b.status === 'cancelled' ? 'text-red-500' : 'text-yellow-600'}`}>{b.status}</span> • <span className={b.paymentStatus === 'paid' ? 'text-blue-600' : 'text-gray-400'}>{b.paymentStatus}</span></p>
                            </div>
                            {b.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => confirmBooking(b._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold"><FaCheck /></button>
                                    <button onClick={() => cancelBooking(b._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold"><FaTimes /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
