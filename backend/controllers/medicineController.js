import Razorpay from 'razorpay';
import crypto from 'crypto'; // Ensure crypto is imported
import medicineModel from '../models/medicineModel.js';
import purchaseModel from '../models/purchaseModel.js'; // Use the updated model
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// <<<--- HELPER FUNCTION TO GENERATE SHORT ID --- >>>
const generateShortReceiptId = () => {
    const randomPart = crypto.randomBytes(12).toString('hex');
    return `rcpt_${randomPart}`;
};


// Create Razorpay Order (FIXED RECEIPT - NO CHANGE NEEDED HERE)
const buyMedicine = async (req, res) => {
    const { buyCart } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized: User ID missing.' });
    if (!buyCart || !Array.isArray(buyCart) || buyCart.length === 0) return res.status(400).json({ success: false, message: 'Missing or invalid buyCart.' });

    let totalAmount = 0;
    try {
        const validationPromises = buyCart.map(async (item) => {
            if (!item || typeof item !== 'object') throw new Error('Invalid item format.');
            const { _id, quantity, discountedPrice } = item;
            if (!mongoose.Types.ObjectId.isValid(_id)) throw new Error(`Invalid ID: ${_id}`);
            if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) throw new Error(`Invalid quantity: ${_id}`);
            if (typeof discountedPrice !== 'number' || discountedPrice < 0) throw new Error(`Invalid price: ${_id}`);
            const medicine = await medicineModel.findById(_id).select('name quantity discountedPrice').lean();
            if (!medicine) throw new Error(`Not found: ${_id}`);
            if (medicine.quantity < quantity) throw new Error(`Insufficient stock: ${medicine.name}`);
            totalAmount += medicine.discountedPrice * quantity;
            return { _id: item._id, name: medicine.name, quantity: item.quantity };
        });
        const validatedCartItems = await Promise.all(validationPromises);
        if (totalAmount <= 0) return res.status(400).json({ success: false, message: 'Total amount must be > 0.' });

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: generateShortReceiptId(), // Using short receipt ID
            notes: { userId: userId, itemCount: validatedCartItems.length }
        };
        const order = await razorpayInstance.orders.create(options);
        if (!order) throw new Error('Failed to create Razorpay order (unexpected response).');

        res.status(200).json({
            success: true,
            order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
            key: process.env.RAZORPAY_KEY_ID
         });
    } catch (error) { 
        if (error.statusCode && error.error) {
             console.error('Razorpay Error Details:', error.error);
             if (error.error.field === 'receipt') return res.status(400).json({ success: false, message: `Order failed: Invalid receipt (${error.error.description}).` });
             return res.status(error.statusCode).json({ success: false, message: error.error.description || 'Razorpay API error', details: error.error });
        } else if (error instanceof Error && !error.statusCode) {
             res.status(400).json({ success: false, message: error.message });
        } else {
             res.status(500).json({ success: false, message: 'Server error creating order.' });
        }
    }
};


