import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaCamera } from 'react-icons/fa';

const CheckInScanner = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [manualCode, setManualCode] = useState('');
    const [scannedTicket, setScannedTicket] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentScans, setRecentScans] = useState([]);

    useEffect(() => {
        if (!user || !['admin', 'event_manager', 'volunteer'].includes(user.role)) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        setLoading(true); setScannedTicket(null); setResult(null); setError('');
        try {
            const { data } = await api.get(`/tickets/verify/${manualCode.trim()}`);
            setScannedTicket(data);
            if (data.isCheckedIn) {
                setError('Ticket is already checked in.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally { setLoading(false); }
    };

    const handleConfirmCheckIn = async () => {
        if (!scannedTicket) return;
        setLoading(true); setResult(null); setError('');
        try {
            const { data } = await api.post('/tickets/check-in', { ticketCode: scannedTicket.ticketCode });
            setResult(data);
            setScannedTicket(null);
            setManualCode('');
            setRecentScans(prev => [{ ...data, time: new Date().toLocaleTimeString(), success: true }, ...prev.slice(0, 19)]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Check-in failed';
            setError(msg);
            setRecentScans(prev => [{ message: msg, time: new Date().toLocaleTimeString(), success: false, attendee: err.response?.data?.attendee }, ...prev.slice(0, 19)]);
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-6">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"><FaQrcode /></div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Check-In Scanner</h1>
                    <p className="text-gray-500 mt-2">Scan QR codes or enter ticket codes manually</p>
                </div>

                {/* Manual Entry */}
                <form onSubmit={handleVerify} className="flex gap-3 mb-8">
                    <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="Enter ticket code (UUID)" className="flex-grow px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-700 transition font-mono text-sm" />
                    <button type="submit" disabled={loading} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50">
                        {loading ? '...' : 'Verify'}
                    </button>
                </form>

                {/* Scanned Ticket Verification */}
                {scannedTicket && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
                        <h2 className="text-xl font-black text-blue-800 mb-2">Ticket Verified</h2>
                        <p className="text-lg font-bold text-gray-900">{scannedTicket.attendee}</p>
                        <p className="text-sm text-gray-600">{scannedTicket.event} • {scannedTicket.tier}</p>
                        <p className="text-xs font-mono text-gray-500 mt-2 mb-4">{scannedTicket.ticketCode}</p>
                        
                        {!scannedTicket.isCheckedIn ? (
                            <button onClick={handleConfirmCheckIn} disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-md disabled:opacity-50">
                                {loading ? 'Processing...' : 'Confirm Registration (Check-In)'}
                            </button>
                        ) : (
                            <p className="text-red-500 font-bold mt-2">Already Checked In at {new Date(scannedTicket.checkedInAt).toLocaleString()}</p>
                        )}
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center animate-pulse-once">
                        <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
                        <h2 className="text-2xl font-black text-green-700 mb-2">Check-in Successful!</h2>
                        <p className="text-lg font-bold text-gray-900">{result.attendee}</p>
                        <p className="text-sm text-gray-500">{result.event} • {result.tier}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(result.checkedInAt).toLocaleString()}</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
                        <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-red-700">{error}</h2>
                    </div>
                )}
            </div>

            {/* Recent Scans */}
            {recentScans.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Scans ({recentScans.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentScans.map((scan, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${scan.success ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="flex items-center gap-3">
                                    {scan.success ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />}
                                    <span className="font-semibold text-sm">{scan.attendee || scan.message}</span>
                                </div>
                                <span className="text-xs text-gray-400">{scan.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckInScanner;
