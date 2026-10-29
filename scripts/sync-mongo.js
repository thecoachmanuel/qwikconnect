const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb+srv://qwikconnect:yza5POzBBpnnLeS2@cluster0.8r3acxq.mongodb.net/';
const dbName = 'qixer';

async function syncMongo() {
  console.log('Connecting to MongoDB Atlas at', uri.replace(/:([^@]+)@/, ':****@'), '...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas!');
    const db = client.db(dbName);

    // 1. Generate standard bcrypt hash for default password '12345678'
    const defaultHash = await bcrypt.hash('12345678', 10);
    console.log('Generated default bcrypt password hash.');

    // 2. Update existing users with passwords and normalized data
    const usersCol = db.collection('users');
    const existingUsers = await usersCol.find({}).toArray();
    console.log(`Found ${existingUsers.length} users in Atlas.`);

    for (const u of existingUsers) {
      const updateFields = {};
      if (!u.password) {
        updateFields.password = defaultHash;
      }
      if (u.user_status === undefined) {
        updateFields.user_status = 1;
      }
      if (!u.email_verified) {
        updateFields.email_verified = '1';
      }
      if (!u.country) {
        updateFields.country = 'Nigeria';
      }

      if (Object.keys(updateFields).length > 0) {
        await usersCol.updateOne({ _id: u._id }, { $set: updateFields });
        console.log(`Updated user ${u.id} (${u.username}): added password hash and verified status.`);
      }
    }

    // 3. Ensure Settings collection has payment_gateways configured
    const settingsCol = db.collection('settings');
    const existingGatewaysDoc = await settingsCol.findOne({ type: 'payment_gateways' });

    const defaultPaymentGateways = [
      {
        id: 'paystack',
        name: 'Paystack Payment Gateway',
        icon: 'las la-credit-card',
        enabled: true,
        sandbox: true,
        fields: {
          public_key: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_a7e58f850adce9a73750e61668d4f492f67abcd9',
          secret_key: process.env.PAYSTACK_SECRET_KEY || 'sk_test_2a458001d806c878aba51955b962b3c8ed78f04b',
          merchant_email: 'merchant@qwikconnect.ng',
        },
      },
      {
        id: 'flutterwave',
        name: 'Flutterwave',
        icon: 'las la-wave-square',
        enabled: true,
        sandbox: true,
        fields: {
          public_key: process.env.FLW_PUBLIC_KEY || 'FLWPUBK_TEST-86cce2ec43c63e09a517290a8347fcab-X',
          secret_key: process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-d37a42d8917db84f1b2f47c125252d0a-X',
        },
      },
      {
        id: 'stripe',
        name: 'Stripe',
        icon: 'lab la-stripe',
        enabled: true,
        sandbox: true,
        fields: {
          publishable_key: process.env.STRIPE_PUBLIC_KEY || '',
          secret_key: process.env.STRIPE_SECRET_KEY || '',
        },
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: 'lab la-paypal',
        enabled: true,
        sandbox: true,
        fields: {
          client_id: process.env.PAYPAL_CLIENT_ID || '',
          secret: process.env.PAYPAL_SECRET || '',
        },
      },
      {
        id: 'cod',
        name: 'Cash On Delivery',
        icon: 'las la-hand-holding-usd',
        enabled: true,
        sandbox: false,
        fields: {
          instructions: 'Pay in cash directly to the service provider upon service completion.',
        },
      },
    ];

    if (!existingGatewaysDoc) {
      await settingsCol.insertOne({
        type: 'payment_gateways',
        data: defaultPaymentGateways,
        updated_at: new Date().toISOString(),
      });
      console.log('Seeded payment_gateways into MongoDB Atlas settings collection.');
    } else {
      console.log('payment_gateways document already exists in Atlas settings.');
    }

    // Platform settings
    const existingPlatformDoc = await settingsCol.findOne({ type: 'platform_settings' });
    if (!existingPlatformDoc) {
      await settingsCol.insertOne({
        type: 'platform_settings',
        data: {
          site_title: 'QwikConnect',
          site_tagline: 'On-Demand Multi-Vendor Service Marketplace',
          usdExchangeRate: 1500,
          currency: 'NGN',
          currency_symbol: '₦',
        },
        updated_at: new Date().toISOString(),
      });
      console.log('Seeded platform_settings into MongoDB Atlas.');
    }

    // 4. Ensure Blogs collection exists and is seeded
    const blogsCol = db.collection('blogs');
    const blogsCount = await blogsCol.countDocuments();
    if (blogsCount === 0) {
      const blogsFile = path.join(__dirname, 'extracted_blogs.json');
      if (fs.existsSync(blogsFile)) {
        const blogsData = JSON.parse(fs.readFileSync(blogsFile, 'utf-8'));
        if (Array.isArray(blogsData) && blogsData.length > 0) {
          await blogsCol.insertMany(blogsData);
          console.log(`Seeded ${blogsData.length} blogs into MongoDB Atlas.`);
        }
      }
    } else {
      console.log(`Atlas has ${blogsCount} blogs.`);
    }

    // 5. Verification: check users again
    const finalUsers = await usersCol.find({}).toArray();
    console.log('--- Current Synced Users in MongoDB Atlas ---');
    for (const u of finalUsers) {
      const isMatch = u.password ? await bcrypt.compare('12345678', u.password) : false;
      console.log(`User: ${u.username} (${u.email}) | Type: ${u.user_type} | Password '12345678' valid: ${isMatch}`);
    }
  } catch (err) {
    console.error('MongoDB Atlas sync error:', err);
  } finally {
    await client.close();
    console.log('Closed MongoDB Atlas connection.');
  }
}

syncMongo();

