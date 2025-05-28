import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "appointments",
    },
    senderId: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      required: true,
      enum: ["user", "doctor"],
    },
    content: {
      type: String,
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const messageModel =
  mongoose.models.message || mongoose.model("Message", messageSchema);

export default messageModel;
