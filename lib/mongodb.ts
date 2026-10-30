import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
let seedBlogs: any[] = [];
try {
  const blogsPath = path.join(process.cwd(), 'scripts', 'extracted_blogs.json');
  if (fs.existsSync(blogsPath)) {
    seedBlogs = JSON.parse(fs.readFileSync(blogsPath, 'utf-8'));
  }
} catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qwikconnect:yza5POzBBpnnLeS2@cluster0.8r3acxq.mongodb.net/';
const DB_NAME = 'qixer';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// File-backed fallback store path for resilience when MongoDB server is offline
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'qixer-mongo.json');

// Initial seed data with updated categories (Electrical Repair, Cleaning, Plumbing, etc.)
const SEED_DATA = {
  categories: [
    { id: 1, name: 'Electrical Repair', slug: 'electrical-repair', icon: 'las la-bolt', description: 'Certified wiring, fixture installation, and power troubleshooting', status: 1 },
    { id: 2, name: 'Cleaning Services', slug: 'cleaning-services', icon: 'las la-broom', description: 'Deep home cleaning, office janitorial and sanitization', status: 1 },
    { id: 3, name: 'Plumbing Solutions', slug: 'plumbing-solutions', icon: 'las la-wrench', description: 'Pipe leak repairs, drainage, borehole and water heaters', status: 1 },
    { id: 4, name: 'Painting & Renovation', slug: 'painting-renovation', icon: 'las la-paint-roller', description: 'Interior/exterior wall screeding, painting and finishing', status: 1 },
    { id: 5, name: 'AC & Refrigeration Repair', slug: 'ac-refrigeration-repair', icon: 'las la-snowflake', description: 'Air conditioner installation, gas refills and maintenance', status: 1 },
    { id: 6, name: 'Salon & Spa', slug: 'salon-spa', icon: 'las la-spa', description: 'Luxury hair styling, facial therapy, manicure, massage & spa treatments', status: 1 },
    { id: 7, name: 'Carpentry & Furniture', slug: 'carpentry-furniture', icon: 'las la-hammer', description: 'Custom woodwork, kitchen cabinets, doors and wardrobes', status: 1 },
    { id: 8, name: 'Home Relocation & Moving', slug: 'home-relocation-moving', icon: 'las la-people-carry', description: 'Packing, household relocation and truck moving services', status: 1 },
  ],
  services: [
    {
      id: 1,
      title: 'Full Home & Office Deep Cleaning & Sanitization',
      slug: 'full-home-deep-cleaning',
      price: 35000.0,
      image: '/assets/uploads/media-uploader/service_cleaning_nigerian.jpg',
      city: 'Lagos',
      country: 'Nigeria',
      seller_id: 2,
      category_id: 2,
      category_slug: 'cleaning-services',
      status: 1,
      created_at: new Date('2026-09-15').toISOString(),
    },
    {
      id: 2,
      title: 'Emergency Residential Electrical Repair & Inverter Setup',
      slug: 'emergency-residential-electrical-repair',
      price: 25000.0,
      image: '/assets/uploads/media-uploader/service_electrical_nigerian.jpg',
      city: 'Abuja',
      country: 'Nigeria',
      seller_id: 3,
      category_id: 1,
      category_slug: 'electrical-repair',
      status: 1,
      created_at: new Date('2026-09-20').toISOString(),
    },
    {
      id: 3,
      title: 'Complete Plumbing Leak Detection & Borehole Pipe Repair',
      slug: 'plumbing-leak-detection',
      price: 20000.0,
      image: '/assets/uploads/media-uploader/service_plumbing_nigerian.jpg',
      city: 'Abuja',
      country: 'Nigeria',
      seller_id: 3,
      category_id: 3,
      category_slug: 'plumbing-solutions',
      status: 1,
      created_at: new Date('2026-09-25').toISOString(),
    },
    {
      id: 4,
      title: 'Professional Interior & Exterior Wall Screeding and Painting',
      slug: 'professional-interior-painting',
      price: 50000.0,
      image: '/assets/uploads/media-uploader/service_painting_nigerian.jpg',
      city: 'Lagos',
      country: 'Nigeria',
      seller_id: 6,
      category_id: 4,
      category_slug: 'painting-renovation',
      status: 1,
      created_at: new Date('2026-10-01').toISOString(),
    },
    {
      id: 5,
      title: 'Split Unit AC Servicing, Chemical Cleaning & Gas Refill',
      slug: 'ac-servicing-gas-refill',
      price: 18000.0,
      image: '/assets/uploads/media-uploader/service_ac_repair_nigerian.jpg',
      city: 'Lagos',
      country: 'Nigeria',
      seller_id: 2,
      category_id: 5,
      category_slug: 'ac-refrigeration-repair',
      status: 1,
      created_at: new Date('2026-10-05').toISOString(),
    },
    {
      id: 6,
      title: 'Luxury Hair Styling, Facial Therapy & Full Body Spa Treatment',
      slug: 'luxury-hair-styling-facial-body-spa',
      price: 30000.0,
      image: '/assets/uploads/media-uploader/service_salon_spa_nigerian.jpg',
      city: 'Lagos',
      country: 'Nigeria',
      seller_id: 6,
      category_id: 6,
      category_slug: 'salon-spa',
      status: 1,
      created_at: new Date('2026-10-10').toISOString(),
    },
    {
      id: 7,
      title: 'Custom Wooden Kitchen Cabinets & Wardrobe Construction',
      slug: 'custom-wooden-cabinets-wardrobe',
      price: 75000.0,
      image: '/assets/uploads/media-uploader/service_carpentry_nigerian.jpg',
      city: 'Abuja',
      country: 'Nigeria',
      seller_id: 3,
      category_id: 7,
      category_slug: 'carpentry-furniture',
      status: 1,
      created_at: new Date('2026-10-14').toISOString(),
    },
    {
      id: 8,
      title: 'Household Furniture Relocation, Packing & Interstate Transport',
      slug: 'household-furniture-relocation',
      price: 65000.0,
      image: '/assets/uploads/media-uploader/service_moving_nigerian.jpg',
      city: 'Lagos',
      country: 'Nigeria',
      seller_id: 2,
      category_id: 8,
      category_slug: 'home-relocation-moving',
      status: 1,
      created_at: new Date('2026-10-16').toISOString(),
    },
  ],
  users: [
    {
      id: 1,
      name: 'Super Admin',
      email: 'admin@qixer.com',
      username: 'super_admin',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 801 234 5678',
      user_type: 0,
      role: 'admin',
      user_status: 1,
      email_verified: '1',
      created_at: new Date('2024-01-15').toISOString(),
    },
    {
      id: 2,
      name: 'Chioma Adebayo',
      email: 'chioma.adebayo@qwikconnect.ng',
      username: 'chioma_adebayo',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 802 345 6789',
      user_type: 0, // Seller
      role: 'seller',
      user_status: 1,
      email_verified: '1',
      service_city: 'Lagos',
      service_area: 'Ikeja GRA & Lekki',
      country: 'Nigeria',
      address: 'Plot 14, Commercial Avenue, Ikeja, Lagos',
      post_code: '100271',
      tax_number: 'TIN-24890123-001',
      experience: '8+ Years Professional Experience',
      about: 'Certified residential & commercial sanitation expert with 8+ years experience across Lagos mainland and island. Specialized in post-construction deep cleaning, office hygiene maintenance, and eco-friendly fumigation.',
      specialities: 'Deep Home Cleaning, Post-Construction Cleaning & Office Janitorial',
      image: '/assets/uploads/media-uploader/banner21638339592_1792934035963.jpg',
      profile_background: '/assets/uploads/media-uploader/banner11638279446.png',
      created_at: new Date('2024-02-10').toISOString(),
    },
    {
      id: 3,
      name: 'Babajide Olatunji',
      email: 'babajide.olatunji@qwikconnect.ng',
      username: 'babajide_olatunji',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 803 456 7890',
      user_type: 0, // Seller
      role: 'seller',
      user_status: 1,
      email_verified: '1',
      service_city: 'Abuja',
      service_area: 'Maitama, Wuse II & Garki',
      country: 'Nigeria',
      address: 'Suite 4B, Ahmadu Bello Way, Area 11, Garki, Abuja',
      post_code: '900103',
      tax_number: 'TIN-18765432-002',
      experience: '10+ Years Licensed Contractor',
      about: 'COREN-registered electrical engineer and licensed master plumber with over 10 years of hands-on expertise across the Federal Capital Territory. Proven track record in solar inverter installations, heavy-duty surge protection, distribution board upgrades, and precision borehole plumbing.',
      specialities: 'Solar/Inverter Installation, Electrical Wiring & Borehole Plumbing Repair',
      image: null,
      profile_background: null,
      created_at: new Date('2024-03-01').toISOString(),
    },
    {
      id: 4,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      username: 'emmaw',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 804 567 8901',
      user_type: 1, // Buyer
      role: 'buyer',
      user_status: 1,
      email_verified: '1',
      created_at: new Date('2024-03-12').toISOString(),
    },
    {
      id: 5,
      name: 'Michael Chen',
      email: 'mchen@example.com',
      username: 'mchen',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 805 678 9012',
      user_type: 1, // Buyer
      role: 'buyer',
      user_status: 1,
      email_verified: '1',
      created_at: new Date('2024-04-05').toISOString(),
    },
    {
      id: 6,
      name: 'Ngozi Dike',
      email: 'ngozi.dike@qwikconnect.ng',
      username: 'ngozi_dike',
      password: '$2b$10$C6llWhobKHh2n3bYqr3vV.fAIryE3/Jiwr8tA0ju0ssVzeoS4IPjm',
      phone: '+234 806 789 0123',
      user_type: 0, // Seller
      role: 'seller',
      user_status: 1,
      email_verified: '1',
      service_city: 'Lagos',
      service_area: 'Victoria Island, Ikoyi & Lekki Phase 1',
      country: 'Nigeria',
      address: '18 Adeola Odeku Street, Victoria Island, Lagos',
      post_code: '101241',
      tax_number: 'TIN-31094857-003',
      experience: '7+ Years Artisan & Stylist',
      about: 'Lead aesthetics artisan, professional wall screeder, and celebrity stylist with 7+ years of experience transforming luxury homes and event styling in Lagos. Renowned for flawless Venetian wall screeding, waterproof exterior emulsion, luxury bridal hair styling, and rejuvenating spa treatments.',
      specialities: 'Luxury Hair Styling, Venetian Wall Screeding & Holistic Spa Therapy',
      image: null,
      profile_background: null,
      created_at: new Date('2024-04-18').toISOString(),
    },
  ],
  orders: [
    {
      id: 101,
      seller_id: 2,
      buyer_id: 4,
      service_id: 1,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-25',
      schedule: '09:00 AM - 12:00 PM',
      package_fee: 35000.0,
      total: 35000.0,
      tax: 0,
      commission_amount: 3500,
      payment_gateway: 'cash_on_delivery',
      payment_status: 'complete',
      status: 2, // Completed
      order_note: 'Please arrive before noon.',
      created_at: new Date('2026-10-22').toISOString(),
    },
    {
      id: 102,
      seller_id: 3,
      buyer_id: 5,
      service_id: 2,
      name: 'Michael Chen',
      email: 'mchen@example.com',
      phone: '+234 805 678 9012',
      address: '22 Gana Street, Maitama, Abuja',
      city: 'Abuja',
      date: '2026-10-26',
      schedule: '02:00 PM - 05:00 PM',
      package_fee: 25000.0,
      total: 25000.0,
      tax: 0,
      commission_amount: 2500,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2, // Completed
      order_note: 'Main inverter breaker needs testing.',
      created_at: new Date('2026-10-21').toISOString(),
    },
    {
      id: 103,
      seller_id: 2,
      buyer_id: 4,
      service_id: 5,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-28',
      schedule: '11:00 AM - 01:00 PM',
      package_fee: 18000.0,
      total: 18000.0,
      payment_gateway: 'paystack',
      payment_status: 'pending',
      status: 0, // Pending
      order_note: '',
      created_at: new Date('2026-10-23').toISOString(),
    },
    {
      id: 104,
      seller_id: 2,
      buyer_id: 4,
      service_id: 1,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-18',
      schedule: '09:00 AM - 01:00 PM',
      package_fee: 120000.0,
      tax: 0,
      commission_amount: 12000,
      total: 120000.0,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2,
      order_note: 'Whole house move-in cleaning',
      created_at: new Date('2026-10-18T10:00:00.000Z').toISOString(),
    },
    {
      id: 105,
      seller_id: 2,
      buyer_id: 5,
      service_id: 6,
      name: 'Michael Chen',
      email: 'mchen@example.com',
      phone: '+234 805 678 9012',
      address: '22 Gana Street, Maitama, Abuja',
      city: 'Abuja',
      date: '2026-10-15',
      schedule: '08:00 AM - 04:00 PM',
      package_fee: 85000.0,
      tax: 0,
      commission_amount: 8500,
      total: 85000.0,
      payment_gateway: 'stripe',
      payment_status: 'complete',
      status: 2,
      order_note: 'Living room and hallway',
      created_at: new Date('2026-10-15T08:30:00.000Z').toISOString(),
    },
    {
      id: 106,
      seller_id: 2,
      buyer_id: 4,
      service_id: 1,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-10',
      schedule: '10:00 AM - 01:00 PM',
      package_fee: 60000.0,
      tax: 0,
      commission_amount: 6000,
      total: 60000.0,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2,
      order_note: 'Post-event cleanup',
      created_at: new Date('2026-10-10T11:00:00.000Z').toISOString(),
    },
    {
      id: 107,
      seller_id: 3,
      buyer_id: 4,
      service_id: 2,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-12',
      schedule: '02:00 PM - 05:00 PM',
      package_fee: 80000.0,
      tax: 0,
      commission_amount: 8000,
      total: 80000.0,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2,
      order_note: 'Circuit breaker diagnosis',
      created_at: new Date('2026-10-12T14:00:00.000Z').toISOString(),
    },
    {
      id: 108,
      seller_id: 3,
      buyer_id: 5,
      service_id: 2,
      name: 'Michael Chen',
      email: 'mchen@example.com',
      phone: '+234 805 678 9012',
      address: '22 Gana Street, Maitama, Abuja',
      city: 'Abuja',
      date: '2026-10-08',
      schedule: '09:00 AM - 01:00 PM',
      package_fee: 95000.0,
      tax: 0,
      commission_amount: 9500,
      total: 95000.0,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2,
      order_note: 'Inverter wiring backup system',
      created_at: new Date('2026-10-08T09:30:00.000Z').toISOString(),
    },
    {
      id: 109,
      seller_id: 6,
      buyer_id: 4,
      service_id: 4,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+234 804 567 8901',
      address: 'Plot 14 Victoria Island, Lagos',
      city: 'Lagos',
      date: '2026-10-19',
      schedule: '10:00 AM - 12:00 PM',
      package_fee: 50000.0,
      tax: 0,
      commission_amount: 5000,
      total: 50000.0,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      status: 2,
      order_note: 'Regular AC service',
      created_at: new Date('2026-10-19T10:00:00.000Z').toISOString(),
    },
    {
      id: 110,
      seller_id: 6,
      buyer_id: 5,
      service_id: 4,
      name: 'Michael Chen',
      email: 'mchen@example.com',
      phone: '+234 805 678 9012',
      address: '22 Gana Street, Maitama, Abuja',
      city: 'Abuja',
      date: '2026-10-14',
      schedule: '02:00 PM - 05:00 PM',
      package_fee: 70000.0,
      tax: 0,
      commission_amount: 7000,
      total: 70000.0,
      payment_gateway: 'stripe',
      payment_status: 'complete',
      status: 2,
      order_note: 'Two bedroom AC units chemical wash',
      created_at: new Date('2026-10-14T14:30:00.000Z').toISOString(),
    },
  ],
  payouts: [
    {
      id: 101,
      seller_id: 2,
      amount: 150000.0,
      payment_gateway: 'Bank Transfer (Paystack)',
      seller_note: 'Payout for October services',
      admin_note: 'Processed via Bank transfer #PSTK-99482',
      status: 1, // Completed
      created_at: new Date('2026-10-18').toISOString(),
    },
    {
      id: 102,
      seller_id: 3,
      amount: 85000.0,
      payment_gateway: 'Bank Transfer (Paystack)',
      seller_note: 'Account ending in 4920',
      admin_note: 'Under review by finance',
      status: 0, // Pending
      created_at: new Date('2026-10-22').toISOString(),
    },
  ],
  coupons: [
    {
      id: 1,
      code: 'SAVE20NOW',
      discount: 20,
      discount_type: 'percentage',
      expire_date: '2026-12-31',
      status: 1,
      seller_id: 2,
      used_count: 14,
      created_at: new Date('2026-10-01').toISOString(),
    },
    {
      id: 2,
      code: 'WELCOME10',
      discount: 10,
      discount_type: 'amount',
      expire_date: '2026-11-15',
      status: 1,
      seller_id: 3,
      used_count: 28,
      created_at: new Date('2026-10-05').toISOString(),
    },
  ],
  reviews: [
    {
      id: 1,
      service_id: 1,
      seller_id: 2,
      buyer_id: 4,
      buyer_name: 'Sophia Anderson',
      rating: 5,
      message: 'Absolutely fantastic work! Arrived right on schedule, extremely courteous and thorough.',
      reply: 'Thank you so much Sophia! Glad to help.',
      status: 1,
      created_at: new Date('2026-10-21').toISOString(),
    },
    {
      id: 2,
      service_id: 2,
      seller_id: 3,
      buyer_id: 5,
      buyer_name: 'Marcus Brody',
      rating: 5,
      message: 'Resolved our circuit breaker tripping issue in less than an hour. Very knowledgeable!',
      status: 1,
      created_at: new Date('2026-10-19').toISOString(),
    },
  ],
  tickets: [
    {
      id: 1042,
      subject: 'Question regarding payout verification timeframe',
      department: 'Billing & Payouts',
      priority: 'normal',
      status: 'resolved',
      description: 'Hello, I submitted a payout request 3 days ago. Could you please confirm if all documents are in order?',
      user_id: 2,
      created_at: new Date('2026-10-18T10:00:00Z').toISOString(),
      admin_reply: 'All documents verified and payout processed to your registered Paystack bank account.',
      replied_at: new Date('2026-10-18T14:30:00Z').toISOString(),
      replies_count: 1,
      messages: [
        {
          id: 1,
          sender: 'seller',
          sender_name: 'Chioma Adebayo',
          message: 'Hello, I submitted a payout request 3 days ago. Could you please confirm if all documents are in order?',
          created_at: new Date('2026-10-18T10:00:00Z').toISOString(),
        },
        {
          id: 2,
          sender: 'admin',
          sender_name: 'Support Team',
          message: 'All documents verified and payout processed to your registered Paystack bank account.',
          created_at: new Date('2026-10-18T14:30:00Z').toISOString(),
        },
      ],
    },
    {
      id: 1058,
      subject: 'Request to update primary service category mapping',
      department: 'Listing Support',
      priority: 'low',
      status: 'in_progress',
      description: 'I would like to update my electrical repair services to also include solar installations.',
      user_id: 3,
      created_at: new Date('2026-10-22T08:15:00Z').toISOString(),
      replies_count: 0,
      messages: [
        {
          id: 1,
          sender: 'seller',
          sender_name: 'Babajide Olatunji',
          message: 'I would like to update my electrical repair services to also include solar installations.',
          created_at: new Date('2026-10-22T08:15:00Z').toISOString(),
        },
      ],
    },
    {
      id: 1065,
      subject: 'Request assistance with schedule change for booked service',
      department: 'Customer Care',
      priority: 'normal',
      status: 'open',
      description: 'Hello, I booked a home cleaning for Saturday morning but would like to shift it to 2:00 PM if the seller is available. Thank you!',
      user_id: 4,
      created_at: new Date('2026-10-24T14:30:00Z').toISOString(),
      replies_count: 0,
      messages: [
        {
          id: 1,
          sender: 'buyer',
          sender_name: 'Emma Watson',
          message: 'Hello, I booked a home cleaning for Saturday morning but would like to shift it to 2:00 PM if the seller is available. Thank you!',
          created_at: new Date('2026-10-24T14:30:00Z').toISOString(),
        },
      ],
    },
  ],
  reports: [
    {
      id: 301,
      order_id: '#ORD-849195',
      service_name: 'Plumbing Leak Detection & Pipe Repair',
      seller_name: 'Babajide Olatunji',
      buyer_name: 'Emma Watson',
      seller_id: 3,
      buyer_id: 4,
      report_from: 'buyer',
      report_to: 'seller',
      reason: 'Incomplete Service Scope',
      status: 'resolved',
      admin_decision: 'Provider returned and completed seal replacement. Case closed satisfactorily.',
      description: 'The kitchen sink drain was still dripping slightly after the initial service visit.',
      created_at: new Date('2026-10-10T15:45:00Z').toISOString(),
    },
    {
      id: 302,
      order_id: '#ORD-849102',
      service_name: 'Split Unit AC Servicing & Chemical Cleaning',
      seller_name: 'Chioma Adebayo',
      buyer_name: 'Emma Watson',
      seller_id: 2,
      buyer_id: 4,
      report_from: 'buyer',
      report_to: 'seller',
      reason: 'Technician arrival delayed by 2 hours',
      status: 'under_review',
      admin_decision: 'Dispute submitted and queued for mediator review.',
      description: 'The scheduled booking was for 10:00 AM but technician arrived after 12:15 PM without prior notification.',
      created_at: new Date('2026-10-23T11:00:00Z').toISOString(),
    },
  ],
  messages: [
    {
      id: 1,
      from_user: 4,
      to_user: 2,
      message: 'Hello, what time will the cleaners arrive tomorrow?',
      created_at: new Date('2026-10-22T10:00:00Z').toISOString(),
    },
    {
      id: 2,
      from_user: 2,
      to_user: 4,
      message: 'Hi Emma! Our team is scheduled for 9:00 AM sharp.',
      created_at: new Date('2026-10-22T10:05:00Z').toISOString(),
    },
  ],
  payment_gateways: [
    {
      id: 'paystack',
      name: 'Paystack Payment Gateway',
      icon: 'las la-credit-card',
      enabled: true,
      sandbox: true,
      fields: {
        public_key: 'pk_test_a7e58f850adce9a73750e61668d4f492f67abcd9',
        secret_key: 'sk_test_2a458001d806c878aba51955b962b3c8ed78f04b',
        merchant_email: 'billing@qixer.ng',
      },
    },
    {
      id: 'cod',
      name: 'Cash On Delivery',
      icon: 'las la-hand-holding-usd',
      enabled: false,
      sandbox: false,
      fields: {
        instructions: 'Pay in cash directly to the service provider upon service completion.',
      },
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: 'lab la-stripe',
      enabled: false,
      sandbox: true,
      fields: {
        publishable_key: 'pk_test_51Mz0...sampleStripePub',
        secret_key: 'sk_test_51Mz0...sampleStripeSec',
      },
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'lab la-paypal',
      enabled: false,
      sandbox: true,
      fields: {
        client_id: 'client_id_paypal_demo_sandbox',
        secret: 'secret_key_paypal_demo_sandbox',
      },
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      icon: 'las la-money-bill',
      enabled: false,
      sandbox: true,
      fields: {
        key_id: '',
        key_secret: '',
      },
    },
  ],
  settings: {
    siteTitle: 'QwikConnect - Service Marketplace & Finder',
    siteTagline: 'Connect with top-rated local professionals',
    contactEmail: 'admin@qixer.ng',
    contactPhone: '+234 800 123 4567',
    siteAddress: '14 Broad Street, Lagos Island, Lagos, Nigeria',
    currencySymbol: '₦',
    currencyCode: 'NGN',
    usdExchangeRate: '1500',
    commissionType: 'percentage',
    commissionRate: '10',
    autoApproveServices: false,
    enableLiveChat: true,
    maintenanceMode: false,
    copyrightText: '© 2026 QwikConnect Nigeria. All Rights Reserved.',
  },
  days: [
    { id: 1, day: 'Sat', seller_id: 2, status: 1, total_day: 7 },
    { id: 2, day: 'Sun', seller_id: 2, status: 1, total_day: 7 },
    { id: 3, day: 'Mon', seller_id: 2, status: 1, total_day: 7 },
    { id: 4, day: 'Tue', seller_id: 2, status: 1, total_day: 7 },
    { id: 5, day: 'Wed', seller_id: 2, status: 1, total_day: 7 },
    { id: 6, day: 'Thu', seller_id: 2, status: 1, total_day: 7 },
    { id: 7, day: 'Fri', seller_id: 2, status: 1, total_day: 7 },
    { id: 8, day: 'Sat', seller_id: 3, status: 1, total_day: 7 },
    { id: 9, day: 'Sun', seller_id: 3, status: 1, total_day: 7 },
    { id: 10, day: 'Mon', seller_id: 3, status: 1, total_day: 7 },
    { id: 11, day: 'Tue', seller_id: 3, status: 1, total_day: 7 },
    { id: 12, day: 'Wed', seller_id: 3, status: 1, total_day: 7 },
    { id: 13, day: 'Thu', seller_id: 3, status: 1, total_day: 7 },
    { id: 14, day: 'Fri', seller_id: 3, status: 1, total_day: 7 },
  ],
  schedules: [
    // Seller 2 schedules
    { id: 1, day_id: 1, seller_id: 2, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
    { id: 2, day_id: 1, seller_id: 2, schedule: '11:00 AM - 01:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 3, day_id: 1, seller_id: 2, schedule: '02:00 PM - 04:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 4, day_id: 2, seller_id: 2, schedule: '10:00 AM - 12:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 5, day_id: 2, seller_id: 2, schedule: '02:00 PM - 05:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 6, day_id: 3, seller_id: 2, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
    { id: 7, day_id: 3, seller_id: 2, schedule: '11:00 AM - 01:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 8, day_id: 3, seller_id: 2, schedule: '02:00 PM - 04:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 9, day_id: 3, seller_id: 2, schedule: '04:00 PM - 06:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 10, day_id: 4, seller_id: 2, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
    { id: 11, day_id: 4, seller_id: 2, schedule: '01:00 PM - 03:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 12, day_id: 4, seller_id: 2, schedule: '04:00 PM - 06:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 13, day_id: 5, seller_id: 2, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
    { id: 14, day_id: 5, seller_id: 2, schedule: '11:00 AM - 01:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 15, day_id: 5, seller_id: 2, schedule: '02:00 PM - 04:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 16, day_id: 6, seller_id: 2, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
    { id: 17, day_id: 6, seller_id: 2, schedule: '02:00 PM - 05:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 18, day_id: 7, seller_id: 2, schedule: '09:00 AM - 12:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 19, day_id: 7, seller_id: 2, schedule: '02:00 PM - 05:00 PM', status: 1, allow_multiple_schedule: 'no' },
    // Seller 3 schedules
    { id: 20, day_id: 10, seller_id: 3, schedule: '09:00 AM - 12:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 21, day_id: 10, seller_id: 3, schedule: '02:00 PM - 05:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 22, day_id: 11, seller_id: 3, schedule: '09:00 AM - 12:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 23, day_id: 11, seller_id: 3, schedule: '02:00 PM - 05:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 24, day_id: 12, seller_id: 3, schedule: '10:00 AM - 01:00 PM', status: 1, allow_multiple_schedule: 'no' },
    { id: 25, day_id: 12, seller_id: 3, schedule: '03:00 PM - 06:00 PM', status: 1, allow_multiple_schedule: 'no' },
  ],
  subscriptions: [
    {
      id: 1,
      title: 'Starter Freelancer',
      type: 'monthly',
      price: 0,
      connect: 20,
      service: 3,
      job: 5,
      status: 1,
      is_popular: false,
      features: [
        '3 Active Service Listings',
        '20 Monthly Job Connects',
        'Direct Client Chat Messaging',
        'Standard Platform Commission (12%)',
        'Standard Seller Profile',
      ],
    },
    {
      id: 2,
      title: 'Professional Pro',
      type: 'monthly',
      price: 5000,
      connect: 80,
      service: 15,
      job: 25,
      status: 1,
      is_popular: true,
      features: [
        '15 Active Service Listings',
        '80 Monthly Job Connects',
        'Verified Pro Badge on Profile & Cards',
        'Discounted Platform Commission (7%)',
        'Priority Search & Category Placement',
        '24/7 Priority Support',
      ],
    },
    {
      id: 3,
      title: 'Agency Enterprise',
      type: 'monthly',
      price: 15000,
      connect: 250,
      service: 50,
      job: 80,
      status: 1,
      is_popular: false,
      features: [
        '50 Active Service Listings',
        '250 Monthly Job Connects',
        'Top Verified Badge & Agency Profile',
        'Lowest Platform Commission (4%)',
        'Featured Hero Homepage Placement',
        'Dedicated VIP Account Manager',
      ],
    },
  ],
  seller_subscriptions: [
    {
      id: 1,
      subscription_id: 2,
      seller_id: 2,
      type: 'monthly',
      connect: 85,
      initial_connect: 100,
      service: 12,
      initial_service: 15,
      job: 28,
      initial_job: 30,
      price: 25000,
      expire_date: '2026-11-25T00:00:00.000Z',
      status: 1,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      transaction_id: 'SUB-PSTK-99214',
      created_at: new Date('2026-10-20').toISOString(),
    },
    {
      id: 2,
      subscription_id: 1,
      seller_id: 3,
      type: 'monthly',
      connect: 24,
      initial_connect: 30,
      service: 4,
      initial_service: 5,
      job: 8,
      initial_job: 10,
      price: 10000,
      expire_date: '2026-11-18T00:00:00.000Z',
      status: 1,
      payment_gateway: 'paystack',
      payment_status: 'complete',
      transaction_id: 'SUB-PSTK-84729',
      created_at: new Date('2026-10-18').toISOString(),
    },
  ],
  todos: [
    {
      id: 1,
      user_id: 2,
      title: 'Prepare deep-cleaning equipment for Saturday booking',
      description: 'Check steam extractor pressure nozzles and restock eco-friendly carpet solutions.',
      status: 1,
      created_at: new Date('2026-10-20').toISOString(),
    },
    {
      id: 2,
      user_id: 2,
      title: 'Follow up with Emma Watson on AC filter change',
      description: 'Send service review request and remind about scheduled 6-month duct checkup.',
      status: 0,
      created_at: new Date('2026-10-23').toISOString(),
    },
    {
      id: 3,
      user_id: 3,
      title: 'Order replacement brass pipe fittings from distributor',
      description: 'Need 15x 1/2 inch ball valves and Teflon sealing tapes for upcoming plumbing jobs.',
      status: 0,
      created_at: new Date('2026-10-24').toISOString(),
    },
  ],
  favorites: [
    {
      id: 1,
      user_id: 4,
      service_id: 1,
      created_at: new Date('2026-10-20').toISOString(),
    },
    {
      id: 2,
      user_id: 4,
      service_id: 2,
      created_at: new Date('2026-10-21').toISOString(),
    },
  ],
  notifications: [
    {
      id: 1,
      role: 'seller',
      user_id: 2,
      order_id: 1,
      title: 'New Service Booking Received',
      message: 'Babatunde Raji booked your Full Home Deep Cleaning service. Scheduled for tomorrow.',
      link: '/seller/orders',
      icon: 'las la-calendar-check',
      type: 'order',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 2,
      role: 'seller',
      user_id: 2,
      title: 'Payment Credited to Wallet',
      message: '₦45,000 net proceeds for Order #1 was released to your pending balance.',
      link: '/seller/payouts',
      icon: 'las la-wallet',
      type: 'payout',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 3,
      role: 'buyer',
      user_id: 4,
      order_id: 1,
      title: 'Order Confirmed & Scheduled',
      message: 'Your service booking #1 has been confirmed by Chioma Adebayo. Provider will arrive at the scheduled time.',
      link: '/buyer/orders',
      icon: 'las la-check-circle',
      type: 'order',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 4,
      role: 'buyer',
      user_id: 4,
      title: 'Special Promo Discount',
      message: 'Enjoy 10% off your next professional plumbing or AC repair service with coupon QWIKCONNECT10.',
      link: '/service-list',
      icon: 'las la-tag',
      type: 'general',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 5,
      role: 'admin',
      user_id: 1,
      order_id: 1,
      title: 'New Platform Order #1',
      message: 'New order #1 of ₦50,000 processed via Paystack. Platform commission recorded.',
      link: '/admin/orders',
      icon: 'las la-receipt',
      type: 'order',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 6,
      role: 'admin',
      user_id: 1,
      title: 'Provider Verification Request',
      message: 'Emeka Okafor submitted National ID and business certificates for identity verification.',
      link: '/admin/seller-verify',
      icon: 'las la-user-check',
      type: 'general',
      status: 0,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ],
  extra_services: [
    {
      id: 1,
      order_id: 1,
      title: 'Out-of-Zone Island Expressway Travel Surcharge',
      quantity: 1,
      price: 5000,
      tax: 0,
      sub_total: 5000,
      total: 5000,
      payment_gateway: 'paystack',
      transaction_id: 'EXT-PAY-9831',
      payment_status: 'complete',
      status: 1,
      created_at: new Date('2026-10-22').toISOString(),
    },
  ],
  service_cities: [
    { id: 1, service_city: 'Lagos', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 2, service_city: 'Abuja', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 3, service_city: 'Port Harcourt', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 4, service_city: 'Ibadan', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 5, service_city: 'Kano', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 6, service_city: 'Benin City', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 7, service_city: 'Enugu', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 8, service_city: 'Abeokuta', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 9, service_city: 'Kaduna', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
    { id: 10, service_city: 'Asaba', country: 'Nigeria', status: 1, created_at: new Date('2024-01-01').toISOString() },
  ],
};

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
    }
  } catch (e) {
    // Handled gracefully for serverless environments with read-only file systems (e.g., Vercel)
  }
}

export interface MongoUser {
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string;
  password?: string;
  user_type: number;
  user_status: number;
  email_verified?: string;
  image?: string | null;
  profile_background?: string;
  address?: string;
  post_code?: string | null;
  about?: string | null;
  country_id?: number;
  country?: string;
  service_city?: string;
  service_area?: string;
  tax_number?: string;
  experience?: string;
  specialities?: string;
  fb_url?: string;
  tw_url?: string;
  li_url?: string;
  in_url?: string;
  yo_url?: string;
  is_identity_verified?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface MongoStoreData {
  categories: any[];
  services: any[];
  users: MongoUser[];
  orders: any[];
  payouts: any[];
  coupons: any[];
  reviews: any[];
  tickets: any[];
  reports: any[];
  messages: any[];
  payment_gateways?: any[];
  settings?: any;
  days?: any[];
  schedules?: any[];
  subscriptions?: any[];
  seller_subscriptions?: any[];
  seller_verifies?: any[];
  todos?: any[];
  favorites?: any[];
  notifications?: any[];
  blogs?: any[];
  contact_messages?: any[];
  extra_services?: any[];
  service_cities?: any[];
  wallets?: any[];
  wallet_transactions?: any[];
  jobs?: any[];
  job_proposals?: any[];
  job_messages?: any[];
  push_subscriptions?: any[];
  mobile_pwa_settings?: any;
  mobile_banners?: any[];
  onboarding_slides?: any[];
}

function readDataFile(): MongoStoreData {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    let dirty = false;
    if (!parsed.days) { parsed.days = SEED_DATA.days; dirty = true; }
    if (!parsed.settings) { parsed.settings = SEED_DATA.settings; dirty = true; }
    if (!parsed.schedules) { parsed.schedules = SEED_DATA.schedules; dirty = true; }
    if (!parsed.subscriptions) { parsed.subscriptions = SEED_DATA.subscriptions; dirty = true; }
    if (!parsed.seller_subscriptions) { parsed.seller_subscriptions = SEED_DATA.seller_subscriptions; dirty = true; }
    if (!parsed.seller_verifies) { parsed.seller_verifies = []; dirty = true; }
    if (!parsed.todos) { parsed.todos = SEED_DATA.todos; dirty = true; }
    if (!parsed.favorites) { parsed.favorites = SEED_DATA.favorites; dirty = true; }
    if (!parsed.extra_services || !Array.isArray(parsed.extra_services)) {
      parsed.extra_services = SEED_DATA.extra_services || [];
      dirty = true;
    }
    if (!parsed.service_cities || !Array.isArray(parsed.service_cities) || parsed.service_cities.length === 0) {
      parsed.service_cities = SEED_DATA.service_cities;
      dirty = true;
    }
    if (!parsed.notifications || !Array.isArray(parsed.notifications) || parsed.notifications.length === 0) {
      parsed.notifications = SEED_DATA.notifications;
      dirty = true;
    }
    if (!parsed.blogs || !Array.isArray(parsed.blogs) || parsed.blogs.length === 0) {
      parsed.blogs = seedBlogs;
      dirty = true;
    }
    if (!parsed.reports || !Array.isArray(parsed.reports) || parsed.reports.length === 0) {
      parsed.reports = SEED_DATA.reports;
      dirty = true;
    }
    if (!parsed.tickets || !Array.isArray(parsed.tickets) || parsed.tickets.length === 0) {
      parsed.tickets = SEED_DATA.tickets;
      dirty = true;
    }
    if (dirty) {
      try { fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8'); } catch (e) {}
    }
    return parsed;
  } catch (err) {
    return SEED_DATA as any;
  }
}

function writeDataFile(data: any) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local mongo backup store:', err);
  }
}

// Connect to MongoDB
let mongoClientPromise: Promise<MongoClient> | null = null;

export async function getMongoDb(): Promise<Db | null> {
  if (cachedDb) return cachedDb;

  try {
    if (!cachedClient) {
      if (!mongoClientPromise) {
        mongoClientPromise = MongoClient.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
      }
      cachedClient = await mongoClientPromise;
    }
    cachedDb = cachedClient.db(DB_NAME);

    // Check if initial collections need seed
    const collections = await cachedDb.listCollections().toArray();
    const colNames = collections.map((c) => c.name);

    if (!colNames.includes('categories') || (await cachedDb.collection('categories').countDocuments()) === 0) {
      await cachedDb.collection('categories').insertMany(SEED_DATA.categories);
    }
    if (!colNames.includes('services') || (await cachedDb.collection('services').countDocuments()) === 0) {
      await cachedDb.collection('services').insertMany(SEED_DATA.services);
    }
    if (!colNames.includes('users') || (await cachedDb.collection('users').countDocuments()) === 0) {
      await cachedDb.collection('users').insertMany(SEED_DATA.users);
    }
    if (!colNames.includes('orders') || (await cachedDb.collection('orders').countDocuments()) === 0) {
      await cachedDb.collection('orders').insertMany(SEED_DATA.orders);
    }
    if (!colNames.includes('payouts') || (await cachedDb.collection('payouts').countDocuments()) === 0) {
      await cachedDb.collection('payouts').insertMany(SEED_DATA.payouts);
    }
    if (!colNames.includes('coupons') || (await cachedDb.collection('coupons').countDocuments()) === 0) {
      await cachedDb.collection('coupons').insertMany(SEED_DATA.coupons);
    }
    if (!colNames.includes('reviews') || (await cachedDb.collection('reviews').countDocuments()) === 0) {
      await cachedDb.collection('reviews').insertMany(SEED_DATA.reviews);
    }
    if (!colNames.includes('tickets') || (await cachedDb.collection('tickets').countDocuments()) === 0) {
      await cachedDb.collection('tickets').insertMany(SEED_DATA.tickets);
    }
    if (!colNames.includes('reports') || (await cachedDb.collection('reports').countDocuments()) === 0) {
      await cachedDb.collection('reports').insertMany(SEED_DATA.reports);
    }
    if (!colNames.includes('messages') || (await cachedDb.collection('messages').countDocuments()) === 0) {
      await cachedDb.collection('messages').insertMany(SEED_DATA.messages);
    }
    if (!colNames.includes('favorites') || (await cachedDb.collection('favorites').countDocuments()) === 0) {
      await cachedDb.collection('favorites').insertMany(SEED_DATA.favorites);
    }
    if (!colNames.includes('notifications') || (await cachedDb.collection('notifications').countDocuments()) === 0) {
      await cachedDb.collection('notifications').insertMany(SEED_DATA.notifications);
    }
    if (!colNames.includes('extra_services') || (await cachedDb.collection('extra_services').countDocuments()) === 0) {
      if (SEED_DATA.extra_services && SEED_DATA.extra_services.length > 0) {
        await cachedDb.collection('extra_services').insertMany(SEED_DATA.extra_services);
      }
    }
    if (!colNames.includes('settings') || (await cachedDb.collection('settings').countDocuments({ type: 'payment_gateways' })) === 0) {
      await cachedDb.collection('settings').insertOne({
        type: 'payment_gateways',
        data: DEFAULT_PAYMENT_GATEWAYS,
        updated_at: new Date().toISOString(),
      });
    }
    if (!colNames.includes('blogs') || (await cachedDb.collection('blogs').countDocuments()) === 0) {
      if (Array.isArray(seedBlogs) && seedBlogs.length > 0) {
        await cachedDb.collection('blogs').insertMany(seedBlogs);
      }
    }

    return cachedDb;
  } catch (err) {
    console.warn('MongoDB connection failed, using local file store:', err);
    // Graceful fallback to persistent JSON file store
    return null;
  }
}

// ----------------------------------------------------------------------
// Unified Database Access Functions (MongoDB with Seamless Fallback)
// ----------------------------------------------------------------------

// 1. CATEGORIES
export async function getCategories(all = false) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query = all ? {} : { status: 1 };
      const cats = await db.collection('categories').find(query).sort({ id: 1 }).toArray();
      if (cats && cats.length > 0) return cats.map(({ _id, ...rest }) => rest);
    } catch (e) {}
  }
  const cats = readDataFile().categories;
  return all ? cats : cats.filter((c) => c.status === 1);
}

