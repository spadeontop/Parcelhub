import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import {
  AdminOcrConfigAction,
  AdminOcrConfigRes,
  AdminOcrConfigTarget,
} from "@/app/types/api";

interface RouteParams {
  params: Promise<{ target: string; action: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { target, action } = await params;

  if (target !== "staff" && target !== "customer") {
    return jsonError("Target must be either 'staff' or 'customer'", 400);
  }

  if (action !== "enable" && action !== "disable") {
    return jsonError("Action must be either 'enable' or 'disable'", 400);
  }

  await db.setOcrConfig(target as AdminOcrConfigTarget, action as AdminOcrConfigAction);

  const response: AdminOcrConfigRes = {
    statusMessage: "OCR verification setting updated successfully",
  };

  return jsonSuccess(response);
}
