const mongoose = require('mongoose');

const weekConfigSchema = new mongoose.Schema({
    weekStartDate: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD (Luôn là Thứ 2)
    isLocked: { type: Boolean, default: false }
});

module.exports = mongoose.model('WeekConfig', weekConfigSchema);