export async function createCategory(cat: { name: string; slug: string; icon: string; description?: string; status?: number }) {
  const newCat = {
    id: Date.now(),
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon || 'las la-tools',
    description: cat.description || '',
    status: cat.status !== undefined ? cat.status : 1,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('categories').insertOne(newCat);
    } catch (e) {}
  }

  const data = readDataFile();
  data.categories.push(newCat);
  writeDataFile(data);

  return newCat;
}

export async function updateCategory(id: number, cat: Partial<{ name: string; slug: string; icon: string; description: string; status: number }>) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('categories').updateOne({ id }, { $set: cat });
    } catch (e) {}
  }

  const data = readDataFile();
  data.categories = data.categories.map((c) => (c.id === id ? { ...c, ...cat } : c));
  writeDataFile(data);

  return data.categories.find((c) => c.id === id);
}

export async function deleteCategory(id: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('categories').deleteOne({ id });
    } catch (e) {}
  }

  const data = readDataFile();
  data.categories = data.categories.filter((c) => c.id !== id);
  writeDataFile(data);
}

// 2. SERVICES
export async function getServices(filter: { category_id?: number; status?: number; seller_id?: number } = {}) {
  const users = await getUsers();
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (filter.status !== undefined) query.status = filter.status;
      if (filter.category_id !== undefined) query.category_id = filter.category_id;
      if (filter.seller_id !== undefined) query.seller_id = filter.seller_id;

      const services = await db.collection('services').find(query).sort({ id: -1 }).toArray();
      if (services && services.length > 0) {
        return services.map(({ _id, ...rest }) => formatServiceWithDefaults(rest, users));
      }
    } catch (e) {}
  }

  const data = readDataFile();
  let result = data.services;
  if (filter.status !== undefined) result = result.filter((s) => s.status === filter.status);
  if (filter.category_id !== undefined) result = result.filter((s) => s.category_id === filter.category_id);
  if (filter.seller_id !== undefined) result = result.filter((s) => s.seller_id === filter.seller_id);

  return result.map((s) => formatServiceWithDefaults(s, users));
}

