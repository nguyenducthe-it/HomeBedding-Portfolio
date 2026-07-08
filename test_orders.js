const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homebedding')
.then(async () => {
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders.`);
    if (orders.length > 0) {
        console.log(orders[0]._id);
    }
    process.exit(0);
});
