const express = require('express');
const app = express();

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

app.listen(3000, () => {
    console.log('Server running on port 3000');
});