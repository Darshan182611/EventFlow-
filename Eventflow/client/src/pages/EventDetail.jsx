import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaStar, FaClock, FaUsers } from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [selectedTier, setSelectedTier] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [studentRoll, setStudentRoll] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
                if (data.ticketTiers?.length > 0) setSelectedTier(data.ticketTiers[0]);
            } catch (err) { setError('Failed to load event details.'); } finally { setLoading(false); }
        };
        const fetchSessions = async () => {
            try { const { data } = await api.get(`/sessions/event/${id}`); setSessions(data); } catch (err) { }
        };
        fetchEvent(); fetchSessions();
    }, [id]);

    const handleBooking = async () => {
        if (!user) { navigate('/login'); return; }
        setBookingLoading(true); setError(''); setSuccessMsg('');
        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Please verify to confirm booking.');
            } else {
                const bookingData = { eventId: event._id, otp };
                if (selectedTier) {
                    bookingData.ticketTier = selectedTier.name;
                    bookingData.ticketTierId = selectedTier._id;
                    bookingData.attendeeType = selectedTier.name.toLowerCase().replace(' ', '_');
                    if (selectedTier.requiresStudentId) bookingData.studentRollNumber = studentRoll;
                }
                const { data } = await api.post('/bookings', bookingData);
                const bookingAmount = selectedTier ? selectedTier.price : event.ticketPrice;

                if (bookingAmount > 0) {
                    // Trigger Razorpay
                    try {
                        const orderRes = await api.post('/payments/create-order', { bookingId: data.booking._id });
                        const options = {
                            key: orderRes.data.key,
                            amount: orderRes.data.amount,
                            currency: orderRes.data.currency,
                            name: 'EventFlow',
                            description: event.title,
                            order_id: orderRes.data.orderId,
                            handler: async (response) => {
                                await api.post('/payments/verify', { ...response, bookingId: data.booking._id });
                                navigate('/payment-success');
                            },
                            prefill: { name: user.name, email: user.email },
                            theme: { color: '#111827' }
                        };
                        const rzp = new window.Razorpay(options);
                        rzp.on('payment.failed', () => navigate('/payment-failed'));
                        rzp.open();
                    } catch (payErr) {
                        setSuccessMsg('Booking submitted! Payment gateway unavailable — admin will confirm manually.');
                    }
                } else {
                    setSuccessMsg('Booking requested! Awaiting admin confirmation.');
                }
                setShowOTP(false);
                if (selectedTier) {
                    setSelectedTier({ ...selectedTier, availableSeats: selectedTier.availableSeats - 1 });
                }
                setEvent({ ...event, availableSeats: event.availableSeats - 1 });
            }
        } catch (err) { setError(err.response?.data?.message || 'Booking failed'); }
        finally { setBookingLoading(false); }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
    if (error && !event) return <div className="text-center py-20 text-xl text-red-500">{error}</div>;

    const hasTiers = event.ticketTiers && event.ticketTiers.length > 0;
    const displayPrice = selectedTier ? selectedTier.price : event.ticketPrice;
    const displaySeats = selectedTier ? selectedTier.availableSeats : event.availableSeats;
    const isSoldOut = displaySeats <= 0;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-80 object-cover" />
                ) : (
                    <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">{event.category}</div>
                )}

                <div className="p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left: Details */}
                        <div className="flex-grow">
                            <div className="inline-block bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">{event.category}</div>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
                            <p className="text-gray-600 text-lg leading-relaxed mb-6">{event.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3 text-gray-600"><FaCalendarAlt className="text-gray-400" /><span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                                <div className="flex items-center gap-3 text-gray-600"><FaMapMarkerAlt className="text-gray-400" /><span>{event.location}</span></div>
                                <div className="flex items-center gap-3 text-gray-600"><FaChair className="text-gray-400" /><span>{event.availableSeats} / {event.totalSeats} seats</span></div>
                                <div className="flex items-center gap-3 text-gray-600"><FaMoneyBillWave className="text-gray-400" /><span>{event.ticketPrice === 0 ? 'Free' : `From ₹${event.minPrice || event.ticketPrice}`}</span></div>
                            </div>

                            {/* Ticket Tiers */}
                            {hasTiers && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><FaStar className="text-yellow-500" /> Select Ticket Tier</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {event.ticketTiers.map(tier => (
                                            <button key={tier._id} onClick={() => setSelectedTier(tier)}
                                                className={`p-4 rounded-xl border-2 text-left transition ${selectedTier?._id === tier._id ? 'border-gray-900 bg-gray-50 shadow-md' : 'border-gray-200 hover:border-gray-400'} ${tier.availableSeats <= 0 ? 'opacity-50' : ''}`}
                                                disabled={tier.availableSeats <= 0}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-gray-900">{tier.name}</span>
                                                    <span className="font-black text-lg">{tier.price === 0 ? 'FREE' : `₹${tier.price}`}</span>
                                                </div>
                                                {tier.description && <p className="text-sm text-gray-500 mt-1">{tier.description}</p>}
                                                <p className="text-xs text-gray-400 mt-2">{tier.availableSeats <= 0 ? 'Sold Out' : `${tier.availableSeats} seats left`}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sessions/Agenda */}
                            {sessions.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><FaClock className="text-gray-500" /> Event Schedule</h3>
                                    <div className="space-y-2">
                                        {sessions.map(s => (
                                            <div key={s._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="text-xs font-bold text-gray-500 w-24 shrink-0">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div><p className="font-semibold text-gray-800">{s.title}</p>{s.speaker && <p className="text-xs text-gray-500">by {s.speaker}</p>}</div>
                                                {s.room && <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">{s.room}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Booking Panel */}
                        <div className="lg:w-[340px] shrink-0">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 sticky top-8 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Book Now</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Tier</span><span className="font-bold">{selectedTier?.name || 'General'}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-bold text-lg">{displayPrice === 0 ? <span className="text-green-500">Free</span> : `₹${displayPrice}`}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span><span className={`font-bold ${displaySeats < 10 ? 'text-orange-500' : ''}`}>{displaySeats} seats</span></div>
                                </div>

                                {selectedTier?.requiresStudentId && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Student Roll Number</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-700 transition text-sm" value={studentRoll} onChange={e => setStudentRoll(e.target.value)} placeholder="Required for student tier" />
                                    </div>
                                )}

                                {showOTP && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                                        <input type="text" required placeholder="6-digit code" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-700 transition font-bold tracking-widest text-center text-lg" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                                    </div>
                                )}

                                <button onClick={handleBooking} disabled={isSoldOut || bookingLoading || (showOTP && !otp) || (selectedTier?.requiresStudentId && !studentRoll)}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg ${isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white hover:shadow-xl hover:-translate-y-0.5'}`}>
                                    {bookingLoading ? 'Processing...' : showOTP ? 'Verify OTP & Confirm' : isSoldOut ? 'Sold Out' : displayPrice > 0 ? `Pay ₹${displayPrice}` : 'Register Free'}
                                </button>

                                {error && <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-2 rounded text-sm">{error}</p>}
                                {successMsg && <p className="text-green-600 mt-4 text-center font-medium bg-green-50 p-2 rounded text-sm">{successMsg}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
