const { Poll, Question } = require('../models/Poll');
const Engagement = require('../models/Engagement');

// === POLLS ===
exports.createPoll = async (req, res) => {
    try {
        const poll = await Poll.create({ ...req.body, createdBy: req.user.id });
        res.status(201).json(poll);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventPolls = async (req, res) => {
    try {
        const polls = await Poll.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.votePoll = async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found' });
        if (!poll.isActive) return res.status(400).json({ message: 'Poll is closed' });
        if (poll.voters.includes(req.user.id)) return res.status(400).json({ message: 'Already voted' });

        poll.options[optionIndex].votes += 1;
        poll.voters.push(req.user.id);
        await poll.save();

        // Award points
        let engagement = await Engagement.findOne({ userId: req.user.id, eventId: poll.eventId });
        if (!engagement) {
            engagement = await Engagement.create({ userId: req.user.id, eventId: poll.eventId, points: 0, actions: [] });
        }
        engagement.points += 10;
        engagement.actions.push({ type: 'poll_vote', points: 10 });
        await engagement.save();

        res.json(poll);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.closePoll = async (req, res) => {
    try {
        const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        res.json(poll);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// === Q&A ===
exports.askQuestion = async (req, res) => {
    try {
        const q = await Question.create({ ...req.body, askedBy: req.user.id });

        let engagement = await Engagement.findOne({ userId: req.user.id, eventId: req.body.eventId });
        if (!engagement) {
            engagement = await Engagement.create({ userId: req.user.id, eventId: req.body.eventId, points: 0, actions: [] });
        }
        engagement.points += 20;
        engagement.actions.push({ type: 'question_ask', points: 20 });
        await engagement.save();

        res.status(201).json(q);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ eventId: req.params.eventId })
            .populate('askedBy', 'name')
            .sort({ upvotes: -1, createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.upvoteQuestion = async (req, res) => {
    try {
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Question not found' });
        if (q.upvotedBy.includes(req.user.id)) {
            q.upvotes -= 1;
            q.upvotedBy.pull(req.user.id);
        } else {
            q.upvotes += 1;
            q.upvotedBy.push(req.user.id);
            let engagement = await Engagement.findOne({ userId: req.user.id, eventId: q.eventId });
            if (!engagement) {
                engagement = await Engagement.create({ userId: req.user.id, eventId: q.eventId, points: 0, actions: [] });
            }
            engagement.points += 5;
            engagement.actions.push({ type: 'question_upvote', points: 5 });
            await engagement.save();
        }
        await q.save();
        res.json(q);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.answerQuestion = async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, { answer: req.body.answer, isAnswered: true }, { new: true });
        res.json(q);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
