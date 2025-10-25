const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
    }
    const amount = Math.round(cart.totalPrice * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { userId: req.user.id.toString() }
    });
    const order = await Order.create({
      userId: req.user.id,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        price: item.price,
        image: item.productId.images[0]
      })),
      totalAmount: cart.totalPrice,
      shippingAddress,
      paymentInfo: { stripePaymentIntentId: paymentIntent.id, paymentStatus: 'pending' }
    });
    res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, orderId: order._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating payment intent', error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.paymentInfo.paymentStatus = 'completed';
    order.orderStatus = 'processing';
    order.statusHistory.push({ status: 'processing', note: 'Payment completed successfully' });
    await order.save();
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [], totalPrice: 0 });
    res.status(200).json({ success: true, message: 'Payment confirmed', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error confirming payment', error: error.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  res.json({ received: true });
};
