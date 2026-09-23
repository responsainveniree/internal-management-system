import { userService } from "@/features/users/user.service";
import { UserRequestPasswordOtpApiResponse } from "@/features/users/user.types";
import prisma from "@/shared/db/prisma";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { executeRatelimit } from "@/shared/lib/rate-limiter";
import { userRequestResetPasswordSchema } from "@/shared/lib/zods/user.zod";

export async function POST(req: Request) {
  try {
    await executeRatelimit(req);

    const body = await req.json();
    const data = userRequestResetPasswordSchema.parse(body);

    const result = await userService.requestResetPasswordOtp(data, prisma);

    const response: UserRequestPasswordOtpApiResponse = {
      data: null,
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
