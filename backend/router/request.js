const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, requestController.sendRequest);
router.patch('/:requestId/status', authMiddleware, requestController.respondRequest);
router.get('/post/:postId', authMiddleware, requestController.getRequestsByPost);

module.exports = router;