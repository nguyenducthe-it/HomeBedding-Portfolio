const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['attendance', 'new_customer', 'new_order', 'support_request', 'newsletter_subscribe'], 
        required: true 
    },
    relatedId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: false 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
