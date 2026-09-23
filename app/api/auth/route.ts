import { userService } from "@/features/users/user.service";
import {
  UserGuestCreateApiResponse,
  UserStaffCreateApiResponse,
} from "@/features/users/user.types";
import prisma from "@/shared/db/prisma";
import { forbidden, unauthorized } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { executeRatelimit } from "@/shared/lib/rate-limiter";
import { canCreateStaffAccount } from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import { userCreateSchema } from "@/shared/lib/zods/user.zod";

export async function POST(req: Request) {
  try {
    await executeRatelimit(req);

    let user = null;

    try {
      user = await sessionValidation();
    } catch (error) {}

    const body = await req.json();
    const data = userCreateSchema.parse(body);

    if (data.creationType === "STAFF") {
      if (user) {
        if (!canCreateStaffAccount(user?.role)) {
          throw forbidden("You're not allowed to craete ");
        }
      } else {
        throw unauthorized("You're not authorized");
      }
    }

    let response: UserGuestCreateApiResponse | UserStaffCreateApiResponse;

    const result = await userService.create(user, data, prisma);

    response = {
      message: result.message,
      data: {
        userId: result.userId,
        emailVerificationId: result.emailVerificationId,
      },
      status: 201,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    printConsoleError(error, "POST", req.url);
    return handleError(error);
  }
}
