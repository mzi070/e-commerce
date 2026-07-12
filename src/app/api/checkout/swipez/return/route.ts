import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/swipe";

export const runtime = "nodejs";

/** Swipez POSTs payment result to return_url — redirect to success page. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const referenceNo = String(form.get("reference_no") ?? "");
  const status = String(form.get("status") ?? "");

  const redirectUrl = new URL("/checkout/success", siteUrl());
  if (referenceNo) {
    redirectUrl.searchParams.set("reference_no", referenceNo);
  }
  if (status) {
    redirectUrl.searchParams.set("status", status);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const referenceNo = request.nextUrl.searchParams.get("reference_no") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";

  const redirectUrl = new URL("/checkout/success", siteUrl());
  if (referenceNo) {
    redirectUrl.searchParams.set("reference_no", referenceNo);
  }
  if (status) {
    redirectUrl.searchParams.set("status", status);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
