import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { UserRole } from '@/lib/enums/roles.enum';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

    const offset = (page - 1) * limit;

    let query = db.reservations().select(
      `
        *,
        users!inner(first_name, last_name, email),
        parking_spaces!inner(establishment_name, city, address),
        vehicles!inner(vehicle_type, year_make_model, plate_number)
      `,
      { count: 'exact' }
    );

    // Apply filters based on user role
    if (authResult.role === UserRole.DRIVER) {
      query = query.eq('user_id', authResult.user_id);
    } else if (authResult.role === 'establishment') {
      // Establishment users can see reservations for their parking spaces
      // This would require a junction table or additional logic
      query = query.eq('user_id', authResult.user_id);
    } else if (authResult.role === 'admin' && userId) {
      query = query.eq('user_id', Number.parseInt(userId));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const {
      data: reservations,
      error,
      count,
    } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reservations fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Reservations fetched successfully',
      data: reservations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Reservations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()(request);
  if (authResult instanceof Response) return authResult;

  try {
    const {
      parking_space_id,
      vehicle_id,
      start_time,
      end_time,
      reservation_type,
      discount = 0,
      discount_note,
    } = await request.json();

    if (
      !parking_space_id ||
      !vehicle_id ||
      !start_time ||
      !end_time ||
      !reservation_type
    ) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate that the vehicle belongs to the user
    const { data: vehicle, error: vehicleError } = await db
      .vehicles()
      .select('user_id')
      .eq('vehicle_id', vehicle_id)
      .single();

    if (vehicleError || !vehicle || vehicle.user_id !== authResult.user_id) {
      return NextResponse.json(
        { error: 'Invalid vehicle selection' },
        { status: 400 }
      );
    }

    // Get parking space details for pricing
    const { data: parkingSpace, error: spaceError } = await db
      .parking_spaces()
      .select('*')
      .eq('parking_space_id', parking_space_id)
      .eq('isdeleted', false)
      .single();

    if (spaceError || !parkingSpace) {
      return NextResponse.json(
        { error: 'Parking space not found' },
        { status: 404 }
      );
    }

    // Check availability
    if (
      parkingSpace.available_spaces <= 0 ||
      parkingSpace.availability_status !== 'available'
    ) {
      return NextResponse.json(
        { error: 'Parking space is not available' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const durationHours = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    );

    let totalPrice = 0;
    if (reservation_type === 'hourly') {
      totalPrice = durationHours * parkingSpace.hourly_rate;
    } else if (reservation_type === 'whole_day') {
      const days = Math.ceil(durationHours / 24);
      totalPrice = days * parkingSpace.whole_day_rate;
    }

    // Apply discount
    const discountAmount = (totalPrice * discount) / 100;
    const tax = (totalPrice - discountAmount) * 0.1; // 10% tax
    const finalPrice = totalPrice - discountAmount + tax;

    // Create reservation
    const { data: newReservation, error } = await db
      .reservations()
      .insert({
        user_id: authResult.user_id,
        parking_space_id,
        vehicle_id,
        start_time,
        end_time,
        reservation_type,
        hourly_rate: parkingSpace.hourly_rate,
        whole_day_rate: parkingSpace.whole_day_rate,
        discount: discountAmount,
        tax,
        total_price: finalPrice,
        discount_note,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Reservation creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Update available spaces
    await db
      .parking_spaces()
      .update({ available_spaces: parkingSpace.available_spaces - 1 })
      .eq('parking_space_id', parking_space_id);

    return NextResponse.json({
      message: 'Reservation created successfully',
      data: newReservation,
    });
  } catch (error) {
    console.error('Reservation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
