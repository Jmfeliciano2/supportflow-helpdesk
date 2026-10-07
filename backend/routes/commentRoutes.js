const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
    listComments,
    createComment,
} = require("../controllers/commentController");

const router = express.Router();

router.use(authenticate);

router.get(
    "/tickets/:id/comments",
    listComments
);

router.post(
    "/tickets/:id/comments",
    createComment
);

module.exports = router;