const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.post('/', authMiddleware, postController.createPost);

module.exports = router;