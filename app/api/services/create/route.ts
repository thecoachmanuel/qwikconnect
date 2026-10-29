import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getMongoDb, getCategories, getUserById } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const createServiceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category_id: z.coerce.number().int(),
  seller_id: z.coerce.number().int().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  delivery_days: z.coerce.number().int().min(1).default(3),
  image: z.string().optional(),
  includes: z.array(z.string()).min(1, 'At least one included feature is required'),
  benefits: z.array(z.string()).optional(),
  additionals: z.array(z.object({
    title: z.string(),
    price: z.coerce.number(),
  })).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = createServiceSchema.parse(body);
    const sellerId = data.seller_id || (session?.user?.id ? parseInt(session.user.id, 10) : 2);
    const sellerUser = await getUserById(sellerId);

    const baseSlug = slugify(data.title);
    const finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const serviceId = Date.now();

    // Find category info
    const categories = await getCategories();
    const cat = categories.find((c: any) => c.id === data.category_id);

    const newServiceObj = {
      id: serviceId,
      title: data.title,
      slug: finalSlug,
      category_id: data.category_id,
      category_slug: cat?.slug || 'general-services',
      seller_id: sellerId,
      seller_image: sellerUser?.image || null,
      seller: sellerUser
        ? {
            id: sellerUser.id,
            name: sellerUser.name,
            username: sellerUser.username,
            image: sellerUser.image || null,
          }
        : null,
      description: data.description,
      price: data.price,
      delivery_days: data.delivery_days,
      image: data.image || '/assets/uploads/media-uploader/banner11638279446.png',
      city: sellerUser?.service_city || sellerUser?.city || 'Lagos',
      country: sellerUser?.country || 'Nigeria',
      status: 1,
      includes: data.includes || [],
      benefits: data.benefits || [],
      additionals: data.additionals?.map((a: any, idx: number) => ({
        id: idx + 1,
        additional_service_title: a.title,
        additional_service_price: a.price,
        additional_service_image: null,
      })) || [],
      created_at: new Date().toISOString(),
    };

    // Save to MongoDB
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('services').insertOne(newServiceObj);
      } catch (e) {}
    }

    // Save to local backup store
    try {
      const dataFile = path.join(process.cwd(), '.data', 'qixer-mongo.json');
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.services.unshift(newServiceObj);
        fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    } catch (e) {}

    // Also attempt Prisma
    try {
      await prisma.service.create({
        data: {
          title: data.title,
          slug: finalSlug,
          category_id: BigInt(data.category_id),
          seller_id: BigInt(sellerId),
          description: data.description,
          price: data.price,
          delivery_days: BigInt(data.delivery_days),
          image: data.image || '/assets/uploads/media-uploader/banner11638279446.png',
          status: 1,
          is_service_on: 1,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma service create fallback:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Service published successfully!',
      serviceId: String(serviceId),
      slug: finalSlug,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create service.' },
      { status: 500 }
    );
  }
}
