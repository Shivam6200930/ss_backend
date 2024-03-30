import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';
import transporter from "../config/emailConfig.js";
const instance = new Razorpay({
    key_id: process.env.payment_key_id,
    key_secret: process.env.payment_key_secret
});

const payment_generated = async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: amount,
        currency: 'INR',
        receipt: 'receipt#1',
        payment_capture: 0,
    };
    try {
        const response = await instance.orders.create(options); 
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong!');
    }
}

const payment = async (req, res) => {
    const paymentId = req.params.paymentId;
    const amount = req.body.amount;
    const email_user = req.body.email;

    if (!email_user) {
        return res.status(400).send('Email is required');
    }

    try {
         instance.payments.capture(paymentId, amount);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email_user,
            subject: "Payment Successful",
            text: `Your payment amount: ${(amount/100)} has been successfully processed. Your product will be delivered as soon as possible.`
        };

        console.log('Mail options:', mailOptions);

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending email');
            } else {
                console.log(`Email sent: ${info.response}`);
                res.send({ status: "success", message: "Email sent successfully" });
            }
        });
    } catch (error) {
        console.error('Error capturing payment:', error);
        res.status(500).send('Error capturing payment');
    }
};

const verify=async(res,req)=>{
    const { Razorpay_payment_id, Razorpay_order_id, Razorpay_signature } = req.body;
    const payload = `${Razorpay_order_id}|${Razorpay_payment_id}`;
    try {
      const isValidSignature = Razorpay.validateWebhookSignature(payload, Razorpay_signature);
  
      if (isValidSignature) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
}

export  { payment_generated, payment,verify }; 
