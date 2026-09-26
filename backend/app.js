require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const userRoute = require('./router/user');
const authRoute = require('./router/auth');
const postRoute = require('./router/post');
const requestRoute = require('./router/request');
const chatRoute = require('./router/chat');

app.use('/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/requests', requestRoute);
app.use('/api/chats', chatRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});