function isGenericSellerImg(img: string | null | undefined): boolean {
  if (!img) return true;
  const clean = String(img).trim();
  return (
    clean === '' ||
    clean === '/assets/frontend/img/static/user_profile.png' ||
    clean === '/assets/frontend/img/user-no-image.png' ||
    clean === '/assets/frontend/img/no-image.png' ||
    clean === '/assets/uploads/media-uploader/banner11638279446.png' ||
    clean.includes('placeholder')
  );
}

function formatServiceWithDefaults(s: any, users: MongoUser[]) {
  if (!s) return null;
  const userMap = new Map((users || []).map((u) => [Number(u.id), u]));
  const sellerId = Number(s.seller_id || s.seller?.id || 2);
  const rawSeller =
    userMap.get(sellerId) ||
    (s.seller?.username ? (users || []).find((u) => u.username?.toLowerCase() === String(s.seller?.username).toLowerCase()) : null);

  const resolvedSellerImage =
    (!isGenericSellerImg(rawSeller?.image) ? rawSeller?.image : null) ||
    (!isGenericSellerImg(s.seller_image) ? s.seller_image : null) ||
    (!isGenericSellerImg(s.seller?.image) ? s.seller?.image : null) ||
    '/assets/frontend/img/static/user_profile.png';

  const sellerCity = rawSeller?.service_city || rawSeller?.city || s.seller?.service_city || s.city || 'Lagos';
  const sellerCountry = rawSeller?.country || rawSeller?.country || s.seller?.country || s.country || 'Nigeria';

  const seller = {
    id: rawSeller?.id ?? sellerId,
    name: rawSeller?.name || s.seller?.name || 'Verified Pro Specialist',
    username: rawSeller?.username || s.seller?.username || 'sarahj',
    image: resolvedSellerImage,
    phone: rawSeller?.phone || s.seller?.phone || '+234 802 345 6789',
    service_city: sellerCity,
    country: sellerCountry,
    about: rawSeller?.about || s.seller?.about || 'Experienced, vetted, and background-checked service professional on QwikConnect marketplace.',
    is_identity_verified: Boolean(rawSeller?.is_identity_verified || rawSeller?.user_status === 1 || s.seller?.is_identity_verified),
  };

  const defaultIncludes = [
    { id: 1, include_service_title: 'Initial On-site Diagnostic Assessment & Setup', include_service_quantity: 1, include_service_price: s.price },
    { id: 2, include_service_title: 'Full Labor & Professional Service Execution', include_service_quantity: 1, include_service_price: 0 },
    { id: 3, include_service_title: 'Quality Verification, Operational Testing & Site Cleanup', include_service_quantity: 1, include_service_price: 0 },
  ];

  const defaultBenefits = [
    { id: 1, benifits: '100% Background-Checked, Certified & Vetted Technicians' },
    { id: 2, benifits: 'Punctual Arrival with High-Grade Professional Equipment' },
    { id: 3, benifits: 'Transparent Upfront Pricing with No Hidden Surcharges' },
    { id: 4, benifits: 'Service Guarantee & Safe Escrow Payment Protection' },
  ];

  const defaultAdditionals = [
    { id: 1, additional_service_title: 'Priority Fast-Track Response Window', additional_service_price: 5000, additional_service_quantity: 1 },
    { id: 2, additional_service_title: 'Extended Follow-Up & Performance Warranty', additional_service_price: 10000, additional_service_quantity: 1 },
  ];

  // Normalize benefits
  let benefits = s.benefits || s.service_benifits;
  if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
    benefits = defaultBenefits;
  } else {
    benefits = benefits.map((b: any, idx: number) => {
      if (typeof b === 'string') return { id: idx + 1, benifits: b, title: b };
      return {
        id: b.id || idx + 1,
        benifits: b.benifits || b.benefits_title || b.title || b.name || '',
        title: b.benifits || b.benefits_title || b.title || b.name || '',
      };
    });
  }

  // Normalize includes
  let includes = s.includes || s.service_includes;
  if (!includes || !Array.isArray(includes) || includes.length === 0) {
    includes = defaultIncludes;
  } else {
    includes = includes.map((inc: any, idx: number) => {
      if (typeof inc === 'string') return { id: idx + 1, include_service_title: inc, include_service_quantity: 1, include_service_price: 0 };
      return {
        id: inc.id || idx + 1,
        include_service_title: inc.include_service_title || inc.title || '',
        include_service_quantity: Number(inc.include_service_quantity) || 1,
        include_service_price: Number(inc.include_service_price) || 0,
      };
    });
  }

  // Normalize additionals
  let additionals = s.additionals || s.service_additionals;
  if (!additionals || !Array.isArray(additionals) || additionals.length === 0) {
    additionals = defaultAdditionals;
  } else {
    additionals = additionals.map((add: any, idx: number) => ({
      id: add.id || idx + 1,
      additional_service_title: add.additional_service_title || add.title || '',
      additional_service_price: Number(add.additional_service_price || add.price) || 0,
      additional_service_quantity: Number(add.additional_service_quantity || add.quantity) || 1,
    }));
  }

  return {
    ...s,
    city: sellerCity,
    country: sellerCountry,
    seller,
    includes,
    additionals,
    benefits,
    view: Number(s.view) || 28,
  };
}

export async function getServiceById(id: number | string) {
  const numId = Number(id);
  const users = await getUsers();
  const db = await getMongoDb();
  if (db) {
    try {
      const s = await db.collection('services').findOne({ $or: [{ id: numId }, { id: String(numId) }] });
      if (s) {
        const { _id, ...rest } = s;
        return formatServiceWithDefaults(rest, users);
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = data.services.find((s) => Number(s.id) === numId) || null;
  return formatServiceWithDefaults(found, users);
}

export async function getServiceBySlug(slug: string) {
  const users = await getUsers();
  const db = await getMongoDb();
  if (db) {
    try {
      const s = await db.collection('services').findOne({
        $or: [{ slug }, { id: Number(slug) || -1 }, { id: String(slug) }]
      });
      if (s) {
        const { _id, ...rest } = s;
        return formatServiceWithDefaults(rest, users);
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = data.services.find((s) => s.slug === slug || String(s.id) === String(slug) || Number(s.id) === Number(slug)) || null;
  return formatServiceWithDefaults(found, users);
}

export async function incrementServiceView(idOrSlug: number | string) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('services').updateOne(
        { $or: [{ id: Number(idOrSlug) || -1 }, { slug: String(idOrSlug) }] },
        { $inc: { view: 1 } }
      );
    } catch (e) {}
  }

  const data = readDataFile();
  const target = data.services.find(
    (s) => s.id === Number(idOrSlug) || s.slug === String(idOrSlug)
  );
  if (target) {
    target.view = (Number(target.view) || 0) + 1;
    writeDataFile(data);
    return target.view;
  }
  return 1;
}

export async function createService(service: {
  title: string;
  slug: string;
  price: number;
  image?: string;
  city?: string;
  country?: string;
  seller_id: number;
  category_id: number;
  category_slug?: string;
  description?: string;
  status?: number;
}) {
  const newService = {
    id: Date.now(),
    title: service.title,
    slug: service.slug,
    price: Number(service.price),
    image: service.image || '/assets/uploads/media-uploader/banner11638279446.png',
    city: service.city || 'Lagos',
    country: service.country || 'Nigeria',
    seller_id: Number(service.seller_id),
    category_id: Number(service.category_id),
    category_slug: service.category_slug || '',
    description: service.description || '',
    status: service.status !== undefined ? service.status : 1,
    created_at: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('services').insertOne(newService);
    } catch (e) {}
  }

  const data = readDataFile();
  data.services.unshift(newService);
  writeDataFile(data);

  return newService;
}

export async function updateService(id: number, update: any) {
  const updateData = { ...update, updated_at: new Date().toISOString() };
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('services').updateOne({ id }, { $set: updateData });
    } catch (e) {}
  }

  const data = readDataFile();
  data.services = data.services.map((s) => (s.id === id ? { ...s, ...updateData } : s));
  writeDataFile(data);

  return data.services.find((s) => s.id === id);
}

export async function updateServiceStatus(id: number, status: number) {
  return updateService(id, { status });
}

export async function deleteService(id: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('services').deleteOne({ id });
    } catch (e) {}
  }

  const data = readDataFile();
  data.services = data.services.filter((s) => s.id !== id);
  writeDataFile(data);
}

// 3. USERS
export async function getUsers(): Promise<MongoUser[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const users = await db.collection('users').find({}).sort({ id: -1 }).toArray();
      if (users && users.length > 0) return users.map(({ _id, ...rest }) => rest as MongoUser);
    } catch (e) {}
  }
  return readDataFile().users;
}

export async function getUserById(id: number | string): Promise<MongoUser | null> {
  const numId = Number(id);
  const db = await getMongoDb();
  if (db) {
    try {
      const user = await db.collection('users').findOne({ $or: [{ id: numId }, { id: String(numId) }] });
      if (user) {
        const { _id, ...rest } = user;
        return rest as MongoUser;
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = data.users.find((u: any) => Number(u.id) === numId);
  return found || null;
}

export async function getUserByEmailOrUsername(identifier: string): Promise<MongoUser | null> {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  const legacyAliases: Record<string, string> = {
    sarahj: 'chioma_adebayo',
    davidm: 'babajide_olatunji',
    erostova: 'ngozi_dike',
  };
  const targetUsername = legacyAliases[clean] || clean;
  const db = await getMongoDb();
  if (db) {
    try {
      const user = await db.collection('users').findOne({
        $or: [
          { email: clean },
          { username: clean },
          { username: targetUsername },
          { username: { $regex: new RegExp(`^${clean}$`, 'i') } },
          { username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } },
          { email: { $regex: new RegExp(`^${clean}$`, 'i') } },
        ],
      });
      if (user) {
        const { _id, ...rest } = user;
        return rest as MongoUser;
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = data.users.find(
    (u: any) =>
      u.email?.toLowerCase().trim() === clean ||
      u.username?.toLowerCase().trim() === clean ||
      u.username?.toLowerCase().trim() === targetUsername ||
      (clean === 'sarahj' && Number(u.id) === 2) ||
      (clean === 'davidm' && Number(u.id) === 3) ||
      (clean === 'erostova' && Number(u.id) === 6)
  );
  return found || null;
}

export async function createUser(user: {
  name: string;
  email: string;
  username: string;
  phone?: string;
  password?: string;
  user_type?: number;
  user_status?: number;
  service_city?: string;
  country?: string;
}) {
  const newUser = {
    id: Date.now(),
    name: user.name,
    email: user.email.toLowerCase().trim(),
    username: user.username.toLowerCase().trim(),
    phone: user.phone || '+234 800 000 0000',
    password: user.password,
    user_type: user.user_type !== undefined ? user.user_type : 1, // 1 = buyer, 2 or 0 = seller
    user_status: user.user_status !== undefined ? user.user_status : 1,
    email_verified: '1',
    service_city: user.service_city || 'Lagos',
    country: user.country || 'Nigeria',
    created_at: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('users').insertOne(newUser);
    } catch (e) {}
  }

  const data = readDataFile();
  data.users.unshift(newUser);
  writeDataFile(data);

  return newUser;
}

export async function updateUser(id: number, update: any) {
  const numId = Number(id);
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('users').updateOne({ $or: [{ id: numId }, { id: String(numId) }] }, { $set: update });
      if (update.image) {
        await db.collection('services').updateMany(
          { $or: [{ seller_id: numId }, { seller_id: String(numId) }] },
          { $set: { seller_image: update.image, 'seller.image': update.image } }
        );
        await db.collection('reviews').updateMany(
          { $or: [{ buyer_id: numId }, { buyer_id: String(numId) }] },
          { $set: { buyer_image: update.image } }
        );
        await db.collection('reviews').updateMany(
          { $or: [{ seller_id: numId }, { seller_id: String(numId) }] },
          { $set: { seller_image: update.image } }
        );
      }
    } catch (e) {}
  }

  const data = readDataFile();
  data.users = data.users.map((u) => (Number(u.id) === numId ? { ...u, ...update } : u));
  if (update.image) {
    if (data.services) {
      data.services = data.services.map((s) =>
        Number(s.seller_id) === numId || (s.seller && Number(s.seller.id) === numId)
          ? {
              ...s,
              seller_image: update.image,
              seller: {
                ...(s.seller || {}),
                id: s.seller?.id ?? numId,
                name: s.seller?.name || update.name || 'Verified Pro Specialist',
                username: s.seller?.username || update.username || 'sarahj',
                image: update.image,
              },
            }
          : s
      );
    }
    if (data.reviews) {
      data.reviews = data.reviews.map((r) => {
        let updatedRev = { ...r };
        if (Number(r.buyer_id) === numId) updatedRev.buyer_image = update.image;
        if (Number(r.seller_id) === numId) updatedRev.seller_image = update.image;
        return updatedRev;
      });
    }
  }
  writeDataFile(data);
  return data.users.find((u) => Number(u.id) === numId);
}

export async function deleteUser(id: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('users').deleteOne({ id });
    } catch (e) {}
  }

  const data = readDataFile();
  data.users = data.users.filter((u) => u.id !== id);
  writeDataFile(data);
}

// 4. ORDERS
export async function getOrders(filter: { seller_id?: number; buyer_id?: number } = {}) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (filter.seller_id !== undefined) query.seller_id = filter.seller_id;
      if (filter.buyer_id !== undefined) query.buyer_id = filter.buyer_id;

      const orders = await db.collection('orders').find(query).sort({ id: -1 }).toArray();
      if (orders && orders.length > 0) {
        const users = await getUsers();
        const services = await getServices();
        const userMap = new Map(users.map((u) => [u.id, u]));
        const serviceMap = new Map((services as any[]).map((s) => [s.id, s]));

        return orders.map(({ _id, ...rest }) => ({
          ...rest,
          seller: userMap.get(rest.seller_id),
          buyer: userMap.get(rest.buyer_id),
          service: serviceMap.get(rest.service_id),
        }));
      }
    } catch (e) {}
  }

  const data = readDataFile();
  let result = data.orders;
  if (filter.seller_id !== undefined) result = result.filter((o) => o.seller_id === filter.seller_id);
  if (filter.buyer_id !== undefined) result = result.filter((o) => o.buyer_id === filter.buyer_id);

  const userMap = new Map(data.users.map((u) => [u.id, u]));
  const serviceMap = new Map(data.services.map((s) => [s.id, s]));

  return result.map((o) => ({
    ...o,
    seller: userMap.get(o.seller_id),
    buyer: userMap.get(o.buyer_id),
    service: serviceMap.get(o.service_id),
  }));
}

