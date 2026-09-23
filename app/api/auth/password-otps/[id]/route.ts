import { userService } from "@/features/users/user.service";
import { UserVerifyPasswordApiResponse } from "@/features/users/user.types";
import prisma from "@/shared/db/prisma";
import { badRequest } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { executeRatelimit } from "@/shared/lib/rate-limiter";
import { userVerifyResetPasswordSchema } from "@/shared/lib/zods/user.zod";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await executeRatelimit(req);

    const { id } = await params;

    if (!id) throw badRequest("id is missing");

    const body = await req.json();
    const data = userVerifyResetPasswordSchema.parse(body);

    const result = await userService.resetPassword(id, data, prisma);

    const response: UserVerifyPasswordApiResponse = {
      data: {
        success: result.success,
        userId: result.userId,
      },
      message: result.message,
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "POST", req.url);
    return handleError(error);
  }
}
