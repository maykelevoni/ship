// Auth middleware disabled for local testing — re-enable for production
import { NextResponse } from "next/server"
export function middleware() { return NextResponse.next() }
export const config = { matcher: [] }