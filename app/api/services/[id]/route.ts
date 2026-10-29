import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceById, updateService, deleteService, getCategories } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getServiceById(id);
    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (error: any) {
    console.error('Service GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();

    const existingService = await getServiceById(id);
    if (!existingService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    // Prepare update payload
    const updatePayload: any = {};
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.price !== undefined) updatePayload.price = Number(body.price);
    if (body.delivery_days !== undefined) updatePayload.delivery_days = Number(body.delivery_days);
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.image !== undefined) updatePayload.image = body.image;
    if (body.status !== undefined) updatePayload.status = Number(body.status);
    if (body.is_service_on !== undefined) updatePayload.is_service_on = Number(body.is_service_on);
    if (body.includes !== undefined) updatePayload.includes = body.includes;
    if (body.benefits !== undefined) updatePayload.benefits = body.benefits;
    if (body.additionals !== undefined) updatePayload.additionals = body.additionals;

    if (body.category_id !== undefined) {
      updatePayload.category_id = Number(body.category_id);
      const categories = await getCategories();
      const cat = categories.find((c: any) => c.id === updatePayload.category_id);
      if (cat) {
        updatePayload.category_slug = cat.slug;
      }
    }

    const updated = await updateService(Number(id), updatePayload);
    return NextResponse.json({ message: 'Service updated successfully', service: updated });
  } catch (error: any) {
    console.error('Service PATCH error:', error);
    return NextResponse.json({ message: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteService(Number(id));
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ message: 'Failed to delete service' }, { status: 500 });
  }
}
