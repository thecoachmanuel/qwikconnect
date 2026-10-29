import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUser, getSellerVerification } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const found = await getUserById(userId);
    const verification = await getSellerVerification(userId);

    const userObj: any = found || {
      id: userId,
      name: session.user.name || 'User',
      email: session.user.email || '',
      username: (session.user as any).username || '',
      phone: '+234 800 000 0000',
      address: 'Lagos, Nigeria',
      post_code: null,
      about: null,
      country_id: 1,
      country: 'Nigeria',
      service_city: 'Lagos',
      service_area: 'Victoria Island',
      image: session.user.image || '/assets/frontend/img/static/user_profile.png',
      user_type: (session.user as any).user_type ?? 0,
      user_status: 1,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      user: {
        id: userObj.id,
        name: userObj.name || session.user.name || 'User',
        email: userObj.email || session.user.email || '',
        username: userObj.username || '',
        phone: userObj.phone || '',
        address: userObj.address || '',
        post_code: userObj.post_code || '',
        country_id: userObj.country_id || 1,
        country: userObj.country || 'Nigeria',
        service_city: userObj.service_city || 'Lagos',
        service_area: userObj.service_area || '',
        about: userObj.about || '',
        tax_number: userObj.tax_number || '',
        experience: userObj.experience || '',
        specialities: userObj.specialities || '',
        fb_url: userObj.fb_url || '',
        tw_url: userObj.tw_url || '',
        li_url: userObj.li_url || '',
        in_url: userObj.in_url || '',
        yo_url: userObj.yo_url || '',
        image: userObj.image || session.user.image || '',
        profile_background: userObj.profile_background || '',
        user_type: userObj.user_type ?? 0,
        user_status: userObj.user_status ?? 1,
        is_identity_verified: Boolean(userObj.is_identity_verified || verification?.status === 1),
        verification: verification || null,
        created_at: userObj.created_at || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    const {
      name,
      phone,
      address,
      post_code,
      country,
      country_id,
      service_city,
      service_area,
      about,
      tax_number,
      experience,
      specialities,
      fb_url,
      tw_url,
      li_url,
      in_url,
      yo_url,
      image,
      profile_background,
    } = body;

    const existing = await getUserById(userId);
    const resolvedName = name !== undefined ? name.trim() : (existing?.name || session.user.name || 'User');
    if (!resolvedName) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const updateFields: any = {
      name: resolvedName,
      phone: phone !== undefined ? phone : null,
      address: address !== undefined ? address : null,
      post_code: post_code !== undefined ? post_code : null,
      country: country !== undefined ? country : 'Nigeria',
      country_id: country_id !== undefined ? Number(country_id) : 1,
      service_city: service_city !== undefined ? service_city : 'Lagos',
      service_area: service_area !== undefined ? service_area : null,
      about: about !== undefined ? about : null,
      tax_number: tax_number !== undefined ? tax_number : null,
      experience: experience !== undefined ? experience : null,
      specialities: specialities !== undefined ? specialities : null,
      fb_url: fb_url !== undefined ? fb_url : null,
      tw_url: tw_url !== undefined ? tw_url : null,
      li_url: li_url !== undefined ? li_url : null,
      in_url: in_url !== undefined ? in_url : null,
      yo_url: yo_url !== undefined ? yo_url : null,
    };

    if (image) updateFields.image = image;
    if (profile_background) updateFields.profile_background = profile_background;

    const updated = await updateUser(userId, updateFields);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