export async function getOrderById(id: number | string) {
  const numId = Number(id);
  const db = await getMongoDb();
  if (db) {
    try {
      const order = await db.collection('orders').findOne({
        $or: [{ id: numId }, { id: String(id) }],
      });
      if (order) {
        const { _id, ...rest } = order;
        const users = await getUsers();
        const services = await getServices();
        const userMap = new Map(users.map((u) => [u.id, u]));
        const serviceMap = new Map((services as any[]).map((s) => [s.id, s]));
        return {
          ...rest,
          seller: userMap.get(rest.seller_id),
          buyer: userMap.get(rest.buyer_id),
          service: serviceMap.get(rest.service_id),
        };
      }
    } catch (e) {}
  }

  const data = readDataFile();
  const order = data.orders.find((o: any) => Number(o.id) === numId || String(o.id) === String(id));
  if (!order) return null;

  const userMap = new Map(data.users.map((u) => [u.id, u]));
  const serviceMap = new Map(data.services.map((s) => [s.id, s]));
  return {
    ...order,
    seller: userMap.get(order.seller_id),
    buyer: userMap.get(order.buyer_id),
    service: serviceMap.get(order.service_id),
  };
}

export async function createOrder(order: any) {
  const settings = await getPlatformSettings();
  let escrowFee = Number(order.escrow_fee || 0);
  if (escrowFee === 0 && settings.escrowEnabled) {
    const baseAmount = Number(order.sub_total || order.package_fee || order.total || 0);
    if (settings.escrowType === 'fixed') {
      escrowFee = Number(settings.escrowRate || 500);
    } else {
      escrowFee = Math.round((baseAmount * Number(settings.escrowRate || 5)) / 100);
    }
  }

  const isWalletPayment = order.payment_gateway === 'wallet';
  const isPaid = isWalletPayment || order.payment_status === 'complete';

  const newOrder = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    status: 0,
    payment_status: isPaid ? 'complete' : 'pending',
    escrow_fee: escrowFee,
    escrow_status: isPaid ? 'held_in_escrow' : 'pending_payment',
    ...order,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('orders').insertOne(newOrder);
    } catch (e) {}
  }

  const data = readDataFile();
  data.orders.unshift(newOrder);
  writeDataFile(data);

  // Notify seller of new order
  if (newOrder.seller_id) {
    try {
      await createNotification({
        role: 'seller',
        user_id: newOrder.seller_id,
        order_id: newOrder.id,
        title: 'New Service Booking Received',
        message: `New booking #${newOrder.id} placed by ${newOrder.name || 'Client'}. Amount: ₦${Number(newOrder.total || 0).toLocaleString()}`,
        link: `/seller/orders/${newOrder.id}`,
        icon: 'las la-clipboard-check',
        type: 'order',
        created_at: new Date().toISOString(),
        status: 0,
      });
    } catch (e) {}
  }

  return newOrder;
}

export async function updateOrderStatus(id: number | string, status?: number, extraFields: any = {}) {
  const numId = Number(id);
  const updateObj: any = { updated_at: new Date().toISOString(), ...extraFields };
  if (status !== undefined) {
    updateObj.status = status;
    if (status === 2) {
      updateObj.escrow_status = 'released_to_seller';
    }
  }

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('orders').updateOne(
        { $or: [{ id: numId }, { id: String(id) }] },
        { $set: updateObj }
      );
    } catch (e) {}
  }

  const data = readDataFile();
  data.orders = data.orders.map((o) => (Number(o.id) === numId || String(o.id) === String(id) ? { ...o, ...updateObj } : o));
  writeDataFile(data);
  return data.orders.find((o) => Number(o.id) === numId || String(o.id) === String(id));
}

// 5. PAYOUTS
export async function getPayouts(seller_id?: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (seller_id !== undefined) query.seller_id = seller_id;
      const payouts = await db.collection('payouts').find(query).sort({ id: -1 }).toArray();
      if (payouts && payouts.length > 0) return payouts.map(({ _id, ...rest }) => rest);
    } catch (e) {}
  }

  const data = readDataFile();
  let result = data.payouts;
  if (seller_id !== undefined) result = result.filter((p) => p.seller_id === seller_id);
  return result;
}

export async function createPayout(payout: any) {
  const newPayout = {
    id: Date.now(),
    status: 0,
    created_at: new Date().toISOString(),
    ...payout,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('payouts').insertOne(newPayout);
    } catch (e) {}
  }

  const data = readDataFile();
  data.payouts.unshift(newPayout);
  writeDataFile(data);

  return newPayout;
}

export async function updatePayout(id: number, status: number, admin_note?: string) {
  const updateData: any = { status, updated_at: new Date().toISOString() };
  if (admin_note) updateData.admin_note = admin_note;

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('payouts').updateOne({ id }, { $set: updateData });
    } catch (e) {}
  }

  const data = readDataFile();
  data.payouts = data.payouts.map((p) => (p.id === id ? { ...p, ...updateData } : p));
  writeDataFile(data);
  return data.payouts.find((p: any) => p.id === id);
}

// 6. MESSAGES (Live Chat)
export async function getMessages(fromUser: number, toUser: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      const msgs = await db.collection('messages').find({
        $or: [
          { from_user: fromUser, to_user: toUser },
          { from_user: toUser, to_user: fromUser },
        ],
      }).sort({ id: 1 }).toArray();
      if (msgs && msgs.length > 0) return msgs.map(({ _id, ...rest }) => rest);
    } catch (e) {}
  }

  const data = readDataFile();
  return data.messages.filter(
    (m) =>
      (m.from_user === fromUser && m.to_user === toUser) ||
      (m.from_user === toUser && m.to_user === fromUser)
  );
}

export async function sendMessage(fromUser: number, toUser: number, messageText: string, attachment?: string) {
  const newMsg = {
    id: Date.now(),
    from_user: fromUser,
    to_user: toUser,
    message: messageText,
    attachment: attachment || null,
    created_at: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('messages').insertOne(newMsg);
    } catch (e) {}
  }

  const data = readDataFile();
  data.messages.push(newMsg);
  writeDataFile(data);

  return newMsg;
}

// 7. PLATFORM SETTINGS
const DEFAULT_SETTINGS = {
  siteTitle: 'QwikConnect - Service Marketplace & Finder',
  siteTagline: 'Connect with top-rated local professionals in Nigeria',
  siteLogo: '',
  siteFavicon: '',
  contactEmail: 'admin@qixer.ng',
  contactPhone: '+234 800 123 4567',
  siteAddress: '14 Broad Street, Lagos Island, Lagos, Nigeria',
  currencySymbol: '₦',
  currencyCode: 'NGN',
  usdExchangeRate: '1500',
  commissionType: 'percentage',
  commissionRate: '10',
  escrowEnabled: true,
  escrowType: 'percentage', // 'percentage' | 'fixed'
  escrowRate: '0', // 0% platform escrow protection charge by default
  escrowPayer: 'buyer', // 'buyer' adds on top, 'seller' deducted from payout
  escrowDescription: '100% Secure Escrow Protection. Funds held safely until service completion is approved.',
  autoApproveServices: false,
  enableLiveChat: true,
  maintenanceMode: false,
  copyrightText: '© 2026 QwikConnect Nigeria. All Rights Reserved.',
};

export async function getPlatformSettings() {
  const db = await getMongoDb();
  if (db) {
    try {
      const doc = await db.collection('settings').findOne({ type: 'general' });
      if (doc?.data) return { ...DEFAULT_SETTINGS, ...doc.data };
    } catch (e) {}
  }
  const data = readDataFile() as any;
  return data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS;
}

export async function updatePlatformSettings(newSettings: any) {
  const current = await getPlatformSettings();
  const settings = { ...current, ...newSettings };
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('settings').updateOne(
        { type: 'general' },
        { $set: { type: 'general', data: settings, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e) {}
  }
  const data = readDataFile() as any;
  data.settings = settings;
  writeDataFile(data);
  return settings;
}

// 8. PAYMENT GATEWAYS (including Paystack, Flutterwave, Stripe, PayPal, Razorpay, Mollie, COD)
const DEFAULT_PAYMENT_GATEWAYS = [
  {
    id: 'paystack',
    name: 'Paystack Payment Gateway',
    icon: 'las la-credit-card',
    enabled: true,
    sandbox: true,
    fields: {
      public_key: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_a7e58f850adce9a73750e61668d4f492f67abcd9',
      secret_key: process.env.PAYSTACK_SECRET_KEY || 'sk_test_2a458001d806c878aba51955b962b3c8ed78f04b',
      merchant_email: process.env.PAYSTACK_MERCHANT_EMAIL || 'merchant@qixer.ng',
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
    id: 'wallet',
    name: 'QwikConnect Wallet',
    icon: 'las la-wallet',
    enabled: true,
    sandbox: false,
    fields: {
      instructions: 'Pay instantly from your Naira wallet balance with zero transaction fees.',
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
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: 'las la-bolt',
    enabled: true,
    sandbox: true,
    fields: {
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    },
  },
  {
    id: 'mollie',
    name: 'Mollie',
    icon: 'las la-credit-card',
    enabled: true,
    sandbox: true,
    fields: {
      api_key: process.env.MOLLIE_API_KEY || '',
    },
  },
];

export async function getPaymentGateways() {
  const db = await getMongoDb();
  let list = DEFAULT_PAYMENT_GATEWAYS;
  if (db) {
    try {
      const doc = await db.collection('settings').findOne({ type: 'payment_gateways' });
      if (doc?.data && Array.isArray(doc.data)) list = doc.data;
    } catch (e) {}
  } else {
    const data = readDataFile() as any;
    if (data.payment_gateways && Array.isArray(data.payment_gateways)) {
      list = data.payment_gateways;
    }
  }

  // Ensure all gateways are present and admin configured keys overwrite env variables
  return DEFAULT_PAYMENT_GATEWAYS.map((def) => {
    const found = list.find((g: any) => g.id === def.id);
    if (!found) return def;
    const cleanFields: Record<string, any> = { ...def.fields };
    if (found.fields && typeof found.fields === 'object') {
      for (const [k, v] of Object.entries(found.fields)) {
        if (typeof v === 'string' && v.trim().length > 0) {
          cleanFields[k] = v.trim();
        }
      }
    }
    return {
      ...def,
      ...found,
      enabled: found.enabled !== undefined ? Boolean(found.enabled) : def.enabled,
      sandbox: found.sandbox !== undefined ? Boolean(found.sandbox) : def.sandbox,
      fields: cleanFields,
    };
  });
}

export async function updatePaymentGateways(gateways: any[]) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('settings').updateOne(
        { type: 'payment_gateways' },
        { $set: { type: 'payment_gateways', data: gateways, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e) {}
  }
  const data = readDataFile() as any;
  data.payment_gateways = gateways;
  writeDataFile(data);
  return gateways;
}

// 9. TICKETS (Support Tickets)
export async function getTickets(userId?: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (userId !== undefined) {
        query.user_id = { $in: [Number(userId), String(userId)] };
      }
      const tickets = await db.collection('tickets').find(query).sort({ id: -1 }).toArray();
      if (tickets && tickets.length > 0) {
        const users = await getUsers();
        const userMap = new Map(users.map((u) => [Number(u.id), u]));
        return tickets.map(({ _id, ...rest }) => ({
          ...rest,
          user: userMap.get(Number(rest.user_id)) || { name: 'User' },
        }));
      }
    } catch (e) {}
  }

  const data = readDataFile();
  let result = data.tickets || [];
  if (userId !== undefined) {
    result = result.filter((t: any) => Number(t.user_id) === Number(userId));
  }
  const userMap = new Map((data.users || []).map((u: any) => [Number(u.id), u]));
  return result.map((t: any) => ({
    ...t,
    user: userMap.get(Number(t.user_id)) || { name: 'User' },
  }));
}

export async function createTicket(ticket: any) {
  const nextId = Date.now();
  const userIdNum = Number(ticket.user_id);
  const now = new Date().toISOString();

  const initialMessages = Array.isArray(ticket.messages) && ticket.messages.length > 0
    ? ticket.messages
    : [
        {
          id: 1,
          sender: ticket.sender_role || (userIdNum === 2 ? 'seller' : userIdNum === 4 ? 'buyer' : 'user'),
          sender_name: ticket.sender_name || (userIdNum === 2 ? 'Chioma Adebayo' : userIdNum === 4 ? 'Emma Watson' : 'User'),
          message: ticket.description || '',
          created_at: now,
        },
      ];

  const newTicket = {
    id: nextId,
    status: 'open',
    replies_count: 0,
    created_at: now,
    ...ticket,
    user_id: userIdNum,
    messages: initialMessages,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('tickets').insertOne(newTicket);
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.tickets) data.tickets = [];
  data.tickets.unshift(newTicket);
  writeDataFile(data);

  return newTicket;
}

export async function updateTicket(
  id: number,
  status?: string,
  adminReply?: string,
  extra?: { priority?: string; message?: { sender: string; sender_name?: string; message: string } }
) {
  const now = new Date().toISOString();
  const updateData: any = { updated_at: now };
  if (status) updateData.status = status;
  if (extra?.priority) updateData.priority = extra.priority;
  if (adminReply) {
    updateData.admin_reply = adminReply;
    updateData.replied_at = now;
  }

  const data = readDataFile();
  if (!data.tickets) data.tickets = [];
  const target = data.tickets.find((t: any) => Number(t.id) === Number(id));

  if (target) {
    if (!target.messages) {
      target.messages = [];
      if (target.description) {
        target.messages.push({
          id: 1,
          sender: 'user',
          sender_name: target.user?.name || 'Complainant',
          message: target.description,
          created_at: target.created_at,
        });
      }
    }

    if (adminReply) {
      target.messages.push({
        id: target.messages.length + 1,
        sender: 'admin',
        sender_name: 'Support Team',
        message: adminReply,
        created_at: now,
      });
      target.replies_count = target.messages.filter((m: any) => m.sender === 'admin').length;
    }

    if (extra?.message) {
      target.messages.push({
        id: target.messages.length + 1,
        sender: extra.message.sender || 'user',
        sender_name: extra.message.sender_name || 'User',
        message: extra.message.message,
        created_at: now,
      });
      if (extra.message.sender === 'admin') {
        target.admin_reply = extra.message.message;
        target.replied_at = now;
      }
    }

    Object.assign(target, updateData);
    writeDataFile(data);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('tickets').updateOne({ id: Number(id) }, { $set: target });
      } catch (e) {}
    }
    return target;
  }

  return null;
}

// 10. COUPONS
export async function getCoupons(sellerId?: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (sellerId !== undefined) query.seller_id = sellerId;
      const coupons = await db.collection('coupons').find(query).sort({ id: -1 }).toArray();
      if (coupons && coupons.length > 0) return coupons.map(({ _id, ...rest }) => rest);
    } catch (e) {}
  }

  const data = readDataFile();
  let result = data.coupons || [];
  if (sellerId !== undefined) result = result.filter((c: any) => c.seller_id === sellerId);
  return result;
}

export async function createCoupon(coupon: any) {
  const newCoupon = {
    id: Date.now(),
    status: 1,
    used_count: 0,
    created_at: new Date().toISOString(),
    ...coupon,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('coupons').insertOne(newCoupon);
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.coupons) data.coupons = [];
  data.coupons.unshift(newCoupon);
  writeDataFile(data);

  return newCoupon;
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupons = await getCoupons();
  const cleanCode = code.trim().toUpperCase();
  const found = coupons.find((c: any) => c.code?.toUpperCase() === cleanCode && c.status === 1);

  if (!found) {
    return { valid: false, message: 'Invalid or inactive coupon code' };
  }

  if (found.expire_date && new Date(found.expire_date) < new Date()) {
    return { valid: false, message: 'This coupon code has expired' };
  }

  let discountAmount = 0;
  if (found.discount_type === 'percentage') {
    discountAmount = (subtotal * Number(found.discount)) / 100;
  } else {
    discountAmount = Math.min(Number(found.discount), subtotal);
  }

  const newTotal = Math.max(0, subtotal - discountAmount);

  return {
    valid: true,
    code: found.code,
    discount: Number(found.discount),
    discount_type: found.discount_type,
    discount_amount: Math.round(discountAmount),
    new_total: Math.round(newTotal),
  };
}





// ----------------------------------------------------------------------
// 12. SELLER WORKING DAYS & TIME SCHEDULES (Qixer Schedules System)
// ----------------------------------------------------------------------

const DEFAULT_DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export async function getSellerDays(sellerId: number) {
  const data = readDataFile();
  if (!data.days) data.days = [];
  let sellerDays = data.days.filter((d: any) => d.seller_id === sellerId);

  // If no days configured for this seller, auto-seed the standard 7 working days
  if (sellerDays.length === 0) {
    const startId = data.days.length > 0 ? Math.max(...data.days.map((d: any) => d.id || 0)) + 1 : 1;
    const newDays = DEFAULT_DAYS.map((day, idx) => ({
      id: startId + idx,
      day,
      seller_id: sellerId,
      status: 1,
      total_day: 7,
    }));
    data.days.push(...newDays);
    writeDataFile(data);
    sellerDays = newDays;
  }

  // Get count of schedules for each day
  const schedules = (data.schedules || []).filter((s: any) => s.seller_id === sellerId);
  return sellerDays.map((d: any) => ({
    ...d,
    schedules_count: schedules.filter((s: any) => s.day_id === d.id).length,
  }));
}

export async function addSellerDay(sellerId: number, day: string) {
  const data = readDataFile();
  if (!data.days) data.days = [];
  const exists = data.days.find((d: any) => d.seller_id === sellerId && d.day.toLowerCase() === day.toLowerCase());
  if (exists) return { error: 'Day already exists' };

  const id = data.days.length > 0 ? Math.max(...data.days.map((d: any) => d.id || 0)) + 1 : 1;
  const newDay = { id, day, seller_id: sellerId, status: 1, total_day: 7 };
  data.days.push(newDay);
  writeDataFile(data);
  return newDay;
}

export async function deleteSellerDay(id: number, sellerId: number) {
  const data = readDataFile();
  if (data.days) {
    data.days = data.days.filter((d: any) => !(d.id === id && d.seller_id === sellerId));
  }
  if (data.schedules) {
    data.schedules = data.schedules.filter((s: any) => !(s.day_id === id && s.seller_id === sellerId));
  }
  writeDataFile(data);
  return { success: true };
}

export async function updateSellerTotalDay(sellerId: number, totalDay: number) {
  const data = readDataFile();
  if (data.days) {
    data.days.forEach((d: any) => {
      if (d.seller_id === sellerId) d.total_day = totalDay;
    });
  }
  writeDataFile(data);
  return { success: true, total_day: totalDay };
}

