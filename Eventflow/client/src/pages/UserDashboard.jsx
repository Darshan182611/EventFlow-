import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaQrcode, FaCertificate, FaCalendarAlt, FaHeart } from 'react-icons/fa';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [itinerary, setItinerary] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchAll();
    }, [user, navigate]);

    const fetchAll = async () => {
        try {
            const [bk, tk, cert, itin] = await Promise.all([
                api.get('/bookings/my').catch(() => ({ data: [] })),
                api.get('/tickets/my').catch(() => ({ data: [] })),
                api.get('/certificates/my').catch(() => ({ data: [] })),
                api.get('/sessions/my-itinerary').catch(() => ({ data: [] }))
            ]);
            setBookings(bk.data); setTickets(tk.data); setCertificates(cert.data); setItinerary(itin.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Cancel this booking?')) {
            try { await api.delete(`/bookings/${id}`); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading dashboard...</div>;

    const tabs = [
        { id: 'bookings', label: 'Bookings', icon: <FaTicketAlt />, count: bookings.length },
        { id: 'tickets', label: 'My Tickets', icon: <FaQrcode />, count: tickets.length },
        { id: 'certificates', label: 'Certificates', icon: <FaCertificate />, count: certificates.length },
        { id: 'itinerary', label: 'My Schedule', icon: <FaHeart />, count: itinerary.length },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center text-3xl font-bold uppercase shrink-0">{user?.name.charAt(0)}</div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Welcome, {user?.name}!</h1>
                    <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> {user?.userType || 'User'} • {user?.role}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t.icon} {t.label} {t.count > 0 && <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                bookings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                        <FaTicketAlt className="text-gray-300 text-4xl mx-auto mb-4" />
                        <p className="text-xl text-gray-500 mb-6 font-medium">No bookings yet.</p>
                        <Link to="/" className="inline-block bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition shadow-md hover:bg-black">Browse Events</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookings.map(b => (
                            <div key={b._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col">
                                <div className="p-5 flex-grow">
                                    {b.eventId ? (
                                        <>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{b.eventId.title}</h3>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                                                    {b.status !== 'cancelled' && <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${b.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{b.paymentStatus.replace('_', ' ')}</span>}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <p><strong>Date:</strong> {new Date(b.eventId.date).toLocaleDateString()}</p>
                                                <p><strong>Tier:</strong> {b.ticketTier} • <strong>Amount:</strong> {b.amount === 0 ? 'Free' : `₹${b.amount}`}</p>
                                            </div>
                                        </>
                                    ) : <p className="text-red-500 italic">Event details unavailable</p>}
                                </div>
                                <div className="p-3 bg-gray-50 flex justify-between items-center">
                                    {b.eventId && b.status !== 'cancelled' ? (
                                        <>
                                            <Link to={`/events/${b.eventId._id}`} className="text-gray-900 font-semibold text-sm hover:underline">View Event</Link>
                                            <button onClick={() => cancelBooking(b._id)} className="text-red-500 font-semibold text-sm hover:text-red-700 flex items-center gap-1"><FaTimesCircle /> Cancel</button>
                                        </>
                                    ) : <div className="w-full text-center text-sm text-gray-500 italic">Cancelled</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
                tickets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                        <FaQrcode className="text-gray-300 text-4xl mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No tickets yet. Book an event to get your QR ticket!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tickets.map(t => (
                            <div key={t._id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start gap-4">
                                    {t.qrCodeData && <img src={t.qrCodeData} alt="QR" className="w-24 h-24 rounded-lg border border-gray-200" />}
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-900">{t.eventId?.title || 'Event'}</h3>
                                        <p className="text-sm text-gray-500">{t.eventId?.date ? new Date(t.eventId.date).toLocaleDateString() : ''}</p>
                                        <p className="text-xs text-gray-400 mt-1">Tier: {t.ticketTier}</p>
                                        <p className="text-xs font-mono text-gray-500 mt-1 cursor-pointer hover:text-gray-700 transition" onClick={() => { navigator.clipboard.writeText(t.ticketCode); alert('Ticket code copied to clipboard!'); }} title="Click to copy full code">Code: {t.ticketCode}</p>
                                        <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-black rounded uppercase ${t.isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {t.isCheckedIn ? '✓ Checked In' : 'Not Checked In'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
                certificates.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                        <FaCertificate className="text-gray-300 text-4xl mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No certificates yet. Attend events to earn certificates!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {certificates.map(c => (
                            <div key={c._id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <FaCertificate className="text-yellow-600 text-2xl" />
                                    <h3 className="font-bold text-gray-900">{c.eventId?.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600">Date: {c.eventId?.date ? new Date(c.eventId.date).toLocaleDateString() : ''}</p>
                                <p className="text-xs font-mono text-gray-400 mt-2">Cert ID: {c.certificateCode.slice(0, 12)}...</p>
                                <p className="text-xs text-gray-500 mt-1">Issued: {new Date(c.issuedAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Itinerary Tab */}
            {activeTab === 'itinerary' && (
                itinerary.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                        <FaHeart className="text-gray-300 text-4xl mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No saved sessions. Favorite sessions from event pages!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {itinerary.map(s => (
                            <div key={s._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                                <div className="text-center bg-gray-100 p-3 rounded-lg shrink-0">
                                    <p className="text-xs text-gray-500 font-bold">{new Date(s.startTime).toLocaleDateString()}</p>
                                    <p className="text-lg font-black text-gray-900">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{s.title}</h3>
                                    {s.speaker && <p className="text-sm text-gray-500">by {s.speaker}</p>}
                                    {s.room && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{s.room}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default UserDashboard;
