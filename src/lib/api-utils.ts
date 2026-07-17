import { NextRequest, NextResponse } from "next/server";

// Custom Error class for predictable API responses
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AppError";
  }
}

// Next.js 15 strictly requires params context to be a Promise
type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

// Async handler wrapper updated for Next.js 15 context types
export const asyncHandler = (handler: RouteHandler) => {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // Kita langsung oper context yang sudah kompatibel dengan Next.js 15
      return await handler(req, context);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      
      console.error("Unhandled API Error:", error);
      return NextResponse.json(
        { success: false, error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
};