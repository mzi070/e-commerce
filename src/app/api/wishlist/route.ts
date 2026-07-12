import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/queries/products";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50);

  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
