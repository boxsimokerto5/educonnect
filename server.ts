import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbVerifyBillPayment } from './src/firebase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares to support JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: Duitku Payment Inquiry (Create Invoice)
  app.post('/api/duitku/inquiry', async (req, res) => {
    try {
      const {
        studentId,
        billId,
        paymentMethod,
        amount,
        billTitle,
        studentName,
        parentEmail,
        parentPhone
      } = req.body;

      if (!studentId || !billId || !amount) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const merchantOrderId = `${studentId}___${billId}`;
      const merchantCode = process.env.DUITKU_MERCHANT_CODE || '';
      const apiKey = process.env.DUITKU_API_KEY || '';
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      // Fallback to Simulator if credentials are not configured
      if (!merchantCode || !apiKey) {
        console.log('[Duitku Inquiry] Credentials missing. Redirecting to Sandbox Simulator.');
        const simulateUrl = `/duitku-simulator?merchantOrderId=${encodeURIComponent(merchantOrderId)}&paymentAmount=${amount}&paymentMethod=${encodeURIComponent(paymentMethod)}&productDetails=${encodeURIComponent(billTitle)}`;
        return res.json({
          statusCode: '00',
          statusMessage: 'SUCCESS (SIMULATOR)',
          paymentUrl: simulateUrl
        });
      }

      // Map payment methods to Duitku standard codes
      // gopay -> GQ, shopeepay -> SP, bca -> BC, mandiri -> M2
      const methodMap: Record<string, string> = {
        gopay: 'GQ',
        shopeepay: 'SP',
        bca: 'BC',
        mandiri: 'M2',
      };
      const paymentMethodCode = methodMap[paymentMethod] || 'NQ'; // Default to QRIS (NQ)

      // Signature: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
      const amountStr = String(amount);
      const signatureSource = merchantCode + merchantOrderId + amountStr + apiKey;
      const signature = crypto.createHash('md5').update(signatureSource).digest('hex');

      // Request Payload for Duitku Inquiry API
      const callbackUrl = `${appUrl}/api/duitku/callback`;
      const returnUrl = `${appUrl}/?payment_success=true`;

      const payload = {
        merchantCode,
        paymentAmount: parseInt(amountStr, 10),
        paymentMethod: paymentMethodCode,
        merchantOrderId,
        productDetails: billTitle,
        additionalParam: '',
        merchantUserInfo: '',
        customerVaName: studentName || 'Wali Murid',
        email: parentEmail || 'wali@example.com',
        phoneNumber: parentPhone || '081234567890',
        itemDetails: [
          {
            name: billTitle,
            price: parseInt(amountStr, 10),
            quantity: 1
          }
        ],
        callbackUrl,
        returnUrl,
        signature,
        expiryPeriod: 1440
      };

      console.log('[Duitku Inquiry] Sending Request:', payload);

      // We'll use sandbox URL by default, or passport (production) if configured
      const isProd = !merchantCode.toLowerCase().startsWith('d'); // Sandbox merchant code typically starts with 'D'
      const duitkuUrl = isProd
        ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
        : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

      const response = await fetch(duitkuUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();
      console.log('[Duitku Inquiry] Response Received:', data);

      if (data && data.statusCode === '00') {
        res.json({
          statusCode: '00',
          statusMessage: data.statusMessage,
          paymentUrl: data.paymentUrl,
          reference: data.reference
        });
      } else {
        res.status(400).json({
          error: data?.statusMessage || 'Failed to create payment with Duitku'
        });
      }
    } catch (error: any) {
      console.error('[Duitku Inquiry] Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // API Route: Duitku IPN Callback
  app.post('/api/duitku/callback', async (req, res) => {
    try {
      const {
        merchantCode,
        amount,
        merchantOrderId,
        signature,
        resultCode,
        reference,
        paymentCode
      } = req.body;

      console.log('[Duitku Callback] Received payload:', req.body);

      const apiKey = process.env.DUITKU_API_KEY || '';

      // Verify signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
      const signatureSource = (merchantCode || '') + (amount || '') + (merchantOrderId || '') + apiKey;
      const calculatedSignature = crypto.createHash('md5').update(signatureSource).digest('hex');

      if (apiKey && calculatedSignature !== signature) {
        console.error('[Duitku Callback] Signature verification failed. Calculated:', calculatedSignature, 'Received:', signature);
        return res.status(400).send('Invalid signature');
      }

      // resultCode "00" indicates successful payment
      if (resultCode === '00') {
        const [studentId, billId] = merchantOrderId.split('___');
        if (studentId && billId) {
          console.log(`[Duitku Callback] Updating bill payment to Paid. Student: ${studentId}, Bill: ${billId}`);
          await dbVerifyBillPayment(studentId, billId, true);
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('[Duitku Callback] Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // API Route: Simulation of callback from local mock page
  app.post('/api/duitku/simulate-callback', async (req, res) => {
    try {
      const { merchantOrderId } = req.body;
      if (!merchantOrderId) {
        return res.status(400).json({ error: 'Missing merchantOrderId' });
      }

      console.log('[Duitku Simulator Callback] Triggered for:', merchantOrderId);
      const [studentId, billId] = merchantOrderId.split('___');
      if (studentId && billId) {
        await dbVerifyBillPayment(studentId, billId, true);
        return res.json({ success: true, message: 'Simulated payment callback successfully!' });
      }
      res.status(400).json({ error: 'Invalid merchantOrderId format' });
    } catch (error: any) {
      console.error('[Duitku Simulator Callback] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve Frontend / Integrate Vite Middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
