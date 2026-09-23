import { userService } from "@/features/users/user.service";
import { UserVerifyEmailApiResponse } from "@/features/users/user.types";
import prisma from "@/shared/db/prisma";
import { badRequest } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { executeRatelimit } from "@/shared/lib/rate-limiter";
import { userVerifyEmailSchema } from "@/shared/lib/zods/user.zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await executeRatelimit(req);

    const { id } = await params;

    if (!id) throw badRequest("Id is missing");

    const body = await req.json();
    const data = userVerifyEmailSchema.parse(body);

    const result = await userService.verifyEmail(id, data, prisma);

    const response: UserVerifyEmailApiResponse = {
      data: {
        success: result.success,
        userId: result.userId,
      },
      message: result.message,
      status: 201,
    };

    return Response.json(response, {
      status: 201,
    });
  } catch (error) {
    printConsoleError(error, "POST", req.url);
    return handleError(error);
  }
}
