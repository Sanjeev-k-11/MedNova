import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from "../models/doctorModel.js";
import ChatMessage from '../models/chatModel.js';


// Helper function to generate a consistent conversation ID from two string IDs
const generateConversationId = (id1, id2) => {
    // Sort the string IDs lexicographically to ensure consistency regardless of order
    const ids = [id1.toString(), id2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
};

// API to list doctors the user can chat with (based on valid appointments)
const getUserChatableDoctors = async (req, res) => {
    try {
        // Assuming userId (STRING) is available in req.user from authentication middleware
        const userId = req.user._id; // Or req.user.id, depending on how your auth populates the user object with the string ID

        if (!userId) {
             return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Find appointments for the user that are NOT cancelled and are paid
        // You might want to add a check for isCompleted depending on your desired chat window
        const appointments = await appointmentModel.find({
            userId: userId,
            cancelled: false, // Not cancelled
            payment: true,    // Payment is true (assuming this means confirmed)
            isCompleted: false // Assuming chat is only for upcoming/ongoing appointments
             // Add time checks here if chat is only allowed near appointment time
            // e.g., slotDate: { $gte: somePastDate, $lte: someFutureDate }
        });

        if (appointments.length === 0) {
            return res.json({ success: true, doctors: [], message: 'No eligible appointments found, no chat available.' });
        }

        // Get unique doctor IDs (strings) from the eligible appointments
        const docIds = appointments.map(app => app.docId);
        const uniqueDocIds = [...new Set(docIds)]; // Set handles uniqueness

        // Fetch details of these doctors using their string IDs (assuming doctorModel uses _id as string)
        const chatableDoctors = await doctorModel.find({ _id: { $in: uniqueDocIds } }).select('-password');

        // Optional: For each doctor, find the last message to show a preview
        const doctorsWithLastMessage = await Promise.all(chatableDoctors.map(async (doctor) => {
            const conversationId = generateConversationId(userId, doctor._id); // Use string IDs
            const lastMessage = await chatMessageModel.findOne({ conversationId }).sort({ createdAt: -1 }).limit(1);

            return {
                doctor: doctor, // Doctor object might have _id as string or ObjectId depending on its actual model definition. Be consistent. Assuming string _id here.
                lastMessage: lastMessage || null,
            };
        }));


        res.json({ success: true, doctors: doctorsWithLastMessage });

    } catch (error) {
        console.error("getUserChatableDoctors Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// API to send a message from user to doctor
const sendMessage = async (req, res) => {
    try {
        // Assuming userId (STRING) is available in req.user from authentication middleware
        const userId = req.user._id; // Or req.user.id
        const { docId, messageText } = req.body; // docId should also be a string

        if (!userId || !docId || !messageText) {
            return res.status(400).json({ success: false, message: 'Missing required fields: docId or messageText' });
        }

        // --- IMPORTANT CHECK: Verify if the user has a valid appointment with this doctor ---
        // Match the criteria used in getUserChatableDoctors
        const appointment = await appointmentModel.findOne({
            userId: userId, // User ID (string)
            docId: docId,   // Doctor ID (string)
            cancelled: false, // Not cancelled
            payment: true,    // Payment is true
            isCompleted: false // Assuming chat is only for upcoming/ongoing appointments
             // Add time checks here if necessary
        });

        if (!appointment) {
            return res.status(403).json({ success: false, message: 'You do not have an eligible appointment with this doctor, chat not allowed.' });
        }
        // --- End of IMPORTANT CHECK ---

        const conversationId = generateConversationId(userId, docId); // Use string IDs

        const newMessage = new ChatMessage({
            conversationId,
            senderId: userId,     // User's string ID
            receiverId: docId,    // Doctor's string ID
            senderType: 'User',   // Sender is the user
            messageText: messageText,
        });

        await newMessage.save();

        // Optional: You might want to notify the doctor about the new message (using sockets)

        res.status(201).json({ success: true, message: 'Message sent successfully', messageData: newMessage });

    } catch (error) {
        console.error("sendMessage Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get messages between user and a specific doctor
const getMessages = async (req, res) => {
    try {
        // Assuming userId (STRING) is available in req.user from authentication middleware
        const userId = req.user._id; // Or req.user.id
        const { docId } = req.params; // Get docId (string) from URL parameter

        if (!userId || !docId) {
             return res.status(400).json({ success: false, message: 'Missing required parameters: docId' });
        }

         // --- IMPORTANT CHECK: Verify if the user has a valid appointment with this doctor ---
         // Match the criteria used in getUserChatableDoctors and sendMessage
        const appointment = await appointmentModel.findOne({
            userId: userId, // User ID (string)
            docId: docId,   // Doctor ID (string)
            cancelled: false, // Not cancelled
            payment: true,    // Payment is true
            isCompleted: false // Assuming chat is only for upcoming/ongoing appointments
             // Add time checks here if necessary
        });

        if (!appointment) {
            return res.status(403).json({ success: false, message: 'You do not have an eligible appointment with this doctor, cannot fetch messages.' });
        }
        // --- End of IMPORTANT CHECK ---


        const conversationId = generateConversationId(userId, docId); // Use string IDs

        // Fetch all messages for this conversation, sorted by timestamp
        const messages = await ChatMessage.find({ conversationId })
                                                .sort({ createdAt: 1 }); // Sort oldest to newest

        // Optional: Mark messages sent BY the doctor TO this user as read
        // await chatMessageModel.updateMany(
        //     { conversationId, senderId: docId, receiverId: userId, read: false },
        //     { $set: { read: true } }
        // );
        // // Refetch messages if you updated them, or handle read status on frontend/sockets

        res.json({ success: true, messages });

    } catch (error) {
        console.error("getMessages Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    getUserChatableDoctors,
    sendMessage,
    getMessages,
    // Add doctor side functions later in a different controller if needed
};