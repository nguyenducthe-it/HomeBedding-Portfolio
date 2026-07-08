const express = require('express');
const router = express.Router();
const CustomerNotification = require('../models/CustomerNotification');

// Get all notifications for a user (including global ones)
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await CustomerNotification.find({
            $or: [
                { userId: userId },
                { userId: null } // Global notifications
            ]
        }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark one as read
router.put('/read/:id', async (req, res) => {
    try {
        await CustomerNotification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all as read for a user
router.put('/:userId/read-all', async (req, res) => {
    try {
        const userId = req.params.userId;
        await CustomerNotification.updateMany(
            { userId: userId, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
