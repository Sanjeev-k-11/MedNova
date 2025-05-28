import express from 'express';
import { createMessage, deleteMessage, getAllMessages, toggleLikeMessage } from '../controllers/adminController.js';

const MessageRouter = express.Router();

MessageRouter.post('/message',createMessage);
MessageRouter.get('/all-message',getAllMessages);
MessageRouter.patch('/togle',toggleLikeMessage);
MessageRouter.delete('/delete-message',deleteMessage)

export default MessageRouter;