export async function getSellerSchedules(sellerId: number) {
  const data = readDataFile();
  const schedules = (data.schedules || []).filter((s: any) => s.seller_id === sellerId);
  const days = (data.days || []).filter((d: any) => d.seller_id === sellerId);
  const dayMap = new Map(days.map((d: any) => [d.id, d.day]));

  return schedules.map((s: any) => ({
    ...s,
    day: dayMap.get(s.day_id) || 'Unknown',
  }));
}

export async function createSellerSchedule(
  sellerId: number,
  dayId: number | 'all',
  schedule: string,
  allowMultipleSchedule?: 'yes' | 'no'
) {
  const data = readDataFile();
  if (!data.schedules) data.schedules = [];

  let nextId = data.schedules.length > 0 ? Math.max(...data.schedules.map((s: any) => s.id || 0)) + 1 : 1;
  const sellerDays = (data.days || []).filter((d: any) => d.seller_id === sellerId);
  const allowVal = allowMultipleSchedule || (data.schedules.find((s: any) => s.seller_id === sellerId)?.allow_multiple_schedule || 'no');

  const created: any[] = [];
  if (dayId === 'all') {
    for (const d of sellerDays) {
      const entry = {
        id: nextId++,
        day_id: d.id,
        seller_id: sellerId,
        schedule: schedule.trim(),
        status: 1,
        allow_multiple_schedule: allowVal,
      };
      data.schedules.push(entry);
      created.push(entry);
    }
  } else {
    const entry = {
      id: nextId++,
      day_id: Number(dayId),
      seller_id: sellerId,
      schedule: schedule.trim(),
      status: 1,
      allow_multiple_schedule: allowVal,
    };
    data.schedules.push(entry);
    created.push(entry);
  }

  writeDataFile(data);
  return created;
}

export async function updateSellerSchedule(id: number, sellerId: number, dayId: number, schedule: string) {
  const data = readDataFile();
  if (!data.schedules) return null;
  const target = data.schedules.find((s: any) => s.id === id && s.seller_id === sellerId);
  if (!target) return null;

  target.day_id = Number(dayId);
  target.schedule = schedule.trim();
  writeDataFile(data);
  return target;
}

export async function deleteSellerSchedule(id: number, sellerId: number) {
  const data = readDataFile();
  if (data.schedules) {
    data.schedules = data.schedules.filter((s: any) => !(s.id === id && s.seller_id === sellerId));
  }
  writeDataFile(data);
  return { success: true };
}

export async function toggleMultipleSchedule(sellerId: number, allow: 'yes' | 'no') {
  const data = readDataFile();
  if (data.schedules) {
    data.schedules.forEach((s: any) => {
      if (s.seller_id === sellerId) s.allow_multiple_schedule = allow;
    });
  }
  writeDataFile(data);
  return { success: true, allow_multiple_schedule: allow };
}

export async function getAvailableSchedules(sellerId: number, dateString: string) {
  const data = readDataFile();
  if (!dateString) return { status: 'no_schedule', schedules: [], message: 'No date provided' };

  // Parse day of week (e.g., '2026-10-26' -> 'Mon')
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) {
    return { status: 'no_schedule', schedules: [], message: 'Invalid date format' };
  }
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];

  // Check if seller has this day
  const sellerDays = (data.days || []).filter((d: any) => Number(d.seller_id) === Number(sellerId));
  let matchedDay = sellerDays.find((d: any) => d.day.toLowerCase() === dayName.toLowerCase());

  if (!matchedDay && sellerDays.length > 0) {
    return {
      status: 'no_schedule',
      schedules: [],
      day: null,
      message: `The service provider is not scheduled to work on ${dayName}s.`,
    };
  }

  // Get schedules for this day
  let allSellerSchedules = (data.schedules || []).filter(
    (s: any) => Number(s.seller_id) === Number(sellerId) && (matchedDay ? Number(s.day_id) === Number(matchedDay.id) : true) && s.status !== 0
  );

  // Fallback default business hours if provider has not configured custom slots yet
  if (allSellerSchedules.length === 0) {
    allSellerSchedules = [
      { id: 101, seller_id: sellerId, schedule: '09:00 AM - 11:00 AM', status: 1, allow_multiple_schedule: 'no' },
      { id: 102, seller_id: sellerId, schedule: '11:00 AM - 01:00 PM', status: 1, allow_multiple_schedule: 'no' },
      { id: 103, seller_id: sellerId, schedule: '02:00 PM - 04:00 PM', status: 1, allow_multiple_schedule: 'no' },
      { id: 104, seller_id: sellerId, schedule: '04:00 PM - 06:00 PM', status: 1, allow_multiple_schedule: 'no' },
    ];
  }

  // Check allow_multiple_schedule policy
  const allowMultiple = allSellerSchedules[0]?.allow_multiple_schedule === 'yes';

  if (!allowMultiple) {
    // Collect all orders on this date for this seller
    const sellerOrders = (data.orders || []).filter((o: any) => Number(o.seller_id) === Number(sellerId));
    
    const normalizedInputDate = dateString.split('T')[0];
    const bookedTimeSlots = new Set<string>();

    for (const order of sellerOrders) {
      if (!order.date) continue;
      const orderDateNormalized = String(order.date).split('T')[0];
      if (orderDateNormalized === normalizedInputDate) {
        if (order.schedule) bookedTimeSlots.add(order.schedule.trim());
      }
    }

    const availableSchedules = allSellerSchedules.filter((s: any) => !bookedTimeSlots.has(s.schedule.trim()));

    if (availableSchedules.length === 0) {
      return {
        status: 'no_schedule',
        schedules: [],
        all_schedules: allSellerSchedules,
        day: matchedDay,
        allow_multiple: false,
        booked_slots: Array.from(bookedTimeSlots),
        message: `All time slots on ${dayName} (${dateString}) are already booked for this provider.`,
      };
    }

    return {
      status: 'success',
      schedules: availableSchedules,
      all_schedules: allSellerSchedules,
      day: matchedDay,
      allow_multiple: false,
      booked_slots: Array.from(bookedTimeSlots),
    };
  }

  return {
    status: 'success',
    schedules: allSellerSchedules,
    all_schedules: allSellerSchedules,
    day: matchedDay,
    allow_multiple: true,
    booked_slots: [],
  };
}

// ----------------------------------------------------------------------
// 13. SUBSCRIPTION & MEMBERSHIP PLANS (PHP Modules\Subscription Equivalent)
// ----------------------------------------------------------------------

export async function getSubscriptions(all = false) {
  const data = readDataFile();
  const subs = data.subscriptions || [];
  return all ? subs : subs.filter((s: any) => s.status === 1);
}

export async function getSubscriptionById(id: number) {
  const data = readDataFile();
  return (data.subscriptions || []).find((s: any) => s.id === id) || null;
}

export async function createSubscription(plan: any) {
  const data = readDataFile();
  if (!data.subscriptions) data.subscriptions = [];
  const nextId = data.subscriptions.length > 0 ? Math.max(...data.subscriptions.map((s: any) => s.id || 0)) + 1 : 1;
  const newPlan = {
    id: nextId,
    title: plan.title,
    type: plan.type || 'monthly',
    price: Number(plan.price) || 0,
    connect: Number(plan.connect) || 0,
    service: Number(plan.service) || 0,
    job: Number(plan.job) || 0,
    status: plan.status !== undefined ? Number(plan.status) : 1,
    is_popular: Boolean(plan.is_popular),
    features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split('\n').filter(Boolean) : []),
    created_at: new Date().toISOString(),
  };
  data.subscriptions.push(newPlan);
  writeDataFile(data);
  return newPlan;
}

export async function updateSubscription(id: number, update: any) {
  const data = readDataFile();
  if (!data.subscriptions) return null;
  const target = data.subscriptions.find((s: any) => s.id === id);
  if (!target) return null;

  Object.assign(target, {
    ...update,
    price: update.price !== undefined ? Number(update.price) : target.price,
    connect: update.connect !== undefined ? Number(update.connect) : target.connect,
    service: update.service !== undefined ? Number(update.service) : target.service,
    job: update.job !== undefined ? Number(update.job) : target.job,
    features: Array.isArray(update.features) ? update.features : (update.features ? update.features.split('\n').filter(Boolean) : target.features),
    updated_at: new Date().toISOString(),
  });

  writeDataFile(data);
  return target;
}

export async function deleteSubscription(id: number) {
  const data = readDataFile();
  if (data.subscriptions) {
    data.subscriptions = data.subscriptions.filter((s: any) => s.id !== id);
  }
  writeDataFile(data);
  return { success: true };
}

export async function getSellerSubscriptions(sellerId?: number) {
  const data = readDataFile();
  let subs = data.seller_subscriptions || [];
  if (sellerId !== undefined) {
    subs = subs.filter((s: any) => s.seller_id === sellerId);
  }
  const users = data.users || [];
  const plans = data.subscriptions || [];
  const userMap = new Map(users.map((u: any) => [u.id, u.name]));
  const planMap = new Map(plans.map((p: any) => [p.id, p]));

  return subs.map((s: any) => {
    const plan = planMap.get(s.subscription_id);
    return {
      ...s,
      seller_name: userMap.get(s.seller_id) || 'Seller',
      plan_title: plan?.title || 'Custom Subscription',
      plan_type: s.type || plan?.type || 'monthly',
    };
  });
}

export async function getCurrentSellerSubscription(sellerId: number) {
  const data = readDataFile();
  const subs = (data.seller_subscriptions || [])
    .filter((s: any) => s.seller_id === sellerId && s.status === 1)
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  if (subs.length === 0) return null;

  const current = subs[0];
  const plan = (data.subscriptions || []).find((p: any) => p.id === current.subscription_id);

  return {
    ...current,
    plan_title: plan?.title || 'Active Subscription',
    plan_features: plan?.features || [],
  };
}

export async function subscribeSellerPlan(
  sellerId: number,
  subscriptionId: number,
  gateway: string,
  txId?: string
) {
  const data = readDataFile();
  const plan = (data.subscriptions || []).find((p: any) => p.id === subscriptionId);
  if (!plan) return { error: 'Plan not found' };

  if (!data.seller_subscriptions) data.seller_subscriptions = [];

  // Deactivate any existing active subscriptions for this seller
  data.seller_subscriptions.forEach((s: any) => {
    if (s.seller_id === sellerId && s.status === 1) {
      s.status = 0;
    }
  });

  const nextId = data.seller_subscriptions.length > 0 ? Math.max(...data.seller_subscriptions.map((s: any) => s.id || 0)) + 1 : 1;

  // Calculate expire date
  const now = new Date();
  const expireDate = new Date(now);
  if (plan.type === 'yearly') {
    expireDate.setFullYear(expireDate.getFullYear() + 1);
  } else {
    expireDate.setMonth(expireDate.getMonth() + 1);
  }

  const newSub = {
    id: nextId,
    subscription_id: plan.id,
    seller_id: sellerId,
    type: plan.type,
    connect: plan.connect,
    initial_connect: plan.connect,
    service: plan.service,
    initial_service: plan.service,
    job: plan.job,
    initial_job: plan.job,
    price: plan.price,
    expire_date: expireDate.toISOString(),
    status: 1,
    payment_gateway: gateway,
    payment_status: 'complete',
    transaction_id: txId || `SUB-${Date.now().toString(36).toUpperCase()}`,
    created_at: now.toISOString(),
  };

  data.seller_subscriptions.push(newSub);
  writeDataFile(data);
  return newSub;
}

export async function updateSellerSubscriptionStatus(id: number, status: number, paymentStatus?: string) {
  const data = readDataFile();
  if (!data.seller_subscriptions) return null;
  const sub = data.seller_subscriptions.find((s: any) => s.id === id);
  if (!sub) return null;

  sub.status = status;
  if (paymentStatus) sub.payment_status = paymentStatus;
  writeDataFile(data);
  return sub;
}

// ----------------------------------------------------------------------
// 14. SELLER IDENTITY VERIFICATION (KYC System)
// ----------------------------------------------------------------------

export async function getSellerVerification(sellerId: number) {
  const data = readDataFile();
  if (!data.seller_verifies) data.seller_verifies = [];
  const found = data.seller_verifies.find((v: any) => Number(v.seller_id) === Number(sellerId));
  return found || null;
}

export async function submitSellerVerification(sellerId: number, info: { national_id: string; address?: string }) {
  const data = readDataFile();
  if (!data.seller_verifies) data.seller_verifies = [];
  const existingIndex = data.seller_verifies.findIndex((v: any) => Number(v.seller_id) === Number(sellerId));

  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    data.seller_verifies[existingIndex] = {
      ...data.seller_verifies[existingIndex],
      national_id: info.national_id || data.seller_verifies[existingIndex].national_id,
      address: info.address || data.seller_verifies[existingIndex].address,
      status: 0, // Pending Review
      updated_at: now,
    };
    writeDataFile(data);
    return data.seller_verifies[existingIndex];
  } else {
    const nextId = data.seller_verifies.length > 0 ? Math.max(...data.seller_verifies.map((v: any) => v.id || 0)) + 1 : 1;
    const newRecord = {
      id: nextId,
      seller_id: Number(sellerId),
      national_id: info.national_id,
      address: info.address || '',
      status: 0, // Pending
      created_at: now,
      updated_at: now,
    };
    data.seller_verifies.push(newRecord);
    writeDataFile(data);
    return newRecord;
  }
}

export async function getAllSellerVerifications() {
  const data = readDataFile();
  const verifies = data.seller_verifies || [];
  const users = data.users || [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return verifies.map((v: any) => {
    const u = userMap.get(Number(v.seller_id));
    return {
      ...v,
      seller_name: u?.name || 'Seller',
      seller_email: u?.email || '',
      seller_username: u?.username || '',
      seller_phone: u?.phone || '',
    };
  });
}

export async function updateSellerVerificationStatus(id: number, status: number, admin_note?: string) {
  const data = readDataFile();
  if (!data.seller_verifies) return null;
  const target = data.seller_verifies.find((v: any) => v.id === id);
  if (!target) return null;

  target.status = Number(status);
  if (admin_note !== undefined) target.admin_note = admin_note;
  target.updated_at = new Date().toISOString();

  // If approved (status === 1), mark the user's verified flag
  if (Number(status) === 1 && target.seller_id) {
    const u = data.users.find((user) => user.id === Number(target.seller_id));
    if (u) {
      u.user_status = 1;
      u.is_identity_verified = true;
    }
  }

  writeDataFile(data);
  return target;
}

// ==========================================
// 17. SELLER TO-DO LIST
// ==========================================
export async function getTodos(userId?: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query = userId !== undefined ? { user_id: Number(userId) } : {};
      const todos = await db.collection('todos').find(query).sort({ id: -1 }).toArray();
      if (todos && todos.length > 0) {
        return todos.map(({ _id, ...rest }) => rest);
      }
    } catch (e) {}
  }

  const data = readDataFile();
  const todos = data.todos || [];
  if (userId !== undefined) {
    return todos.filter((t: any) => Number(t.user_id) === Number(userId));
  }
  return todos;
}

export async function createTodo(todo: { user_id: number; title: string; description?: string }) {
  const data = readDataFile();
  if (!data.todos) data.todos = [];
  const nextId = data.todos.length > 0 ? Math.max(...data.todos.map((t: any) => t.id || 0)) + 1 : 1;

  const newTodo = {
    id: nextId,
    user_id: Number(todo.user_id),
    title: todo.title.trim(),
    description: (todo.description || '').trim(),
    status: 0, // incomplete
    created_at: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('todos').insertOne(newTodo);
    } catch (e) {}
  }

  data.todos.unshift(newTodo);
  writeDataFile(data);
  return newTodo;
}

export async function updateTodo(id: number, update: Partial<{ title: string; description: string; status: number }>) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('todos').updateOne({ id: Number(id) }, { $set: update });
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.todos) data.todos = [];
  const target = data.todos.find((t: any) => Number(t.id) === Number(id));
  if (!target) return null;

  if (update.title !== undefined) target.title = update.title;
  if (update.description !== undefined) target.description = update.description;
  if (update.status !== undefined) target.status = Number(update.status);
  target.updated_at = new Date().toISOString();

  writeDataFile(data);
  return target;
}

export async function deleteTodo(id: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('todos').deleteOne({ id: Number(id) });
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.todos) return false;
  const initialLength = data.todos.length;
  data.todos = data.todos.filter((t: any) => Number(t.id) !== Number(id));
  writeDataFile(data);
  return data.todos.length < initialLength;
}

// ==========================================
// 18. ORDER DISPUTES & REPORTS
// ==========================================
export async function getReports(filter: { seller_id?: number; buyer_id?: number; status?: string } = {}) {
  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (filter.seller_id !== undefined) query.seller_id = Number(filter.seller_id);
      if (filter.buyer_id !== undefined) query.buyer_id = Number(filter.buyer_id);
      if (filter.status) query.status = filter.status;
      const reports = await db.collection('reports').find(query).sort({ id: -1 }).toArray();
      if (reports && reports.length > 0) {
        return reports.map(({ _id, ...rest }) => rest);
      }
    } catch (e) {}
  }

  const data = readDataFile();
  let reports = data.reports || [];
  if (filter.seller_id !== undefined) {
    reports = reports.filter((r: any) => Number(r.seller_id) === Number(filter.seller_id));
  }
  if (filter.buyer_id !== undefined) {
    reports = reports.filter((r: any) => Number(r.buyer_id) === Number(filter.buyer_id));
  }
  if (filter.status) {
    reports = reports.filter((r: any) => r.status === filter.status);
  }
  return reports;
}

export async function createReport(report: {
  order_id: string;
  service_name?: string;
  seller_name?: string;
  buyer_name?: string;
  seller_id?: number;
  buyer_id?: number;
  report_from?: 'buyer' | 'seller';
  report_to?: 'buyer' | 'seller';
  reason: string;
  description: string;
}) {
  const data = readDataFile();
  if (!data.reports) data.reports = [];
  const nextId = data.reports.length > 0 ? Math.max(...data.reports.map((r: any) => r.id || 0)) + 1 : 1;

  const newReport = {
    id: nextId,
    order_id: report.order_id.startsWith('#') ? report.order_id : `#${report.order_id}`,
    service_name: report.service_name || 'Booked Service',
    seller_name: report.seller_name || 'Seller',
    buyer_name: report.buyer_name || 'Buyer',
    seller_id: report.seller_id ? Number(report.seller_id) : undefined,
    buyer_id: report.buyer_id ? Number(report.buyer_id) : undefined,
    report_from: report.report_from || 'buyer',
    report_to: report.report_to || 'seller',
    reason: report.reason,
    description: report.description,
    status: 'under_review',
    admin_decision: 'Dispute submitted and queued for mediator review.',
    created_at: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('reports').insertOne(newReport);
    } catch (e) {}
  }

  data.reports.unshift(newReport);
  writeDataFile(data);
  return newReport;
}

export async function updateReportStatus(id: number, status: 'under_review' | 'mediation' | 'resolved', admin_decision?: string) {
  const db = await getMongoDb();
  if (db) {
    try {
      const updateData: any = { status };
      if (admin_decision !== undefined) updateData.admin_decision = admin_decision;
      await db.collection('reports').updateOne({ id: Number(id) }, { $set: updateData });
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.reports) return null;
  const target = data.reports.find((r: any) => Number(r.id) === Number(id));
  if (!target) return null;

  target.status = status;
  if (admin_decision !== undefined) target.admin_decision = admin_decision;
  target.updated_at = new Date().toISOString();

  writeDataFile(data);
  return target;
}

export async function deleteReport(id: number) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('reports').deleteOne({ id: Number(id) });
    } catch (e) {}
  }

  const data = readDataFile();
  if (!data.reports) return false;
  const initialLen = data.reports.length;
  data.reports = data.reports.filter((r: any) => Number(r.id) !== Number(id));
  writeDataFile(data);
  return data.reports.length < initialLen;
}

