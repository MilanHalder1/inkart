'use strict';

const Order = require('../models/Order');
const User = require('../models/User');

const { generateInvoice } = require('../utilities/invoice');
const { uploadInvoiceToCloudinary } = require('../utilities/cloudinaryUploadfFunction');
const {
    sendInvoiceEmail
} = require('../config/order');

const shiprocketWebhook = async (req, res) => {

    try {

        const payload = req.body;

        console.log(
            "SHIPROCKET WEBHOOK",
            JSON.stringify(payload, null, 2)
        );

        // ===============================
        // FIND ORDER
        // ===============================

        const order = await Order.findOne({

            $or: [

                {
                    "shipment.awb":
                        payload.awb ||
                        payload.awb_code
                },

                {
                    "shipment.shipmentId":
                        payload.shipment_id
                },

                {
                    "shipment.shiprocketOrderId":
                        payload.order_id
                }

            ]

        });

        if (!order) {

            console.log("Order not found");

            return res.status(404).send("Order not found");
        }

        // ===============================
        // UPDATE SHIPMENT DETAILS
        // ===============================

        order.shipment.awb =
            payload.awb ||
            payload.awb_code ||
            order.shipment.awb;

        order.shipment.courier =
            payload.courier_name ||
            payload.courier ||
            order.shipment.courier;

        order.shipment.trackingUrl =
            payload.tracking_url ||
            order.shipment.trackingUrl;

        order.shipment.manifestUrl =
            payload.manifest_url ||
            order.shipment.manifestUrl;

        order.shipment.labelUrl =
            payload.label_url ||
            order.shipment.labelUrl;

        order.shipment.pickupToken =
            payload.pickup_token ||
            order.shipment.pickupToken;

        order.shipment.status =
            payload.current_status ||
            payload.status ||
            order.shipment.status;

        order.shipment.lastTrackingUpdate =
            new Date();

        order.shipment.lastShiprocketError =
            null;

        if (payload.estimated_delivery_date) {

            order.shipment.estimatedDeliveryDate =
                new Date(payload.estimated_delivery_date);

        }

        // ===============================
        // MAP SHIPROCKET STATUS
        // ===============================

        let orderStatus =
            order.orderStatus;

        switch (
            (payload.current_status || "").toUpperCase()
        ) {

            case "NEW":
                orderStatus = "placed";
                break;

            case "PICKED UP":
                orderStatus = "processing";
                break;

            case "IN TRANSIT":
            case "OUT FOR DELIVERY":
                orderStatus = "shipped";
                break;

            case "DELIVERED":
                orderStatus = "delivered";
                order.deliveredAt = new Date();
                break;

            case "CANCELLED":
                orderStatus = "cancelled";
                break;

        }

        order.orderStatus = orderStatus;

        order.statusHistory.push({

            status: orderStatus,

            note: `Shiprocket : ${payload.current_status}`,

            timestamp: new Date()

        });

        await order.save();

        // ====================================
        // COD INVOICE
        // ====================================

        if (

            orderStatus === "delivered" &&

            order.paymentMethod === "cod" &&

            !order.invoiceUrl

        ) {

            const user =
                await User.findById(order.user);

            const buffer =
                await generateInvoice(order);

            const upload =
                await uploadInvoiceToCloudinary(
                    buffer,
                    order.orderNumber
                );

            order.invoiceUrl =
                upload.secure_url;

            await order.save();

            await sendInvoiceEmail(
                user,
                order,
                buffer
            );
        }

        return res
            .status(200)
            .send("Webhook Success");

    }

    catch (err) {

        console.log(err);

        return res
            .status(500)
            .send("Webhook Error");
    }

};

module.exports = {
    shiprocketWebhook
};