// Verify Payment (NO CHANGE NEEDED HERE)
const verifyPayment = async (req, res) => { 
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, buyCart } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name;
    const userPhone = req.user?.phone;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: 'Missing payment details.' });
    if (!buyCart || !Array.isArray(buyCart) || buyCart.length === 0) return res.status(400).json({ success: false, message: 'Missing cart for verification.' });
    for (const item of buyCart) {
         if (!item || !mongoose.Types.ObjectId.isValid(item._id) || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.discountedPrice !== 'number' || item.discountedPrice < 0 || !item.name) {
              console.error('Invalid item in verification cart:', item);
              return res.status(400).json({ success: false, message: 'Invalid cart data during verification.' });
         }
     }

    const digest = `${razorpay_order_id}|${razorpay_payment_id}`;
    try {
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(digest).digest('hex');
        if (generatedSignature !== razorpay_signature) {
            console.warn(`Signature Mismatch: Expected ${generatedSignature}, Received ${razorpay_signature}`);
            return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
        }

        let serverCalculatedTotalAmount = 0;
        const medicineDataForPurchase = [];
        for (const item of buyCart) {
            const medicine = await medicineModel.findById(item._id).select('discountedPrice name').lean();
            if (!medicine) {
                 console.error(`Medicine ${item._id} not found during verification.`);
                 return res.status(400).json({ success: false, message: `Medicine ${item.name || item._id} not found.` });
            }
             const priceToUse = medicine.discountedPrice;
             serverCalculatedTotalAmount += priceToUse * item.quantity;
             medicineDataForPurchase.push({ medicineId: item._id,
                 name: medicine.name,
                  price: priceToUse,
                  quantity: item.quantity,
                   status: 'Paid'
                 }); // Set status: 'Paid'
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const purchase = new purchaseModel({ userId, 
                userName: userName || 'N/A', 
                phoneNumber: userPhone || 'N/A', 
                email: req.user?.email || 'N/A',
                image: req.user?.image || '/images/default-profile.png',
                medicines: medicineDataForPurchase,
                 totalAmount: serverCalculatedTotalAmount, 
                 paymentStatus: 'Paid', 
                 razorpayOrderId: razorpay_order_id,
                  razorpayPaymentId: razorpay_payment_id,
                   razorpaySignature: razorpay_signature });


            const savedPurchase = await purchase.save({ session });
            const stockUpdatePromises = buyCart.map(item => medicineModel.findByIdAndUpdate(item._id, { $inc: { quantity: -item.quantity } }, { new: true, session }).exec());
            const updatedMedicines = await Promise.all(stockUpdatePromises);
            if (updatedMedicines.some(med => med === null || med.quantity < 0)) throw new Error('Stock update failed.');
            await session.commitTransaction();
            res.status(200).json({ success: true, message: 'Payment verified successfully.', purchaseId: savedPurchase._id, orderId: razorpay_order_id });
        } catch (error) {
            await session.abortTransaction();
            console.error('Verification transaction error:', error);
            if (error.code === 11000) return res.status(409).json({ success: false, message: 'Conflict: Purchase may already exist.' });
            res.status(500).json({ success: false, message: 'Server error processing payment.' });
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        if (error.statusCode && error.error) return res.status(error.statusCode).json({ success: false, message: error.error.description || 'Razorpay API error.', details: error.error });
        res.status(500).json({ success: false, message: 'Internal server error verifying payment.' });
    }
};

const getMyMedicines = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

        // Fetch purchases and populate necessary fields
        const purchases = await purchaseModel.find({ userId: userId })
            .sort({ dateOfPurchase: -1 }) // Sort by purchase date
            .populate({
                path: "medicines.medicineId", // Populate medicine details within the array
                select: "name imageUrl manufacturer" // Select only needed fields
             })
            .lean(); // Use lean for performance

        if (!purchases || purchases.length === 0) {
            return res.status(200).json({ success: true, medicines: [], message: "No purchases found." });
        }

        // Flatten the structure and add overall purchase status to each item
        const myMedicines = purchases.flatMap(purchase => // 'purchase' is the parent document here
            purchase.medicines.map(medItem => {
                // Handle case where medicineId might be null if the referenced medicine was deleted
                const medicineDetails = medItem.medicineId || {
                    _id: null,
                    name: medItem.name || "Unknown (Deleted Product)",
                    imageUrl: "/images/default-medicine.png",
                    manufacturer: "N/A"
                };

                // Determine the effective status for display
                const isOverallCompleted = purchase.isCompleted || purchase.paymentStatus === 'Delivered' || purchase.paymentStatus === 'Completed';
                let finalItemStatus = medItem.status || 'Paid'; // Default to item status or 'Paid'

                if (finalItemStatus !== 'Canceled' && isOverallCompleted) {
                    // If overall purchase is complete and item not canceled, show the overall status
                    finalItemStatus = purchase.paymentStatus; // Should be 'Delivered' or 'Completed'
                }

                 // Determine if item can be cancelled
                 const canCancelItem = (medItem.status === 'Paid') && !isOverallCompleted && finalItemStatus !== 'Canceled';


                return {
                    // Item specific details
                    purchaseId: purchase._id,
                    medicineItemId: medItem._id,
                    medicineId: medicineDetails._id,
                    name: medicineDetails.name,
                    imageUrl: medicineDetails.imageUrl || "/images/default-medicine.png",
                    manufacturer: medicineDetails.manufacturer || "N/A",
                    pricePaid: medItem.price || 0, // Ensure price exists
                    quantity: medItem.quantity,

                    // Status fields
                    itemStatus: finalItemStatus, // The derived status to display on frontend
                    _originalItemStatus: medItem.status || 'Paid', // Keep original for potential logic
                    overallPurchaseStatus: purchase.paymentStatus, // Include overall status for context
                    isPurchaseCompleted: purchase.isCompleted,     // Include completed flag

                    // Other info
                    dateOfPurchase: purchase.dateOfPurchase || purchase.createdAt,
                    cancellable: canCancelItem, // Use the derived cancellable status

                };
            })
        );

        res.status(200).json({ success: true, medicines: myMedicines });
    } catch (error) {
        console.error("🔥 Error in getMyMedicines:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Server Error fetching medicines.", error: error.message });
    }
};

