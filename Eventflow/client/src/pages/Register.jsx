import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const INTEREST_OPTIONS = ['Technology', 'Business', 'Music', 'Art', 'Science', 'Sports', 'Design', 'Marketing', 'Finance', 'AI/ML'];

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', userType: 'general', phone: '', studentRollNumber: '', organization: '', jobTitle: '', interests: [] });
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            if (!showOTP) {
                await register(formData.name, formData.email, formData.password, formData);
                setShowOTP(true);
            } else {
                await verifyOTP(formData.email, otp);
                navigate('/dashboard');
            }
        } catch (err) { setError(err); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create an Account</h2>
                <p className="text-gray-500">Join EventFlow today</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input type="text" name="name" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm" value={formData.name} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input type="email" name="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm" value={formData.email} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input type="password" name="password" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm" value={formData.password} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <input type="tel" name="phone" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm" placeholder="Optional" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">I am a</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['general', 'student', 'professional'].map(type => (
                                    <button key={type} type="button"
                                        onClick={() => setFormData({ ...formData, userType: type })}
                                        className={`py-2 px-3 rounded-lg border text-sm font-bold capitalize transition ${formData.userType === type ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conditional Fields */}
                        {formData.userType === 'student' && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
                                    <input type="text" name="studentRollNumber" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 transition" value={formData.studentRollNumber} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Institution</label>
                                    <input type="text" name="organization" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 transition" value={formData.organization} onChange={handleChange} />
                                </div>
                            </div>
                        )}
                        {formData.userType === 'professional' && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Organization</label>
                                    <input type="text" name="organization" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 transition" value={formData.organization} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                                    <input type="text" name="jobTitle" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 transition" value={formData.jobTitle} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
                            <div className="flex flex-wrap gap-2">
                                {INTEREST_OPTIONS.map(interest => (
                                    <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${formData.interests.includes(interest) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-sm text-green-700 bg-green-50 p-3 mb-4 rounded border border-green-200">An OTP has been sent to your email. Please verify your account.</p>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code (OTP)</label>
                        <input type="text" required placeholder="6-digit code" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black focus:ring-4 focus:ring-gray-200 transition shadow-md mt-4">
                    {loading ? 'Processing...' : (showOTP ? 'Verify & Complete' : 'Sign Up')}
                </button>
            </form>

            {!showOTP && (
                <p className="text-center mt-6 text-gray-600">Already have an account? <Link to="/login" className="text-gray-900 font-bold hover:underline">Sign in</Link></p>
            )}
        </div>
    );
};

export default Register;
