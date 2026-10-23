import { publicState } from "@/lib/wall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(publicState());
}