const cancelOrder = async (req, res) => {
    const { purchaseId, medicineItemId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not logged in." });
    }
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ success: false, message: "Invalid Purchase ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(medicineItemId)) {
        return res.status(400).json({ success: false, message: "Invalid Medicine Item ID format." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await purchaseModel.findOne({
            _id: purchaseId,
            userId: userId,
            "medicines._id": medicineItemId
        }).session(session);

        if (!purchase) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Purchase containing the specified item not found or access denied." });
        }

        const itemIndex = purchase.medicines.findIndex(med => med._id.toString() === medicineItemId);

        if (itemIndex === -1) {
            await session.abortTransaction();
            session.endSession();
            console.error(`CRITICAL Data Inconsistency: Purchase ${purchaseId} found for user ${userId}, but item ${medicineItemId} missing internally.`);
            return res.status(500).json({ success: false, message: "Internal server error: Could not locate item within the purchase data." });
        }

        const medicineItemToCancel = purchase.medicines[itemIndex];

        const cancelableStatuses = ['Paid', 'Processing'];
        const currentItemStatus = medicineItemToCancel.status || 'Paid';

        if (!cancelableStatuses.includes(currentItemStatus)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: `Cannot cancel item. Current status is '${currentItemStatus}'. Only items with status(es) '${cancelableStatuses.join(', ')}' can be canceled.`
            });
        }

        const medicineIdToRestore = medicineItemToCancel.medicineId;
        const quantityToRestore = medicineItemToCancel.quantity;

        const stockUpdateResult = await medicineModel.findByIdAndUpdate(
            medicineIdToRestore,
            { $inc: { quantity: quantityToRestore } },
            { new: true, session }
        );

        if (!stockUpdateResult) {
            await session.abortTransaction();
            session.endSession();
            console.error(`Cancel Failed: Medicine product ${medicineIdToRestore} not found for stock restoration. Purchase: ${purchaseId}, Item: ${medicineItemId}.`);
            return res.status(404).json({ success: false, message: "Cannot cancel: The original medicine product for this item could not be found to restore stock." });
        }
        console.log(`Stock restored for medicine ${medicineIdToRestore}: +${quantityToRestore}, New Quantity: ${stockUpdateResult.quantity}`);

        purchase.medicines[itemIndex].status = 'Canceled';
        purchase.medicines[itemIndex].canceledAt = new Date();
        purchase.markModified('medicines');

        const allItemsCanceled = purchase.medicines.every(item => item.status === 'Canceled');

        if (allItemsCanceled) {
            purchase.paymentStatus = 'Canceled';
            purchase.cancelled = true;
            purchase.cancelledAt = new Date();
            console.log(`Purchase ${purchaseId} fully canceled as all items are now canceled.`);
        } else {
            console.log(`Item ${medicineItemId} canceled in purchase ${purchaseId}. Other items remain.`);
        }

        await purchase.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Medicine item canceled successfully.",
            purchaseId: purchaseId,
            medicineItemId: medicineItemId,
            newStatus: 'Canceled',
            canceledAt: purchase.medicines[itemIndex].canceledAt,
            overallPurchaseStatus: purchase.paymentStatus
        });

    } catch (error) {
        await session.abortTransaction();
        console.error(`Cancel Order Item Error: User=${userId}, Purchase=${purchaseId}, Item=${medicineItemId}. Error: ${error.message}`, error.stack);
        res.status(500).json({
            success: false,
            message: "Server error while attempting to cancel the medicine item. Please try again later.",
        });
    } finally {
        session.endSession();
    }
};

const getAllPurchases = async (req, res) => {
    try {
        const purchases = await purchaseModel.find()
            .populate({ path: "medicines.medicineId", select: "name discountedPrice" })
            .populate({ path: "userId", select: "name phoneNumber email imageUrl" })
            .sort({ dateOfPurchase: -1 }) // Latest purchases first
            .lean();

        if (!purchases || purchases.length === 0) {
            return res.status(200).json({ success: true, purchases: [], message: "No purchases found." });
        }

        res.status(200).json({ success: true, purchases });
    } catch (error) {
        console.error("🔥 Error fetching purchases:", error);
        res.status(500).json({ success: false, message: "Server error fetching purchases." });
    }
};