// ==========================================
// 19. BUYER FAVORITE SERVICES
// ==========================================
// 19. BUYER FAVORITE SERVICES
// ==========================================
export async function getFavorites(userId: number) {
  const numId = Number(userId);
  const db = await getMongoDb();
  let userFavs: any[] = [];

  if (db) {
    try {
      const docs = await db.collection('favorites').find({
        $or: [{ user_id: numId }, { user_id: String(userId) }]
      }).sort({ id: -1 }).toArray();

      if (docs && docs.length > 0) {
        userFavs = docs.map(({ _id, ...rest }) => rest);
      }
    } catch (e) {}
  }

  if (userFavs.length === 0) {
    const data = readDataFile();
    const allFavs = data.favorites || [];
    userFavs = allFavs.filter((f: any) => Number(f.user_id) === numId || String(f.user_id) === String(userId));
  }

  // Fallback demo favorites for buyers who haven't saved any yet
  if (userFavs.length === 0) {
    userFavs = (SEED_DATA.favorites || []).map((f) => ({ ...f, user_id: numId }));
  }

  const services = await getServices();
  const serviceMap = new Map((services as any[]).map((s) => [Number(s.id), s]));

  return userFavs
    .map((f: any) => {
      const svc = serviceMap.get(Number(f.service_id));
      if (!svc) return null;
      return {
        id: f.id,
        user_id: f.user_id,
        service_id: f.service_id,
        created_at: f.created_at,
        service: svc,
      };
    })
    .filter(Boolean);
}

export async function toggleFavorite(userId: number, serviceId: number) {
  const numUserId = Number(userId);
  const numServiceId = Number(serviceId);
  const data = readDataFile();
  if (!data.favorites) data.favorites = [];

  const db = await getMongoDb();
  let mongoFound = null;
  if (db) {
    try {
      mongoFound = await db.collection('favorites').findOne({
        $or: [
          { user_id: numUserId, service_id: numServiceId },
          { user_id: String(userId), service_id: numServiceId },
        ],
      });
    } catch (e) {}
  }

  const existingIndex = data.favorites.findIndex(
    (f: any) =>
      (Number(f.user_id) === numUserId || String(f.user_id) === String(userId)) &&
      Number(f.service_id) === numServiceId
  );

  let isFavorite = false;
  if (existingIndex > -1 || mongoFound) {
    if (existingIndex > -1) {
      data.favorites.splice(existingIndex, 1);
    }
    isFavorite = false;

    if (db) {
      try {
        await db.collection('favorites').deleteMany({
          $or: [
            { user_id: numUserId, service_id: numServiceId },
            { user_id: String(userId), service_id: numServiceId },
            ...(mongoFound?.id ? [{ id: mongoFound.id }] : []),
          ],
        });
      } catch (e) {}
    }
  } else {
    const nextId =
      data.favorites.length > 0 ? Math.max(...data.favorites.map((f: any) => f.id || 0)) + 1 : Date.now();
    const newFav = {
      id: nextId,
      user_id: numUserId,
      service_id: numServiceId,
      created_at: new Date().toISOString(),
    };
    data.favorites.push(newFav);
    isFavorite = true;

    if (db) {
      try {
        await db.collection('favorites').updateOne(
          { user_id: numUserId, service_id: numServiceId },
          { $set: newFav },
          { upsert: true }
        );
      } catch (e) {}
    }
  }

  writeDataFile(data);
  return { isFavorite };
}

export async function checkIsFavorite(userId: number, serviceId: number): Promise<boolean> {
  const numUserId = Number(userId);
  const numServiceId = Number(serviceId);
  const db = await getMongoDb();
  if (db) {
    try {
      const found = await db.collection('favorites').findOne({
        $and: [
          { $or: [{ user_id: numUserId }, { user_id: String(userId) }] },
          { $or: [{ service_id: numServiceId }, { service_id: String(serviceId) }] },
        ],
      });
      if (found) return true;
    } catch (e) {}
  }
  const data = readDataFile();
  const allFavs = data.favorites || [];
  return allFavs.some(
    (f: any) =>
      (Number(f.user_id) === numUserId || String(f.user_id) === String(userId)) &&
      (Number(f.service_id) === numServiceId || String(f.service_id) === String(serviceId))
  );
}

// 10. FINANCIAL CALCULATIONS & SELLER NET EARNINGS (PHP PARITY)
export async function calculateSellerEarnings(sellerId: number) {
  const data = readDataFile();
  const allOrders = data.orders || [];
  const allPayouts = data.payouts || [];
  const services = data.services || [];
  const serviceMap = new Map(services.map((s: any) => [s.id, s.title]));

  // 1. Orders for this seller
  const sellerOrders = allOrders.filter((o: any) => Number(o.seller_id) === Number(sellerId));

  // 2. Filter completed orders (strictly status 2 = complete in Qixer PHP)
  const completedOrders = sellerOrders.filter(
    (o: any) => Number(o.status) === 2 || o.status === '2' || o.status === 'complete'
  );

  let grossSales = 0;
  let totalTax = 0;
  let totalCommission = 0;
  let totalNetEarnings = 0;

  const completedOrdersDetails = completedOrders.map((o: any) => {
    const gross = Number(o.total) || 0;
    const tax = Number(o.tax) || 0;
    // Commission rate: default 10% or explicit commission_amount
    const commissionRate = 10;
    const commission =
      o.commission_amount !== undefined && o.commission_amount !== null
        ? Number(o.commission_amount)
        : Math.round(gross * (commissionRate / 100));

    // Extra services (if any)
    let extraTotal = 0;
    if (Array.isArray(o.extraServices)) {
      o.extraServices.forEach((es: any) => {
        if (es.payment_status === 'complete') {
          extraTotal += Number(es.total) || 0;
        }
      });
    }

    const sellerShare = Math.max(0, gross + extraTotal - tax - commission);

    grossSales += gross + extraTotal;
    totalTax += tax;
    totalCommission += commission;
    totalNetEarnings += sellerShare;

    return {
      order_id: o.id,
      service_id: o.service_id,
      service_title: o.service_title || serviceMap.get(o.service_id) || 'Service Booking',
      client_name: o.name || 'Client',
      date: o.date || o.created_at,
      gross_amount: gross + extraTotal,
      tax_amount: tax,
      commission_amount: commission,
      net_earning: sellerShare,
    };
  });

  // 3. Payouts for this seller
  const sellerPayouts = allPayouts.filter((p: any) => Number(p.seller_id) === Number(sellerId));
  const pendingWithdrawals = sellerPayouts
    .filter((p: any) => Number(p.status) === 0)
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const completedWithdrawals = sellerPayouts
    .filter((p: any) => Number(p.status) === 1)
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const totalWithdrawn = completedWithdrawals;
  const availableBalance = Math.max(0, totalNetEarnings - totalWithdrawn - pendingWithdrawals);

  return {
    seller_id: Number(sellerId),
    completed_orders_count: completedOrders.length,
    gross_sales: grossSales,
    total_tax: totalTax,
    total_commission: totalCommission,
    total_net_earnings: totalNetEarnings,
    pending_withdrawals: pendingWithdrawals,
    completed_withdrawals: completedWithdrawals,
    total_withdrawn: totalWithdrawn,
    available_balance: availableBalance,
    completed_orders_details: completedOrdersDetails,
    payout_history: sellerPayouts,
  };
}

export async function calculatePlatformFinancials() {
  const data = readDataFile();
  const allUsers = data.users || [];
  const sellers = allUsers.filter((u: any) => u.role === 'seller' || Number(u.user_type) === 0);

  const sellerSummaries = await Promise.all(
    sellers.map(async (s: any) => {
      const fin = await calculateSellerEarnings(s.id);
      return {
        ...fin,
        seller_name: s.name,
        seller_email: s.email,
        seller_phone: s.phone || '',
        seller_address: s.address || '',
        seller_city: s.city || s.service_city || '',
      };
    })
  );

  const platformGrossSales = sellerSummaries.reduce((sum, s) => sum + s.gross_sales, 0);
  const platformCommissionEarned = sellerSummaries.reduce((sum, s) => sum + s.total_commission, 0);
  const platformSellersNetEarnings = sellerSummaries.reduce((sum, s) => sum + s.total_net_earnings, 0);
  const platformCompletedPayouts = sellerSummaries.reduce((sum, s) => sum + s.completed_withdrawals, 0);
  const platformPendingPayouts = sellerSummaries.reduce((sum, s) => sum + s.pending_withdrawals, 0);
  const platformWalletReserves = sellerSummaries.reduce((sum, s) => sum + s.available_balance, 0);

  return {
    platform_gross_sales: platformGrossSales,
    platform_commission_earned: platformCommissionEarned,
    platform_sellers_net_earnings: platformSellersNetEarnings,
    platform_completed_payouts: platformCompletedPayouts,
    platform_pending_payouts: platformPendingPayouts,
    platform_wallet_reserves: platformWalletReserves,
    seller_summaries: sellerSummaries,
  };
}

// 11. REVIEWS (PHP SERVICE & SELLER/BUYER REVIEWS PARITY)
export async function getReviews(
  filter: {
    service_id?: number;
    seller_id?: number;
    buyer_id?: number;
    order_id?: number | string;
    type?: number;
  } = {}
) {
  const data = readDataFile();
  let reviews = data.reviews || [];

  if (filter.service_id !== undefined) {
    reviews = reviews.filter((r: any) => Number(r.service_id) === Number(filter.service_id));
  }
  if (filter.seller_id !== undefined) {
    reviews = reviews.filter((r: any) => Number(r.seller_id) === Number(filter.seller_id));
  }
  if (filter.buyer_id !== undefined) {
    reviews = reviews.filter((r: any) => Number(r.buyer_id) === Number(filter.buyer_id));
  }
  if (filter.order_id !== undefined) {
    reviews = reviews.filter((r: any) => String(r.order_id) === String(filter.order_id));
  }
  if (filter.type !== undefined) {
    reviews = reviews.filter((r: any) => Number(r.type ?? 1) === Number(filter.type));
  }

  const users = await getUsers();
  const userMap = new Map((users || []).map((u: any) => [Number(u.id), u]));
  const serviceMap = new Map((data.services || []).map((s: any) => [Number(s.id), s]));

  return reviews
    .map((r: any) => {
      const buyer = userMap.get(Number(r.buyer_id));
      const seller = userMap.get(Number(r.seller_id));
      const service = serviceMap.get(Number(r.service_id));
      return {
        ...r,
        buyer_name: r.buyer_name || r.name || buyer?.name || 'Client',
        buyer_email: r.buyer_email || r.email || buyer?.email || '',
        buyer_image: buyer?.image || r.buyer_image || '/assets/frontend/img/static/user_profile.png',
        seller_name: seller?.name || 'Service Provider',
        seller_image: seller?.image || r.seller_image || '/assets/frontend/img/static/user_profile.png',
        service_title: r.service_title || service?.title || 'Service Booking',
        service_slug: service?.slug || '',
      };
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createReview(review: any) {
  const data = readDataFile();
  if (!data.reviews) data.reviews = [];

  const nextId = data.reviews.length > 0 ? Math.max(...data.reviews.map((r: any) => r.id || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newReview = {
    id: nextId,
    order_id: review.order_id || null,
    service_id: review.service_id ? Number(review.service_id) : 0,
    seller_id: review.seller_id ? Number(review.seller_id) : 2,
    buyer_id: review.buyer_id ? Number(review.buyer_id) : 4,
    rating: Number(review.rating) || 5,
    name: review.name || 'Client',
    email: review.email || '',
    message: review.message || '',
    type: review.type !== undefined ? Number(review.type) : 1, // 1: Buyer to Seller, 0: Seller to Buyer
    status: 1,
    created_at: now,
    updated_at: now,
  };

  data.reviews.unshift(newReview);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('reviews').insertOne(newReview);
    } catch (e) {}
  }

  // Trigger Notification to recipient
  try {
    if (newReview.type === 1) {
      // Notify seller
      await createNotification({
        role: 'seller',
        user_id: newReview.seller_id,
        order_id: newReview.order_id,
        title: 'New Client Review Received',
        message: `${newReview.name} left a ${newReview.rating}-star review on Order #${newReview.order_id || 'Booking'}`,
        link: '/seller/reviews',
        icon: 'las la-star',
        type: 'review',
      });
      // Notify admin
      await createNotification({
        role: 'admin',
        order_id: newReview.order_id,
        title: `New Service Review (${newReview.rating}★)`,
        message: `${newReview.name} submitted a ${newReview.rating}-star review`,
        link: '/admin/reviews',
        icon: 'las la-star',
        type: 'review',
      });
    } else {
      // Seller reviewing buyer (type 0)
      await createNotification({
        role: 'buyer',
        user_id: newReview.buyer_id,
        order_id: newReview.order_id,
        title: 'Seller Feedback Received',
        message: `Your service provider left feedback (${newReview.rating}★) for Order #${newReview.order_id}`,
        link: '/buyer/orders',
        icon: 'las la-user-check',
        type: 'review',
      });
    }
  } catch (err) {}

  return newReview;
}

export async function updateReview(id: number, fields: { rating?: number; message?: string }) {
  const data = readDataFile();
  if (!data.reviews) data.reviews = [];
  const idx = data.reviews.findIndex((r: any) => Number(r.id) === Number(id));
  if (idx === -1) return null;

  const now = new Date().toISOString();
  if (fields.rating !== undefined) data.reviews[idx].rating = Number(fields.rating);
  if (fields.message !== undefined) data.reviews[idx].message = fields.message.trim();
  data.reviews[idx].updated_at = now;

  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('reviews').updateOne({ id: Number(id) }, { $set: data.reviews[idx] });
    } catch (e) {}
  }

  return data.reviews[idx];
}

export async function deleteReview(id: number) {
  const data = readDataFile();
  if (!data.reviews) data.reviews = [];
  const idx = data.reviews.findIndex((r: any) => Number(r.id) === Number(id));
  if (idx > -1) {
    data.reviews.splice(idx, 1);
    writeDataFile(data);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('reviews').deleteOne({ id: Number(id) });
      } catch (e) {}
    }
    return true;
  }
  return false;
}

export async function replyReview(id: number, reply: string) {
  const data = readDataFile();
  if (!data.reviews) data.reviews = [];
  const target = data.reviews.find((r: any) => Number(r.id) === Number(id));
  if (!target) return null;

  const now = new Date().toISOString();
  target.reply = reply;
  target.reply_at = now;
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('reviews').updateOne({ id: Number(id) }, { $set: { reply, reply_at: now } });
    } catch (e) {}
  }

  return target;
}

// 12. NOTIFICATIONS (PHP EXACT PARITY)
export interface NotificationData {
  id: number;
  role: 'admin' | 'seller' | 'buyer';
  user_id?: number | null;
  order_id?: number | string | null;
  ticket_id?: number | string | null;
  job_post_id?: number | string | null;
  title: string;
  message: string;
  link: string;
  icon: string;
  type: 'order' | 'ticket' | 'dispute' | 'payout' | 'review' | 'general';
  status: number; // 0 = unread, 1 = read
  created_at: string;
}

export async function getNotifications(
  filter: {
    role?: string;
    user_id?: number;
    status?: number;
  } = {}
) {
  let list: NotificationData[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const q: any = {};
      if (filter.role) q.role = filter.role;
      if (filter.user_id !== undefined && filter.user_id !== null) {
        q.$or = [{ user_id: Number(filter.user_id) }, { user_id: String(filter.user_id) }, { user_id: null }, { user_id: { $exists: false } }];
      }
      if (filter.status !== undefined) q.status = Number(filter.status);

      const docs = await db.collection('notifications').find(q).sort({ created_at: -1, id: -1 }).toArray();
      if (docs && docs.length > 0) {
        list = docs.map(({ _id, ...rest }) => rest as NotificationData);
      }
    } catch (e) {}
  }

  if (list.length === 0) {
    const data = readDataFile();
    list = data.notifications || [];

    if (filter.role) {
      list = list.filter((n) => n.role === filter.role);
    }
    if (filter.user_id !== undefined && filter.user_id !== null) {
      list = list.filter((n) => n.user_id === undefined || n.user_id === null || Number(n.user_id) === Number(filter.user_id));
    }
    if (filter.status !== undefined) {
      list = list.filter((n) => Number(n.status) === Number(filter.status));
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const unreadCount = list.filter((n) => Number(n.status) === 0).length;

  return {
    notifications: list,
    unread_count: unreadCount,
  };
}

export async function createNotification(item: Partial<NotificationData>) {
  const data = readDataFile();
  if (!data.notifications) data.notifications = [];

  const nextId = data.notifications.length > 0 ? Math.max(...data.notifications.map((n: any) => n.id || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newNotif: NotificationData = {
    id: nextId,
    role: (item.role as any) || 'admin',
    user_id: item.user_id !== undefined ? item.user_id : null,
    order_id: item.order_id || null,
    ticket_id: item.ticket_id || null,
    job_post_id: item.job_post_id || null,
    title: item.title || 'Notification',
    message: item.message || '',
    link: item.link || (item.role === 'seller' ? '/seller/orders' : item.role === 'buyer' ? '/buyer/orders' : '/admin/orders'),
    icon: item.icon || 'las la-bell',
    type: (item.type as any) || 'general',
    status: 0, // Unread
    created_at: now,
  };

  data.notifications.unshift(newNotif);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').insertOne(newNotif);
    } catch (e) {}
  }

  return newNotif;
}

export async function markNotificationAsRead(id: number | string) {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.notifications) data.notifications = [];
  const target = data.notifications.find((n: any) => String(n.id) === String(id) || (numId && n.id === numId));
  if (target) {
    target.status = 1;
    writeDataFile(data);
  }

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').updateMany(
        { $or: [{ id: numId }, { id: String(id) }] },
        { $set: { status: 1 } }
      );
    } catch (e) {}
  }
  return target || { id, status: 1 };
}

export async function markNotificationsBatchAsRead(ids: (number | string)[]) {
  if (!ids || ids.length === 0) return true;
  const numIds = ids.map((id) => Number(id)).filter((n) => !isNaN(n));
  const strIds = ids.map((id) => String(id));

  const data = readDataFile();
  if (!data.notifications) data.notifications = [];
  data.notifications.forEach((n: any) => {
    if (strIds.includes(String(n.id)) || (n.id && numIds.includes(Number(n.id)))) {
      n.status = 1;
    }
  });
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').updateMany(
        { $or: [{ id: { $in: numIds } }, { id: { $in: strIds } }] },
        { $set: { status: 1 } }
      );
    } catch (e) {}
  }
  return true;
}

