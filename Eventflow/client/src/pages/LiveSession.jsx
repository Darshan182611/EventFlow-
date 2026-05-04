import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { FaPoll, FaQuestionCircle, FaTrophy, FaArrowUp, FaCheck, FaUsers } from 'react-icons/fa';

const LiveSession = () => {
    const { eventId } = useParams();
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('polls');
    const [polls, setPolls] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myPoints, setMyPoints] = useState(0);
    const [newQuestion, setNewQuestion] = useState('');
    const [networking, setNetworking] = useState([]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchAll = async () => {
        try {
            const [p, q, lb, me] = await Promise.all([
                api.get(`/engage/polls/event/${eventId}`).catch(() => ({ data: [] })),
                api.get(`/engage/questions/event/${eventId}`).catch(() => ({ data: [] })),
                api.get(`/engagement/leaderboard/${eventId}`).catch(() => ({ data: [] })),
                api.get(`/engagement/my/${eventId}`).catch(() => ({ data: { points: 0 } }))
            ]);
            setPolls(p.data); setQuestions(q.data); setLeaderboard(lb.data); setMyPoints(me.data.points || 0);
        } catch (err) { console.error(err); }
    };

    const votePoll = async (pollId, optionIndex) => {
        try { await api.post(`/engage/polls/${pollId}/vote`, { optionIndex }); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const askQ = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        try { await api.post('/engage/questions', { eventId, question: newQuestion }); setNewQuestion(''); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const upvote = async (qId) => {
        try { await api.post(`/engage/questions/${qId}/upvote`); fetchAll(); } catch (err) { }
    };

    const fetchNetworking = async () => {
        try { const { data } = await api.get(`/networking/suggestions/${eventId}`); setNetworking(data); } catch (err) { }
    };

    useEffect(() => { if (activeTab === 'networking') fetchNetworking(); }, [activeTab]);

    const tabs = [
        { id: 'polls', label: 'Live Polls', icon: <FaPoll /> },
        { id: 'qa', label: 'Q&A', icon: <FaQuestionCircle /> },
        { id: 'leaderboard', label: 'Leaderboard', icon: <FaTrophy /> },
        { id: 'networking', label: 'Networking', icon: <FaUsers /> },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold text-gray-900">Live Event Hub</h1>
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <FaTrophy /> {myPoints} pts
                    </div>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition flex-1 justify-center ${activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Polls */}
                {activeTab === 'polls' && (
                    <div className="space-y-4">
                        {polls.length === 0 ? <p className="text-gray-500 text-center py-8">No active polls yet</p> : polls.map(poll => {
                            const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                            const hasVoted = poll.voters?.includes(user?._id);
                            return (
                                <div key={poll._id} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-3">{poll.question}</h3>
                                    <div className="space-y-2">
                                        {poll.options.map((opt, i) => {
                                            const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(0) : 0;
                                            return (
                                                <button key={i} onClick={() => !hasVoted && votePoll(poll._id, i)} disabled={hasVoted || !poll.isActive}
                                                    className={`w-full text-left p-3 rounded-lg transition relative overflow-hidden ${hasVoted ? 'cursor-default' : 'hover:bg-gray-100 cursor-pointer'}`}>
                                                    <div className="absolute inset-0 bg-blue-100 rounded-lg" style={{ width: `${pct}%`, transition: 'width 0.5s' }}></div>
                                                    <div className="relative flex justify-between items-center">
                                                        <span className="font-semibold text-sm">{opt.text}</span>
                                                        <span className="text-xs font-bold text-gray-500">{pct}% ({opt.votes})</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{totalVotes} total votes • {poll.isActive ? 'Active' : 'Closed'}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Q&A */}
                {activeTab === 'qa' && (
                    <div>
                        <form onSubmit={askQ} className="flex gap-3 mb-6">
                            <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Ask a question..." className="flex-grow px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 transition text-sm" />
                            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition">Ask</button>
                        </form>
                        <div className="space-y-3">
                            {questions.map(q => (
                                <div key={q._id} className={`p-4 rounded-xl border ${q.isAnswered ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => upvote(q._id)} className="flex flex-col items-center text-gray-400 hover:text-gray-900 transition mt-1">
                                            <FaArrowUp className={q.upvotedBy?.includes(user?._id) ? 'text-blue-500' : ''} />
                                            <span className="text-xs font-bold">{q.upvotes}</span>
                                        </button>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-900">{q.question}</p>
                                            <p className="text-xs text-gray-400 mt-1">by {q.askedBy?.name || 'Anonymous'}</p>
                                            {q.isAnswered && <p className="text-sm text-green-700 mt-2 bg-green-100 p-2 rounded"><FaCheck className="inline mr-1" />{q.answer}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-2">
                        {leaderboard.length === 0 ? <p className="text-gray-500 text-center py-8">No engagement data yet</p> : leaderboard.map((entry, i) => (
                            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${i < 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-100'}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-700'}`}>{entry.rank}</span>
                                    <div>
                                        <p className="font-bold text-gray-900">{entry.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{entry.userType} • {entry.actions} actions</p>
                                    </div>
                                </div>
                                <span className="font-black text-lg text-gray-900">{entry.points} pts</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Networking */}
                {activeTab === 'networking' && (
                    <div className="space-y-3">
                        {networking.length === 0 ? <p className="text-gray-500 text-center py-8">No networking suggestions available</p> : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">People you should meet at this event, based on shared interests and profile:</p>
                                {networking.map(n => (
                                    <div key={n._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-900">{n.name?.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-gray-900">{n.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{n.userType} {n.organization ? `at ${n.organization}` : ''}</p>
                                                {n.interests?.length > 0 && (
                                                    <div className="flex gap-1 mt-1">{n.interests.slice(0, 3).map(i => <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{i}</span>)}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-green-600">{n.matchScore}%</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold">Match</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveSession;
