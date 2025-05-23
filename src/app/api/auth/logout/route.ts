import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // For JWTs stored in client-side storage (e.g., localStorage),
    // the client is responsible for clearing the token.
    // This server endpoint primarily serves as a conventional logout signal
    // and would be where server-side session invalidation or HttpOnly cookie clearing would occur
    // if such mechanisms were in use.

    // No specific server-side action is required for token invalidation with the current setup
    // as JWTs are self-contained and validated on each request.
    // If a denylist or server-side session management were implemented,
    // token invalidation logic would go here.

    return NextResponse.json(
      { message: 'Logout successful. Please clear your token on the client-side.' },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Logout error:', error); // Should not typically occur for this simple endpoint
    return NextResponse.json(
      { message: 'An unexpected error occurred during logout.' },
      { status: 500 } // Internal Server Error
    );
  }
}