export async function markAllNotificationsAsRead(filter: { role?: string; user_id?: number } = {}) {
  const data = readDataFile();
  if (!data.notifications) data.notifications = [];

  data.notifications.forEach((n: any) => {
    let match = true;
    if (filter.role && n.role !== filter.role) match = false;
    if (filter.user_id !== undefined && n.user_id && Number(n.user_id) !== Number(filter.user_id)) match = false;
    if (match) n.status = 1;
  });

  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      const q: any = {};
      if (filter.role) q.role = filter.role;
      if (filter.user_id !== undefined) {
        q.$or = [{ user_id: Number(filter.user_id) }, { user_id: String(filter.user_id) }, { user_id: null }, { user_id: { $exists: false } }];
      }
      await db.collection('notifications').updateMany(q, { $set: { status: 1 } });
    } catch (e) {}
  }

  return true;
}

export async function deleteNotification(id: number | string) {
  const data = readDataFile();
  if (!data.notifications) data.notifications = [];
  const idx = data.notifications.findIndex((n: any) => String(n.id) === String(id));
  if (idx > -1) {
    data.notifications.splice(idx, 1);
    writeDataFile(data);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('notifications').deleteOne({ id: Number(id) });
      } catch (e) {}
    }
    return true;
  }
  return false;
}

export async function clearAllNotifications(filter: { role?: string; user_id?: number } = {}) {
  const data = readDataFile();
  if (!data.notifications) data.notifications = [];

  data.notifications = data.notifications.filter((n: any) => {
    let match = true;
    if (filter.role && n.role !== filter.role) match = false;
    if (filter.user_id !== undefined && n.user_id && Number(n.user_id) !== Number(filter.user_id)) match = false;
    return !match;
  });

  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      const q: any = {};
      if (filter.role) q.role = filter.role;
      if (filter.user_id !== undefined) q.user_id = filter.user_id;
      await db.collection('notifications').deleteMany(q);
    } catch (e) {}
  }

  return true;
}

// 10. BLOGS
export interface MongoBlog {
  id: number;
  title: string;
  slug: string;
  category: string;
  category_id?: string;
  image: string;
  author: string;
  excerpt: string;
  content: string;
  status?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_tags?: string;
  views?: number;
  created_at: string;
}

function normalizeBlog(b: any): MongoBlog {
  if (!b) return b;
  let author = b.author;
  if (!author || author === 's-admin@gmail.com' || author.toLowerCase().includes('s-admin')) {
    author = 'Admin';
  }
  return { ...b, author };
}

export async function getBlogs(filter: { category?: string; status?: string; search?: string } = {}): Promise<MongoBlog[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const q: any = {};
      if (filter.status) q.status = filter.status;
      if (filter.category && filter.category !== 'All') q.category = filter.category;
      if (filter.search) {
        q.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { excerpt: { $regex: filter.search, $options: 'i' } },
        ];
      }
      const blogs = await db.collection('blogs').find(q).sort({ id: -1 }).toArray();
      if (blogs && blogs.length > 0) return blogs.map(({ _id, ...rest }) => normalizeBlog(rest as MongoBlog));
    } catch (e) {}
  }

  const data = readDataFile();
  let result = (data.blogs || []) as MongoBlog[];
  if (filter.status) result = result.filter((b: any) => (b.status || 'publish') === filter.status);
  if (filter.category && filter.category !== 'All') result = result.filter((b: any) => b.category === filter.category);
  if (filter.search) {
    const s = filter.search.toLowerCase();
    result = result.filter((b: any) => (b.title && b.title.toLowerCase().includes(s)) || (b.excerpt && b.excerpt.toLowerCase().includes(s)));
  }
  return result.map(normalizeBlog);
}

export async function getBlogById(id: number | string): Promise<MongoBlog | null> {
  const numId = Number(id);
  const db = await getMongoDb();
  if (db) {
    try {
      const blog = await db.collection('blogs').findOne({ $or: [{ id: numId }, { id: String(numId) }] });
      if (blog) {
        const { _id, ...rest } = blog;
        return normalizeBlog(rest as MongoBlog);
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = (data.blogs || []).find((b: any) => Number(b.id) === numId);
  return found ? normalizeBlog(found) : null;
}

export async function getBlogBySlug(slug: string): Promise<MongoBlog | null> {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const db = await getMongoDb();
  if (db) {
    try {
      const blog = await db.collection('blogs').findOne({
        $or: [
          { slug: decoded },
          { slug: { $regex: new RegExp(`^${decoded}$`, 'i') } },
        ],
      });
      if (blog) {
        const { _id, ...rest } = blog;
        return normalizeBlog(rest as MongoBlog);
      }
    } catch (e) {}
  }
  const data = readDataFile();
  const found = (data.blogs || []).find(
    (b: any) =>
      b.slug?.toLowerCase() === decoded ||
      encodeURIComponent(b.slug || '').toLowerCase() === decoded ||
      b.slug?.replace(/&/g, 'and').toLowerCase() === decoded
  );
  return found ? normalizeBlog(found) : null;
}

export async function createBlog(blog: {
  title: string;
  slug?: string;
  category?: string;
  category_id?: string;
  image?: string;
  author?: string;
  excerpt?: string;
  content: string;
  status?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_tags?: string;
}): Promise<MongoBlog> {
  const data = readDataFile();
  if (!data.blogs) data.blogs = [];

  const rawSlug = blog.slug || blog.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  const finalSlug = `${rawSlug}-${Date.now().toString().slice(-4)}`;
  const newBlog: MongoBlog = {
    id: Date.now(),
    title: blog.title,
    slug: finalSlug,
    category: blog.category || 'General',
    category_id: blog.category_id || '1',
    image: blog.image || '/assets/uploads/media-uploader/banner11638279446.png',
    author: blog.author || 'Super Admin',
    excerpt: blog.excerpt || blog.title,
    content: blog.content,
    status: blog.status || 'publish',
    tags: blog.tags || [],
    meta_title: blog.meta_title || blog.title,
    meta_description: blog.meta_description || blog.excerpt || blog.title,
    meta_tags: blog.meta_tags || (blog.tags ? blog.tags.join(', ') : ''),
    views: 0,
    created_at: new Date().toISOString(),
  };

  data.blogs.unshift(newBlog);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('blogs').insertOne(newBlog);
    } catch (e) {}
  }

  return newBlog;
}

export async function updateBlog(id: number | string, update: Partial<MongoBlog>): Promise<MongoBlog | null> {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.blogs) data.blogs = [];

  const idx = data.blogs.findIndex((b: any) => Number(b.id) === numId);
  if (idx === -1) return null;

  const updatedBlog = { ...data.blogs[idx], ...update, id: numId };
  data.blogs[idx] = updatedBlog;
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('blogs').updateOne(
        { $or: [{ id: numId }, { id: String(numId) }] },
        { $set: update }
      );
    } catch (e) {}
  }

  return updatedBlog;
}

export async function deleteBlog(id: number | string): Promise<boolean> {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.blogs) data.blogs = [];

  const idx = data.blogs.findIndex((b: any) => Number(b.id) === numId);
  if (idx === -1) return false;

  data.blogs.splice(idx, 1);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('blogs').deleteOne({ $or: [{ id: numId }, { id: String(numId) }] });
    } catch (e) {}
  }

  return true;
}

// ==========================================
// 22. CONTACT MESSAGES (PHP FRONTEND FORM PARITY)
// ==========================================
export interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}

export async function createContactMessage(item: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<ContactMessageItem> {
  const data = readDataFile();
  if (!data.contact_messages) data.contact_messages = [];

  const nextId = data.contact_messages.length > 0 ? Math.max(...data.contact_messages.map((m: any) => m.id || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newMsg: ContactMessageItem = {
    id: nextId,
    name: item.name.trim(),
    email: item.email.trim(),
    phone: (item.phone || '').trim(),
    subject: (item.subject || 'General Inquiry').trim(),
    message: item.message.trim(),
    status: 'unread',
    created_at: now,
  };

  data.contact_messages.unshift(newMsg);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('contact_messages').insertOne(newMsg);
    } catch (e) {}
  }

  return newMsg;
}

export async function getContactMessages(): Promise<ContactMessageItem[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const messages = await db.collection('contact_messages').find({}).sort({ id: -1 }).toArray();
      if (messages && messages.length > 0) {
        return messages.map(({ _id, ...rest }) => rest as ContactMessageItem);
      }
    } catch (e) {}
  }

  const data = readDataFile();
  return (data.contact_messages || []) as ContactMessageItem[];
}

// ==========================================
// 21. EXTRA SERVICES (TRAVEL & LOGISTICS SURCHARGES)
// ==========================================
export interface ExtraServiceData {
  id: number;
  order_id: number;
  title: string;
  quantity: number;
  price: number;
  tax?: number;
  sub_total: number;
  total: number;
  payment_gateway?: string;
  transaction_id?: string;
  payment_status: 'pending' | 'complete';
  status: number; // 0 = pending, 1 = complete/accepted
  created_at: string;
  updated_at?: string;
}

export async function getExtraServices(orderId: number | string): Promise<ExtraServiceData[]> {
  const numOrderId = Number(orderId);
  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('extra_services').find({
        $or: [{ order_id: numOrderId }, { order_id: String(orderId) }]
      }).sort({ id: -1 }).toArray();
      if (docs && docs.length > 0) {
        return docs.map(({ _id, ...rest }) => rest as ExtraServiceData);
      }
    } catch (e) {}
  }

  const data = readDataFile();
  const list = data.extra_services || [];
  return list.filter((e: any) => Number(e.order_id) === numOrderId || String(e.order_id) === String(orderId));
}

export async function createExtraService(item: {
  order_id: number | string;
  title: string;
  price: number;
  quantity?: number;
  seller_id?: number;
  buyer_id?: number;
}): Promise<ExtraServiceData> {
  const numOrderId = Number(item.order_id);
  const qty = Number(item.quantity) || 1;
  const unitPrice = Number(item.price) || 0;
  const subTotal = qty * unitPrice;
  const total = subTotal;
  const now = new Date().toISOString();

  const data = readDataFile();
  if (!data.extra_services) data.extra_services = [];
  const nextId = data.extra_services.length > 0 ? Math.max(...data.extra_services.map((e: any) => e.id || 0)) + 1 : Date.now();

  const newExtra: ExtraServiceData = {
    id: nextId,
    order_id: numOrderId,
    title: item.title.trim(),
    quantity: qty,
    price: unitPrice,
    tax: 0,
    sub_total: subTotal,
    total: total,
    payment_status: 'pending',
    status: 0,
    created_at: now,
  };

  data.extra_services.unshift(newExtra);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('extra_services').insertOne(newExtra);
    } catch (e) {}
  }

  // Notify buyer automatically
  try {
    const order = await getOrderById(numOrderId);
    const buyerId = item.buyer_id || order?.buyer_id;
    await createNotification({
      role: 'buyer',
      user_id: buyerId ? Number(buyerId) : undefined,
      order_id: numOrderId,
      title: `Extra Service / Logistics Request on Order #${numOrderId}`,
      message: `Your service provider requested ₦${total.toLocaleString()} for "${newExtra.title}". Click to review and pay online.`,
      link: `/buyer/orders/${numOrderId}`,
      icon: 'las la-receipt',
      type: 'order',
    });
  } catch (err) {}

  return newExtra;
}

export async function acceptAndPayExtraService(
  extraId: number | string,
  paymentData: { payment_gateway: string; transaction_id?: string }
): Promise<ExtraServiceData | null> {
  const numId = Number(extraId);
  const now = new Date().toISOString();

  const data = readDataFile();
  if (!data.extra_services) data.extra_services = [];
  const target = data.extra_services.find((e: any) => Number(e.id) === numId || String(e.id) === String(extraId));

  if (target) {
    target.payment_status = 'complete';
    target.status = 1;
    target.payment_gateway = paymentData.payment_gateway;
    target.transaction_id = paymentData.transaction_id || `EXT-TXN-${Date.now()}`;
    target.updated_at = now;

    // Update parent order finances
    const orderId = target.order_id;
    const parentOrder = data.orders?.find((o: any) => Number(o.id) === Number(orderId));
    if (parentOrder) {
      parentOrder.extra_service = (Number(parentOrder.extra_service) || 0) + target.total;
      parentOrder.sub_total = (Number(parentOrder.sub_total) || 0) + target.total;
      parentOrder.total = (Number(parentOrder.total) || 0) + target.total;
    }
    writeDataFile(data);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('extra_services').updateOne(
          { $or: [{ id: numId }, { id: String(extraId) }] },
          {
            $set: {
              payment_status: 'complete',
              status: 1,
              payment_gateway: paymentData.payment_gateway,
              transaction_id: target.transaction_id,
              updated_at: now,
            },
          }
        );

        if (parentOrder) {
          await db.collection('orders').updateOne(
            { $or: [{ id: Number(orderId) }, { id: String(orderId) }] },
            {
              $set: {
                extra_service: parentOrder.extra_service,
                sub_total: parentOrder.sub_total,
                total: parentOrder.total,
                updated_at: now,
              },
            }
          );
        }
      } catch (e) {}
    }

    // Notify seller automatically
    try {
      if (parentOrder) {
        await createNotification({
          role: 'seller',
          user_id: parentOrder.seller_id ? Number(parentOrder.seller_id) : undefined,
          order_id: parentOrder.id,
          title: `Extra Service Payment Received (Order #${parentOrder.id})`,
          message: `Buyer has paid ₦${target.total.toLocaleString()} for "${target.title}" via ${paymentData.payment_gateway.toUpperCase()}.`,
          link: `/seller/orders/${parentOrder.id}`,
          icon: 'las la-wallet',
          type: 'payout',
        });
      }
    } catch (err) {}

    return target;
  }

  return null;
}

export async function deleteExtraService(extraId: number | string): Promise<boolean> {
  const numId = Number(extraId);
  const data = readDataFile();
  if (!data.extra_services) data.extra_services = [];
  const idx = data.extra_services.findIndex((e: any) => Number(e.id) === numId || String(e.id) === String(extraId));

  if (idx > -1) {
    data.extra_services.splice(idx, 1);
    writeDataFile(data);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('extra_services').deleteOne({
          $or: [{ id: numId }, { id: String(extraId) }],
        });
      } catch (e) {}
    }
    return true;
  }

  return false;
}

// 18. SERVICE LOCATIONS (NIGERIA REGION RESTRICTED & DYNAMIC SERVICE COUNT)
export interface ServiceCityData {
  id: number;
  service_city: string;
  country: string;
  status: number;
  created_at?: string;
  updated_at?: string;
  service_count?: number;
}

export async function getServiceCities(filter?: {
  status?: number;
  onlyWithServices?: boolean;
}): Promise<ServiceCityData[]> {
  const data = readDataFile();
  let cities: ServiceCityData[] = Array.isArray(data.service_cities) ? [...data.service_cities] : [];

  // Sync from MongoDB if present
  const db = await getMongoDb();
  if (db) {
    try {
      const mongoCities = await db.collection('service_cities').find({}).toArray();
      if (mongoCities && mongoCities.length > 0) {
        cities = mongoCities.map(({ _id, ...rest }) => ({
          ...rest,
          id: Number(rest.id),
          service_city: rest.service_city || '',
          country: rest.country || 'Nigeria',
          status: rest.status !== undefined ? Number(rest.status) : 1,
        }));
      }
    } catch (e) {}
  }

  // Count active live services per location
  const allServices = await getServices({ status: 1 });
  const cityCountMap: Record<string, number> = {};
  allServices.forEach((s: any) => {
    const c = (s.city || s.service_city || '').trim();
    if (c) {
      const norm = c.toLowerCase();
      cityCountMap[norm] = (cityCountMap[norm] || 0) + 1;
    }
  });

  // Ensure any live service city is tracked in the list
  Object.keys(cityCountMap).forEach((normCity) => {
    const exists = cities.some((c) => c.service_city.trim().toLowerCase() === normCity);
    if (!exists) {
      const matched = allServices.find((s: any) => (s.city || s.service_city || '').trim().toLowerCase() === normCity);
      const properName = matched?.city || matched?.service_city || normCity;
      cities.push({
        id: cities.length + 100,
        service_city: properName,
        country: 'Nigeria',
        status: 1,
        created_at: new Date().toISOString(),
      });
    }
  });

  // Enrich with live service count
  let enriched = cities.map((c) => ({
    ...c,
    country: c.country || 'Nigeria',
    status: c.status !== undefined ? Number(c.status) : 1,
    service_count: cityCountMap[c.service_city.trim().toLowerCase()] || 0,
  }));

  // Filter by status if specified
  if (filter?.status !== undefined) {
    enriched = enriched.filter((c) => Number(c.status) === Number(filter.status));
  }

  // Filter to only locations with available services
  if (filter?.onlyWithServices) {
    enriched = enriched.filter((c) => (c.service_count || 0) > 0);
  }

  // Sort: locations with services first (descending), then alphabetical
  enriched.sort((a, b) => {
    if ((b.service_count || 0) !== (a.service_count || 0)) {
      return (b.service_count || 0) - (a.service_count || 0);
    }
    return a.service_city.localeCompare(b.service_city);
  });

  return enriched;
}

export async function createServiceCity(input: {
  service_city: string;
  country?: string;
  status?: number;
}): Promise<ServiceCityData> {
  const data = readDataFile();
  if (!data.service_cities) data.service_cities = [];

  const cityName = input.service_city.trim();
  if (!cityName) {
    throw new Error('City name is required');
  }

  const existing = data.service_cities.find(
    (c: any) => c.service_city.trim().toLowerCase() === cityName.toLowerCase()
  );
  if (existing) {
    throw new Error(`Location "${cityName}" already exists.`);
  }

  const maxId = data.service_cities.reduce((max: number, c: any) => Math.max(max, Number(c.id) || 0), 0);
  const newCity: ServiceCityData = {
    id: maxId + 1,
    service_city: cityName,
    country: 'Nigeria',
    status: input.status !== undefined ? Number(input.status) : 1,
    created_at: new Date().toISOString(),
  };

  data.service_cities.push(newCity);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('service_cities').insertOne({ ...newCity });
    } catch (e) {}
  }

  return newCity;
}

export async function updateServiceCity(
  id: number | string,
  updateData: Partial<ServiceCityData>
): Promise<ServiceCityData | null> {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.service_cities) data.service_cities = [];

  const idx = data.service_cities.findIndex((c: any) => Number(c.id) === numId);
  if (idx === -1) return null;

  const target = { ...data.service_cities[idx] };
  if (updateData.service_city !== undefined) target.service_city = updateData.service_city.trim();
  if (updateData.country !== undefined) target.country = 'Nigeria';
  if (updateData.status !== undefined) target.status = Number(updateData.status);
  target.updated_at = new Date().toISOString();

  data.service_cities[idx] = target;
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('service_cities').updateOne(
        { $or: [{ id: numId }, { id: String(numId) }] },
        { $set: target }
      );
    } catch (e) {}
  }

  return target;
}

export async function deleteServiceCity(id: number | string): Promise<boolean> {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.service_cities) data.service_cities = [];

  const idx = data.service_cities.findIndex((c: any) => Number(c.id) === numId);
  if (idx === -1) return false;

  data.service_cities.splice(idx, 1);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('service_cities').deleteOne({
        $or: [{ id: numId }, { id: String(numId) }],
      });
    } catch (e) {}
  }

  return true;
}



// ==========================================
// BUYER WALLET SYSTEM (MongoDB Native)
// ==========================================

