const mongoose = require('mongoose');
const Content = require('./models/Content');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const items = await Content.find({});
            console.log(JSON.stringify(items, null, 2));
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
