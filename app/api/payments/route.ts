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

    let query = db.payments().select(
      `
        *,
        reservations!inner(
          reservation_id,
          user_id,
          start_time,
          end_time,
          users!inner(first_name, last_name, email),
          parking_spaces!inner(establishment_name, city)
        )
      `,
      { count: 'exact' }
    );

    // Apply filters based on user role
    if (authResult.role === UserRole.DRIVER) {
      query = query.eq('reservations.user_id', authResult.user_id);
    } else if (authResult.role === 'admin' && userId) {
      query = query.eq('reservations.user_id', Number.parseInt(userId));
    }

    if (status) {
      query = query.eq('payment_status', status);
    }

    const {
      data: payments,
      error,
      count,
    } = await query
      .range(offset, offset + limit - 1)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Payments fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Payments fetched successfully',
      data: payments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Payments API error:', error);
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
    const { reservation_id, payment_method } = await request.json();

    if (!reservation_id || !payment_method) {
      return NextResponse.json(
        { error: 'Reservation ID and payment method are required' },
        { status: 400 }
      );
    }

    // Get reservation details
    const { data: reservation, error: reservationError } = await db
      .reservations()
      .select('*')
      .eq('reservation_id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if user owns the reservation
    if (reservation.user_id !== authResult.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if reservation is in correct status
    if (reservation.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Reservation must be confirmed before payment' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${reservation_id}`;

    // Create payment record
    const { data: newPayment, error } = await db
      .payments()
      .insert({
        reservation_id,
        payment_method,
        amount: reservation.total_price,
        payment_status: 'completed',
        receipt_number: receiptNumber,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Payment creation error:', error);
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    // Update reservation status to paid
    await db
      .reservations()
      .update({ status: 'paid' })
      .eq('reservation_id', reservation_id);

    return NextResponse.json({
      message: 'Payment processed successfully',
      data: newPayment,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