export async function getWalletBalance(userId: number | string): Promise<number> {
  const numId = Number(userId);
  const data = readDataFile();
  const wallet = (data.wallets || []).find((w: any) => Number(w.user_id) === numId);

  const db = await getMongoDb();
  if (db) {
    try {
      const doc = await db.collection('wallets').findOne({ user_id: numId });
      if (doc && typeof doc.balance === 'number') return doc.balance;
    } catch (e) {}
  }
  return wallet ? Number(wallet.balance || 0) : 0;
}

export async function getWalletHistory(userId: number | string): Promise<any[]> {
  const numId = Number(userId);
  const data = readDataFile();
  const list = (data.wallet_transactions || []).filter((tx: any) => Number(tx.user_id) === numId);

  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('wallet_transactions').find({ user_id: numId }).sort({ created_at: -1 }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return list;
}

export async function creditWallet(
  userId: number | string,
  amount: number,
  gateway: string = 'paystack',
  transactionId: string = ''
): Promise<{ balance: number; transaction: any }> {
  const numId = Number(userId);
  const addAmt = Number(amount);
  const data = readDataFile();
  if (!data.wallets) data.wallets = [];
  if (!data.wallet_transactions) data.wallet_transactions = [];

  let wallet = data.wallets.find((w: any) => Number(w.user_id) === numId);
  if (!wallet) {
    wallet = { user_id: numId, balance: 0, updated_at: new Date().toISOString() };
    data.wallets.push(wallet);
  }
  wallet.balance = Number(wallet.balance || 0) + addAmt;
  wallet.updated_at = new Date().toISOString();

  const tx = {
    id: Date.now(),
    user_id: numId,
    amount: addAmt,
    type: 'deposit',
    gateway,
    transaction_id: transactionId || ('TXN_' + Date.now()),
    status: 'completed',
    created_at: new Date().toISOString(),
  };
  data.wallet_transactions.unshift(tx);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('wallets').updateOne(
        { user_id: numId },
        { $set: { balance: wallet.balance, updated_at: wallet.updated_at } },
        { upsert: true }
      );
      await db.collection('wallet_transactions').insertOne(tx);
    } catch (e) {}
  }

  return { balance: wallet.balance, transaction: tx };
}

export async function deductWallet(
  userId: number | string,
  amount: number,
  orderId?: number | string
): Promise<{ success: boolean; balance: number; message?: string }> {
  const numId = Number(userId);
  const deductAmt = Number(amount);
  const currentBalance = await getWalletBalance(numId);

  if (currentBalance < deductAmt) {
    return { success: false, balance: currentBalance, message: 'Insufficient wallet balance' };
  }

  const data = readDataFile();
  if (!data.wallets) data.wallets = [];
  if (!data.wallet_transactions) data.wallet_transactions = [];

  let wallet = data.wallets.find((w: any) => Number(w.user_id) === numId);
  if (!wallet) {
    wallet = { user_id: numId, balance: currentBalance, updated_at: new Date().toISOString() };
    data.wallets.push(wallet);
  }
  wallet.balance = currentBalance - deductAmt;
  wallet.updated_at = new Date().toISOString();

  const tx = {
    id: Date.now(),
    user_id: numId,
    amount: deductAmt,
    type: 'deduction',
    order_id: orderId ? Number(orderId) : undefined,
    status: 'completed',
    created_at: new Date().toISOString(),
  };
  data.wallet_transactions.unshift(tx);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('wallets').updateOne(
        { user_id: numId },
        { $set: { balance: wallet.balance, updated_at: wallet.updated_at } },
        { upsert: true }
      );
      await db.collection('wallet_transactions').insertOne(tx);
    } catch (e) {}
  }

  return { success: true, balance: wallet.balance };
}

// ==========================================
// CUSTOM JOB POSTING & BIDDING (Flutter Parity)
// ==========================================

export async function getBuyerJobs(buyerId: number | string): Promise<any[]> {
  const numId = Number(buyerId);
  const data = readDataFile();
  const jobs = (data.jobs || []).filter((j: any) => Number(j.buyer_id) === numId);

  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('jobs').find({ buyer_id: numId }).sort({ created_at: -1 }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return jobs.length > 0 ? jobs : [
    {
      id: 1,
      buyer_id: numId,
      title: 'Full Plumbing Overhaul & Borehole Maintenance',
      category: 'plumbing-solutions',
      budget: 45000,
      deadline: '2026-11-15',
      city: 'Lagos',
      status: 'open',
      description: 'Need certified plumber for borehole pressure pump inspection in Lekki Phase 1.',
      created_at: '2026-10-25T08:00:00.000Z',
    },
  ];
}

export async function getAllOpenJobs(): Promise<any[]> {
  const data = readDataFile();
  const jobs = (data.jobs || []).filter((j: any) => j.status === 'open' || !j.status);

  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('jobs').find({ status: 'open' }).sort({ created_at: -1 }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return jobs;
}

export async function getJobDetails(jobId: number | string): Promise<any> {
  const numId = Number(jobId);
  const data = readDataFile();
  const job = (data.jobs || []).find((j: any) => Number(j.id) === numId);

  const db = await getMongoDb();
  if (db) {
    try {
      const doc = await db.collection('jobs').findOne({ id: numId });
      if (doc) return doc;
    } catch (e) {}
  }
  return job || null;
}

export async function createJob(jobData: any): Promise<any> {
  const data = readDataFile();
  if (!data.jobs) data.jobs = [];

  const newJob = {
    id: Date.now(),
    buyer_id: Number(jobData.buyer_id || 4),
    title: jobData.title,
    category: jobData.category || 'other',
    description: jobData.description,
    budget: Number(jobData.budget || 0),
    deadline: jobData.deadline || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    city: jobData.city || 'Lagos',
    address: jobData.address || '',
    status: 'open',
    attachment: jobData.attachment || null,
    created_at: new Date().toISOString(),
  };

  data.jobs.unshift(newJob);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('jobs').insertOne(newJob);
    } catch (e) {}
  }

  return newJob;
}

export async function getJobProposals(jobId: number | string): Promise<any[]> {
  const numId = Number(jobId);
  const data = readDataFile();
  let proposals = (data.job_proposals || []).filter((p: any) => Number(p.job_id) === numId);

  // If empty and jobId is 1, seed default proposals for realistic parity demo
  if (proposals.length === 0 && numId === 1) {
    if (!data.job_proposals) data.job_proposals = [];
    const defaults = [
      {
        id: 101,
        job_id: 1,
        seller_id: 2,
        seller_name: 'Babatunde Raji',
        seller_image: '/assets/frontend/img/static/user_profile.png',
        seller_country: 'Nigeria',
        seller_city: 'Lagos',
        completed_order: 48,
        order_completion_rate: 98,
        proposed_amount: 42000,
        expected_salary: 42000,
        proposed_price: 42000,
        cover_letter: 'Hello! I am a certified master plumber with 8+ years experience in Lekki and Victoria Island. I have borehole pressure pump testing equipment and can inspect your system first thing tomorrow.',
        message: 'Hello! I am a certified master plumber with 8+ years experience in Lekki and Victoria Island. I have borehole pressure pump testing equipment and can inspect your system first thing tomorrow.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 102,
        job_id: 1,
        seller_id: 3,
        seller_name: 'Emeka Nwosu',
        seller_image: '/assets/frontend/img/static/user_profile.png',
        seller_country: 'Nigeria',
        seller_city: 'Lagos',
        completed_order: 32,
        order_completion_rate: 95,
        proposed_amount: 45000,
        expected_salary: 45000,
        proposed_price: 45000,
        cover_letter: 'I can handle this overhaul thoroughly. I supply standard brass fittings and provide a 3-month guarantee on all pressure pump repairs.',
        message: 'I can handle this overhaul thoroughly. I supply standard brass fittings and provide a 3-month guarantee on all pressure pump repairs.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
    data.job_proposals.push(...defaults);
    writeDataFile(data);
    proposals = defaults;
  }

  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('job_proposals').find({ job_id: numId }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return proposals;
}

export async function getBuyerJobRequests(buyerId: number | string): Promise<any[]> {
  const numBuyerId = Number(buyerId);
  const data = readDataFile();
  const buyerJobs = (data.jobs || []).filter((j: any) => Number(j.buyer_id) === numBuyerId);
  const jobMap = new Map<number, any>();
  buyerJobs.forEach((j: any) => jobMap.set(Number(j.id), j));

  // If buyerJobs has job 1, ensure default proposals exist
  if (jobMap.has(1)) {
    await getJobProposals(1);
  }

  const refreshedData = readDataFile();
  const allProposals = refreshedData.job_proposals || [];

  const buyerProposals = allProposals
    .filter((p: any) => jobMap.has(Number(p.job_id)))
    .map((p: any) => {
      const job = jobMap.get(Number(p.job_id));
      const seller = (refreshedData.users || []).find((u: any) => Number(u.id) === Number(p.seller_id));
      return {
        ...p,
        seller_id: p.seller_id || seller?.id || 2,
        seller_name: p.seller_name || seller?.name || 'Verified Artisan',
        seller_image: p.seller_image || seller?.image || '/assets/frontend/img/static/user_profile.png',
        seller_country: p.seller_country || seller?.country || 'Nigeria',
        seller_city: p.seller_city || seller?.city || 'Lagos',
        completed_order: p.completed_order || 48,
        order_completion_rate: p.order_completion_rate || 98,
        expected_salary: Number(p.expected_salary || p.proposed_amount || p.proposed_price || 0),
        proposed_price: Number(p.proposed_price || p.proposed_amount || p.expected_salary || 0),
        cover_letter: p.cover_letter || p.message || 'Available to complete this project immediately.',
        job: job
          ? {
              id: job.id,
              title: job.title,
              price: Number(job.budget || 0),
              budget: Number(job.budget || 0),
              deadline: job.deadline,
              description: job.description,
            }
          : null,
        seller: seller
          ? {
              id: seller.id,
              name: seller.name,
              email: seller.email,
              phone: seller.phone,
              created_at: seller.created_at || '2023-01-15T00:00:00.000Z',
            }
          : {
              id: p.seller_id || 2,
              name: p.seller_name || 'Babatunde Raji',
              email: 'artisan@qixer.com',
              phone: '+234 803 123 4567',
              created_at: '2023-01-15T00:00:00.000Z',
            },
      };
    });

  return buyerProposals;
}

export async function getSellerProposals(sellerId: number | string): Promise<any[]> {
  const numSellerId = Number(sellerId);
  const data = readDataFile();
  const allProposals = data.job_proposals || [];
  const jobs = data.jobs || [];

  return allProposals
    .filter((p: any) => Number(p.seller_id) === numSellerId)
    .map((p: any) => {
      const job = jobs.find((j: any) => Number(j.id) === Number(p.job_id));
      return {
        ...p,
        job,
      };
    });
}

export async function createJobProposal(proposalData: any): Promise<any> {
  const data = readDataFile();
  if (!data.job_proposals) data.job_proposals = [];

  const newProposal = {
    id: Date.now(),
    job_id: Number(proposalData.job_id),
    seller_id: Number(proposalData.seller_id || 2),
    seller_name: proposalData.seller_name || 'Professional Artisan',
    seller_image: proposalData.seller_image || '/assets/frontend/img/static/user_profile.png',
    seller_rating: Number(proposalData.seller_rating || 5.0),
    seller_country: proposalData.seller_country || 'Nigeria',
    seller_city: proposalData.seller_city || 'Lagos',
    completed_order: proposalData.completed_order || 48,
    order_completion_rate: proposalData.order_completion_rate || 98,
    proposed_amount: Number(proposalData.proposed_amount || proposalData.expected_salary || 0),
    expected_salary: Number(proposalData.expected_salary || proposalData.proposed_amount || 0),
    proposed_price: Number(proposalData.proposed_price || proposalData.proposed_amount || 0),
    cover_letter: proposalData.cover_letter || proposalData.message || '',
    message: proposalData.message || proposalData.cover_letter || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  data.job_proposals.unshift(newProposal);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('job_proposals').insertOne(newProposal);
    } catch (e) {}
  }

  return newProposal;
}

export async function acceptJobProposal(jobId: number | string, proposalId: number | string): Promise<any> {
  const numJobId = Number(jobId);
  const numProposalId = Number(proposalId);
  const data = readDataFile();

  if (data.jobs) {
    const job = data.jobs.find((j: any) => Number(j.id) === numJobId);
    if (job) job.status = 'in_progress';
  }

  if (data.job_proposals) {
    data.job_proposals.forEach((p: any) => {
      if (Number(p.job_id) === numJobId) {
        p.status = Number(p.id) === numProposalId ? 'accepted' : 'rejected';
      }
    });
  }

  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('jobs').updateOne({ id: numJobId }, { $set: { status: 'in_progress' } });
      await db.collection('job_proposals').updateMany(
        { job_id: numJobId },
        { $set: { status: 'rejected' } }
      );
      await db.collection('job_proposals').updateOne(
        { id: numProposalId },
        { $set: { status: 'accepted' } }
      );
    } catch (e) {}
  }

  return { success: true };
}

// ==========================================
// WEB PUSH SUBSCRIPTIONS (MongoDB Native, NO Firebase)
// ==========================================

export async function savePushSubscription(userId: number | string | null, subscription: any): Promise<boolean> {
  const data = readDataFile();
  if (!data.push_subscriptions) data.push_subscriptions = [];

  const subObj = {
    id: Date.now(),
    user_id: userId ? Number(userId) : null,
    endpoint: subscription.endpoint,
    keys: subscription.keys || {},
    created_at: new Date().toISOString(),
  };

  const existingIdx = data.push_subscriptions.findIndex((s: any) => s.endpoint === subscription.endpoint);
  if (existingIdx !== -1) {
    data.push_subscriptions[existingIdx] = subObj;
  } else {
    data.push_subscriptions.push(subObj);
  }
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('push_subscriptions').updateOne(
        { endpoint: subscription.endpoint },
        { $set: subObj },
        { upsert: true }
      );
    } catch (e) {}
  }

  return true;
}

export async function getPushSubscriptions(userId?: number | string): Promise<any[]> {
  const numId = userId !== undefined ? Number(userId) : undefined;
  const data = readDataFile();
  const list = numId !== undefined ? (data.push_subscriptions || []).filter((s: any) => Number(s.user_id) === numId) : (data.push_subscriptions || []);

  const db = await getMongoDb();
  if (db) {
    try {
      const query = numId !== undefined ? { user_id: numId } : {};
      const docs = await db.collection('push_subscriptions').find(query).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return list;
}

export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  const data = readDataFile();
  if (data.push_subscriptions) {
    const idx = data.push_subscriptions.findIndex((s: any) => s.endpoint === endpoint);
    if (idx !== -1) {
      data.push_subscriptions.splice(idx, 1);
      writeDataFile(data);
    }
  }

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('push_subscriptions').deleteOne({ endpoint });
    } catch (e) {}
  }
  return true;
}

// ==========================================
// MOBILE PWA SETTINGS & MODULE PERMISSIONS
// ==========================================

export async function getMobilePwaSettings(): Promise<any> {
  const data = readDataFile();
  const db = await getMongoDb();
  if (db) {
    try {
      const doc = await db.collection('mobile_pwa_settings').findOne({});
      if (doc) return doc;
    } catch (e) {}
  }
  return (
    data.mobile_pwa_settings || {
      pwa_enabled: true,
      app_name: 'QwikConnect - On-Demand Services',
      short_name: 'QwikConnect',
      theme_color: '#1DBF73',
      background_color: '#FFFFFF',
      module_permissions: {
        Wallet: true,
        JobPost: true,
        LiveChat: true,
        MapView: true,
        Onboarding: true,
      },
    }
  );
}

export async function updateMobilePwaSettings(settings: any): Promise<any> {
  const data = readDataFile();
  data.mobile_pwa_settings = { ...(data.mobile_pwa_settings || {}), ...settings, updated_at: new Date().toISOString() };
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('mobile_pwa_settings').updateOne({}, { $set: data.mobile_pwa_settings }, { upsert: true });
    } catch (e) {}
  }

  return data.mobile_pwa_settings;
}

export async function getMobileBanners(): Promise<any[]> {
  const data = readDataFile();
  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('mobile_banners').find({}).sort({ id: 1 }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return (
    data.mobile_banners || [
      {
        id: 1,
        title: 'Special 20% Off Home Cleaning',
        subtitle: 'Valid across Lagos & Abuja this week',
        image: '/assets/uploads/media-uploader/banner11638279446.png',
        link: 'cleaning',
        active: true,
      },
      {
        id: 2,
        title: 'Certified Inverter & Solar Repairs',
        subtitle: '24/7 Verified Nigerian Electricians',
        image: '/assets/uploads/media-uploader/service_electrical_nigerian.jpg',
        link: 'electrical-repair',
        active: true,
      },
      {
        id: 3,
        title: 'Emergency Plumbing Response',
        subtitle: 'Quick pipe leakage & pump servicing',
        image: '/assets/uploads/media-uploader/service_plumbing_nigerian.jpg',
        link: 'plumbing-solutions',
        active: true,
      },
    ]
  );
}

export async function createMobileBanner(bannerData: any): Promise<any> {
  const data = readDataFile();
  if (!data.mobile_banners) data.mobile_banners = [];

  const newBanner = {
    id: Date.now(),
    title: bannerData.title,
    subtitle: bannerData.subtitle || '',
    image: bannerData.image || '/assets/uploads/media-uploader/banner11638279446.png',
    link: bannerData.link || '',
    active: bannerData.active !== undefined ? bannerData.active : true,
    created_at: new Date().toISOString(),
  };

  data.mobile_banners.push(newBanner);
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('mobile_banners').insertOne(newBanner);
    } catch (e) {}
  }

  return newBanner;
}

export async function deleteMobileBanner(id: number | string): Promise<boolean> {
  const numId = Number(id);
  const data = readDataFile();
  if (!data.mobile_banners) data.mobile_banners = [];

  const idx = data.mobile_banners.findIndex((b: any) => Number(b.id) === numId);
  if (idx !== -1) {
    data.mobile_banners.splice(idx, 1);
    writeDataFile(data);
  }

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('mobile_banners').deleteOne({ id: numId });
    } catch (e) {}
  }

  return true;
}

export async function getOnboardingSlides(): Promise<any[]> {
  const data = readDataFile();
  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db.collection('onboarding_slides').find({}).sort({ id: 1 }).toArray();
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return (
    data.onboarding_slides || [
      {
        id: 1,
        title: 'Verified Artisans at Your Doorstep',
        subtitle: 'Find trusted local professionals in Lagos, Abuja & nationwide',
        description: 'Every artisan is background-checked and identity-verified for quality work.',
        icon: 'las la-user-check',
      },
      {
        id: 2,
        title: 'Transparent Pricing in Naira (₦)',
        subtitle: 'Zero hidden fees with escrow buyer protection',
        description: 'Pay safely using your Naira wallet, Paystack debit card, or bank transfer.',
        icon: 'las la-shield-alt',
      },
      {
        id: 3,
        title: 'Real-time Tracking & Live Chat',
        subtitle: 'Direct messaging and milestone updates',
        description: 'Track orders step-by-step and chat with artisans right from your phone.',
        icon: 'las la-clock',
      },
    ]
  );
}

export async function updateOnboardingSlides(slides: any[]): Promise<any[]> {
  const data = readDataFile();
  data.onboarding_slides = slides;
  writeDataFile(data);

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('onboarding_slides').deleteMany({});
      if (slides.length > 0) {
        await db.collection('onboarding_slides').insertMany(slides);
      }
    } catch (e) {}
  }

  return slides;
}
