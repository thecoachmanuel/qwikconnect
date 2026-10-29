import { NextRequest, NextResponse } from 'next/server';
import { getServiceBySlug } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);
    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }
    const defaultAdditionals = [
      { id: 1, additional_service_title: 'Express Priority Service Slot (Same-Day Response)', additional_service_price: 5000.0, additional_service_quantity: 1 },
      { id: 2, additional_service_title: 'Extended 30-Day Follow-Up & Maintenance Warranty', additional_service_price: 10000.0, additional_service_quantity: 1 },
    ];
    const resolvedAdditionals = service.additionals && service.additionals.length > 0 ? service.additionals : defaultAdditionals;

    return NextResponse.json({
      service: {
        ...service,
        additionals: resolvedAdditionals,
      },
    });
  } catch (error: any) {
    console.error('Service by slug error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
