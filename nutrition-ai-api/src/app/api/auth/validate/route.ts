import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Simple password validation (in production, use proper authentication)
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    if (password === validPassword) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        data: {
          authenticated: true,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}