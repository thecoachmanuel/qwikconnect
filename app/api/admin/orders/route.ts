import { NextRequest, NextResponse } from 'next/server';
import { getOrders, getMongoDb } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    const orderId = Number(id);

    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('orders').deleteOne({ id: orderId });
      } catch (e) {}
    }

    // Remove from local JSON file
    const dataFilePath = path.join(process.cwd(), '.data', 'qixer-mongo.json');
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(raw);
      data.orders = (data.orders || []).filter((o: any) => Number(o.id) !== orderId);
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Admin order DELETE error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
