const mongoose = require('mongoose');
const Content = require('./models/Content');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const items = await Content.find({});
        console.log('All Content Items:');
        console.log(JSON.stringify(items, null, 2));
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
