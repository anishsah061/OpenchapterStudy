try {
    console.log('Requiring express...');
    require('express');
    console.log('Requiring cors...');
    require('cors');
    console.log('Requiring dotenv...');
    require('dotenv');
    console.log('Requiring multer...');
    require('multer');
    console.log('Requiring routes/auth...');
    require('./routes/auth');
    console.log('Requiring routes/content...');
    require('./routes/content');
    console.log('Success!');
} catch (e) {
    console.error('FAIL:', e);
}