const confirmOrder = async (req, res) => {
    const { purchaseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ success: false, message: "Invalid Purchase ID format." });
    }

    try {
        const purchase = await purchaseModel.findById(purchaseId);

        if (!purchase) {
            return res.status(404).json({ success: false, message: "Purchase not found." });
        }

        if (purchase.isCompleted) {
            return res.status(200).json({ success: true, message: "Purchase already marked as completed.", purchase });
        }

        if (purchase.paymentStatus === 'Canceled' || purchase.paymentStatus === 'Partially Canceled') {
             return res.status(400).json({ success: false, message: `Cannot confirm a purchase with status: ${purchase.paymentStatus}` });
        }

        purchase.isCompleted = true;
        purchase.paymentStatus = 'Completed';

        const updatedPurchase = await purchase.save();

        res.status(200).json({
            success: true,
            message: "Purchase confirmed successfully.",
            purchase: updatedPurchase
        });

    } catch (error) {
        console.error(`Error confirming purchase ${purchaseId}:`, error);
        res.status(500).json({ success: false, message: "Server error while confirming purchase.", error: error.message });
    }
};

const deletePurchase = async (req, res) => {
    const { purchaseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ success: false, message: "Invalid Purchase ID format." });
    }

    try {
        const purchase = await purchaseModel.findById(purchaseId);

        if (!purchase) {
            return res.status(404).json({ success: false, message: "Purchase not found." });
        }

        if (purchase.cancelled) {
            return res.status(400).json({ success: false, message: "Purchase is already cancelled." });
        }

        purchase.cancelled = true;
        purchase.paymentStatus = 'Refunded'; // or 'Canceled' if you add that to enum
        purchase.canceledAt = new Date();

        const updated = await purchase.save();

        res.status(200).json({ success: true, message: "Purchase cancelled successfully.", purchase: updated });

    } catch (error) {
        console.error(`Error cancelling purchase ${purchaseId}:`, error);
        res.status(500).json({ success: false, message: "Server error while cancelling purchase.", error: error.message });
    }
};


const adminCancelEntirePurchase = async (req, res) => {
    const { purchaseId } = req.params; // <<< Get ID from URL parameters
    const adminUserId = req.user?._id; // For logging

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ success: false, message: "Invalid Purchase ID format." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await purchaseModel.findById(purchaseId).session(session);

        if (!purchase) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ success: false, message: "Purchase not found." });
        }

        // Check if already cancelled or completed/delivered
        const nonCancellableStatuses = ['Canceled', 'Delivered', 'Refunded', 'Completed']; // Add Completed if used
        if (nonCancellableStatuses.includes(purchase.paymentStatus) || purchase.cancelled || purchase.isCompleted) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ success: false, message: `Purchase cannot be canceled. Current status: ${purchase.paymentStatus}` });
        }

        // --- Restore Stock for non-canceled items ---
        let stockRestoreError = null;
        for (const med of purchase.medicines) {
            if (med.status !== 'Canceled' && med.medicineId) {
                try {
                    const updateResult = await medicineModel.findByIdAndUpdate(
                        med.medicineId,
                        { $inc: { quantity: med.quantity } },
                        { session, new: true }
                    );
                    if (!updateResult) {
                         console.warn(`Stock restore warning: Medicine ${med.medicineId} not found during purchase ${purchaseId} cancellation.`);
                         // Decide if this should fail the transaction or just warn
                    }
                    // Update item status within the purchase doc
                    med.status = 'Canceled';
                } catch (err) {
                     stockRestoreError = err;
                     console.error(`Error restoring stock for med ${med.medicineId} in purchase ${purchaseId}:`, err);
                     break;
                }
            }
        }

        if (stockRestoreError) {
             await session.abortTransaction(); session.endSession();
             return res.status(500).json({ success: false, message: "Error during stock restoration. Purchase not canceled.", error: stockRestoreError.message });
        }
        // --- End Stock Restore ---

        // Update overall purchase status
        purchase.paymentStatus = 'Canceled'; // <<< Make sure 'Canceled' is in your schema enum!
        purchase.cancelled = true;
        purchase.canceledAt = new Date();
        purchase.isCompleted = false;
        purchase.markModified('medicines');

        await purchase.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase canceled successfully by admin.",
            purchase
        });

    } catch (error) {
        await session.abortTransaction();
        console.error(`Admin Cancel Purchase Error: Admin ${adminUserId}, Purchase ${purchaseId}`, error);
        // Check for validation errors specifically (e.g., if 'Canceled' isn't in enum)
         if (error.name === 'ValidationError') {
              return res.status(400).json({ success: false, message: `Validation Error: ${error.message}`, details: error.errors });
         }
        res.status(500).json({ success: false, message: "Server error while canceling purchase.", error: error.message });
    } finally {
        session.endSession();
    }
};

// Make sure all necessary functions are exported
export { buyMedicine, verifyPayment, getMyMedicines, cancelOrder ,getAllPurchases,confirmOrder,deletePurchase,adminCancelEntirePurchase};