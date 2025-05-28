// ./models/HeaderModel.js
import mongoose from 'mongoose';

// Define a sub-schema for each image entry in the slider
const imageConfigSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true // Ensure no leading/trailing whitespace on URLs
  },
  altText: {
    type: String,
    required: false, // alt text is optional for staff
    default: '',     // provide a default empty string
    trim: true
  }
}, { _id: false }); // We don't need a separate _id for these embedded sub-documents

// Define the schema for the Header configuration
const headerSchema = new mongoose.Schema({
  // A unique identifier or name for this configuration document
  // Useful if you might somehow have more than one config document in the future,
  // or for easy targeting with findOne.
  name: {
    type: String,
    required: true,
    unique: true, // Ensure only one document with this name exists
    default: 'mainHeaderConfig' // Give it a default name if creating programmatically
  },

  // Array to store configurations for the header images.
  // Each item is an object with url and altText.
  images: {
    type: [imageConfigSchema], // Array of image configuration objects
    required: true,
    validate: {
      validator: function(v) {
        // Basic validation: check if array exists, has items, and each item is an object
        // with a non-empty url string.
        return v && v.length > 0 && v.every(item =>
          item && typeof item.url === 'string' && item.url.trim().length > 0
        );
      },
      message: 'Images must be an array with at least one item, each having a non-empty url string.'
    }
  },

  // Configuration for the text displayed when the user is NOT logged in
  loggedOutContent: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    paragraph: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Configuration for the text displayed when the user IS logged in
  loggedInContent: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    paragraph: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Configuration for the Call-to-Action button when the user is NOT logged in
  loggedOutButton: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Configuration for the Call-to-Action button when the user IS logged in
  loggedInButton: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      required: true,
      trim: true
    }
  },
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create the Mongoose model, handling potential re-compilation issues
const HeaderModel = mongoose.models.Header || mongoose.model('Header', headerSchema);

export default HeaderModel;