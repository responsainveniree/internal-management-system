import {
  UserCreateSchema,
  UserRequestEmailOtpSchema,
  UserRequestResetPasswordSchema,
  UserUpdateSchema,
  UserVerifyEmailSchema,
  UserVerifyResetPasswordSchema,
} from "@/shared/lib/zods/user.zod";
import { Prisma, PrismaClient, Role } from "@prisma/client";
import { createUserSelect, userRepository } from "./user.repository";
import { badRequest } from "@/shared/lib/error-handlers";
import bcrypt from "bcryptjs";
import { emailVerificationRepository } from "../email-verification/email-verification.repository";
import { Resend } from "resend";
import EmailOtpTemplate from "@/shared/emails/EmailOtp";
import { Session } from "next-auth";
import { resetPasswordVerificationRepository } from "../reset-password-verification/reset-password-verification.reopsitory";
import { ResetPasswordOtpTemplate } from "@/shared/emails/ResetPasswordOtp";
import {
  assertCanCreateUser,
  assertCanRequestEmailOtp,
  assertCanRequestResetPasswordOtp,
  assertCanResetPassword,
  assertCanVerifyEmail,
} from "./user.rule";
import crypto from "crypto";

export const userService = {
  create: async (
    session: Session["user"] | null,
    data: UserCreateSchema,
    prisma: Prisma.TransactionClient | PrismaClient,
  ) => {
    const userSelect = createUserSelect({
      id: true,
      emailVerified: true,
    });

    const findUser = await userRepository.findUserByEmail(
      data.email,
      userSelect,
      prisma,
    );

    assertCanCreateUser(findUser);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const otpCode = crypto.randomInt(100000, 999999).toString();

    const hashedOtpCode = await bcrypt.hash(otpCode, 10);

    const transaction = await prisma.$transaction(async (tx) => {
      const createdUser = await userRepository.create(
        {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: data.creationType === "STAFF" ? (data.role as Role) : "GUEST",
          emailVerified: data.creationType === "STAFF" ? new Date() : null,
        },
        tx,
      );

      const emailVerificationExpiersDate = new Date();
      emailVerificationExpiersDate.setMinutes(
        emailVerificationExpiersDate.getMinutes() + 15,
      );

      const createdEmailVerification = await emailVerificationRepository.create(
        {
          code: hashedOtpCode,
          expiresAt: emailVerificationExpiersDate,
          user: {
            connect: {
              id: createdUser.id,
            },
          },
          requestNewOtpCounter: 1,
          lastRequestNewOtp: new Date(),
        },
        tx,
      );

      return {
        user: createdUser,
        emailVerificationId: createdEmailVerification.id,
      };
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (data.creationType === "GUEST") {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: data.email,
        subject: `Verify your BIZ Hotel account (Expires in 15 mins)`,
        react: EmailOtpTemplate({
          expirationMinutes: 15,
          hotelName: "BIZ Hotel",
          otpCode: otpCode,
          userName: data.name,
          supportEmail: "www.bizhotelbatam.com",
          verificationUrl:
            process.env.NEXT_PUBLIC_BASE_URL +
            "/users/verify/" +
            transaction.emailVerificationId,
        }),
      });
    }

    return {
      message:
        "Account created successfully. Next step is to verify your account. Check your email, please!",
      userId: transaction.user.id,
      emailVerificationId: transaction.emailVerificationId,
    };
  },

  update: async (
    session: Session["user"],
    data: UserUpdateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const updatedUser = await userRepository.update(
      session.id,
      {
        name: data.name,
      },
      prisma,
    );

    return {
      message: "User updated successfully",
      userId: updatedUser.id,
    };
  },

  requestEmailOtp: async (
    data: UserRequestEmailOtpSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const user = await userRepository.findUserByEmail(
      data.email,
      {
        id: true,
        name: true,
        EmailOtpVerification: true,
        emailVerified: true,
      },
      prisma,
    );

    if (!user) {
      return {
        message:
          "An email OTP verification sended successfully. Check your email.",
      };
    }

    const emailOtpLastRequest = user.EmailOtpVerification
      ? user.EmailOtpVerification?.lastRequestNewOtp
        ? new Date(user.EmailOtpVerification.lastRequestNewOtp)
        : null
      : null;

    emailOtpLastRequest?.setHours(emailOtpLastRequest.getHours() + 12);

    const now = new Date();

    assertCanRequestEmailOtp(
      user,
      emailOtpLastRequest,
      now,
      user.EmailOtpVerification?.requestNewOtpCounter,
    );

    const otpCode = crypto.randomInt(100000, 999999).toString();

    const hashedOtpCode = await bcrypt.hash(otpCode, 10);

    const otpcodeExpiresAt = new Date();
    otpcodeExpiresAt.setMinutes(otpcodeExpiresAt.getMinutes() + 15);

    const resend = new Resend();

    let emailVerificationOtp;

    if (!user.EmailOtpVerification) {
      emailVerificationOtp = await emailVerificationRepository.create(
        {
          code: hashedOtpCode,
          expiresAt: otpcodeExpiresAt,
          user: {
            connect: {
              id: user.id,
            },
          },
          inputOtpCounter: 0,
          requestNewOtpCounter: 1,
        },
        prisma,
      );

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: data.email,
        subject: `Verify your BIZ Hotel account (Expires in 15 mins)`,
        react: EmailOtpTemplate({
          expirationMinutes: 15,
          hotelName: "BIZ Hotel",
          otpCode: otpCode,
          userName: user.name,
          supportEmail: "www.bizhotelbatam.com",
          verificationUrl:
            process.env.NEXT_PUBLIC_BASE_URL +
            "/users/verify/" +
            emailVerificationOtp.id,
        }),
      });

      return {
        message:
          "An email OTP verification sended successfully. Check your email.",
      };
    }

    // if requestOtpCounter === 3 then current requestNewOtp Counter will be 0
    if (
      user.EmailOtpVerification &&
      user.EmailOtpVerification.id &&
      user.EmailOtpVerification.requestNewOtpCounter === 3
    ) {
      emailVerificationOtp = await emailVerificationRepository.updateById(
        {
          where: {
            id: user.EmailOtpVerification.id,
          },
          data: {
            code: hashedOtpCode,
            requestNewOtpCounter: 0,
            expiresAt: otpcodeExpiresAt,
            inputOtpCounter: 0,
            lastRequestNewOtp: new Date(),
          },
        },
        prisma,
      );
    }

    //emailOtpLastRequest < now
    // if requestOtpCounter < 3 then increment the current requestNewOtp Counter
    if (
      user.EmailOtpVerification &&
      user.EmailOtpVerification.id &&
      user.EmailOtpVerification.requestNewOtpCounter < 3
    ) {
      emailVerificationOtp = await emailVerificationRepository.updateById(
        {
          where: {
            id: user.EmailOtpVerification.id,
          },
          data: {
            code: hashedOtpCode,
            ...(emailOtpLastRequest && emailOtpLastRequest > now
              ? {
                  requestNewOtpCounter: { increment: 1 },
                }
              : {
                  requestNewOtpCounter: 1,
                }),
            expiresAt: otpcodeExpiresAt,
            lastRequestNewOtp: new Date(),
          },
        },
        prisma,
      );
    }

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: data.email,
      subject: `Verify your BIZ Hotel account (Expires in 15 mins)`,
      react: EmailOtpTemplate({
        expirationMinutes: 15,
        hotelName: "BIZ Hotel",
        otpCode: otpCode,
        userName: user.name,
        supportEmail: "www.bizhotelbatam.com",
        verificationUrl:
          process.env.NEXT_PUBLIC_BASE_URL +
          "/users/email-otps/" +
          user.EmailOtpVerification.id,
      }),
    });

    return {
      message:
        "An email OTP verification sended successfully. Check your email.",
    };
  },

  verifyEmail: async (
    verificationId: string,
    data: UserVerifyEmailSchema,
    prisma: Prisma.TransactionClient | PrismaClient,
  ) => {
    const userSelect = createUserSelect({
      id: true,
      emailVerified: true,
      EmailOtpVerification: true,
    });

    const user = await userRepository.findUserByEmail(
      data.email,
      userSelect,
      prisma,
    );

    const emailOtpVerification = await emailVerificationRepository.findById(
      verificationId,
      {
        id: true,
        code: true,
        expiresAt: true,
        lastInputOtp: true,
        inputOtpCounter: true,
        userId: true,
      },
      prisma,
    );

    const now = new Date();

    assertCanVerifyEmail(user, emailOtpVerification, now);

    const resetPeriodic = emailOtpVerification?.lastInputOtp
      ? new Date(emailOtpVerification.lastInputOtp as Date)
      : null;

    emailOtpVerification?.lastInputOtp
      ? resetPeriodic!.setMinutes(resetPeriodic!.getMinutes() + 10)
      : null;

    const isOtpExact = await bcrypt.compare(
      data.otpCode,
      user!.EmailOtpVerification!.code,
    );

    if (isOtpExact) {
      await prisma.$transaction(async (tx) => {
        await userRepository.update(
          user!.id,
          {
            emailVerified: new Date(),
          },
          tx,
        );

        await emailVerificationRepository.deleteById(
          user.EmailOtpVerification!.id,
          tx,
        );
      });

      return {
        message: "Email verified successfully",
        success: true,
        userId: emailOtpVerification!.userId,
      };
    } else if (
      ((resetPeriodic && now > resetPeriodic) || !resetPeriodic) &&
      emailOtpVerification!.inputOtpCounter === 3
    ) {
      const updatedEmailVerification =
        await emailVerificationRepository.updateById(
          {
            where: {
              id: emailOtpVerification?.id,
            },
            data: {
              inputOtpCounter: 1,
            },
          },
          prisma,
        );

      throw badRequest(
        `The OTP code is correct. Remaining attempts: ${3 - updatedEmailVerification.inputOtpCounter}`,
      );
    } else {
      const updatedEmailVerification =
        await emailVerificationRepository.updateById(
          {
            where: {
              id: emailOtpVerification?.id,
            },
            data: {
              inputOtpCounter: 1,
            },
          },
          prisma,
        );

      throw badRequest(
        `The OTP code is correct. Remaining attempts: ${3 - updatedEmailVerification.inputOtpCounter}`,
      );
    }
  },

  requestResetPasswordOtp: async (
    data: UserRequestResetPasswordSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const user = await userRepository.findUserByEmail(
      data.email,
      {
        id: true,
        name: true,
        resetPasswordOtpVerification: true,
        emailVerified: true,
        lastPasswordChangedAt: true,
      },
      prisma,
    );

    if (!user) {
      return {
        message:
          "If this email exists, we will send the OTP. Please check your email.",
      };
    }

    assertCanRequestResetPasswordOtp(user);

    const otpCode = crypto.randomInt(100000, 999999).toString();

    const hashedOtpCode = await bcrypt.hash(otpCode, 10);

    const otpcodeExpiresAt = new Date();
    otpcodeExpiresAt.setMinutes(otpcodeExpiresAt.getMinutes() + 15);

    const resend = new Resend(process.env.RESEND_API_KEY);

    const transaction = await prisma.$transaction(async (tx) => {
      let resetPasswordOtpVerification;

      // if reset password otp === null (No record), then create a new otp
      if (!user.resetPasswordOtpVerification?.id) {
        resetPasswordOtpVerification =
          await resetPasswordVerificationRepository.create(
            {
              code: hashedOtpCode,
              expiresAt: otpcodeExpiresAt,
              user: {
                connect: {
                  id: user!.id,
                },
              },
            },
            tx,
          );
      }

      // if request otp counter === 3, then requestOtpCounter will be reset to 1
      if (
        user.resetPasswordOtpVerification?.requestNewOtpCounter &&
        user.resetPasswordOtpVerification.requestNewOtpCounter === 3
      ) {
        resetPasswordOtpVerification =
          await resetPasswordVerificationRepository.update(
            user!.resetPasswordOtpVerification!.id,
            {
              code: hashedOtpCode,
              expiresAt: otpcodeExpiresAt,
              requestNewOtpCounter: 1,
            },
            tx,
          );
      }

      // request otp counter < 3, then increment its value by 1
      resetPasswordOtpVerification =
        await resetPasswordVerificationRepository.update(
          user!.resetPasswordOtpVerification!.id,
          {
            code: hashedOtpCode,
            expiresAt: otpcodeExpiresAt,
            requestNewOtpCounter: {
              increment: 1,
            },
          },
          tx,
        );

      return {
        resetPasswordOtpVerification,
      };
    });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: data.email,
      subject: `Changing Password Request on Your BIZ Hotel Account (Expires in 15 mins)`,
      react: ResetPasswordOtpTemplate({
        expirationMinutes: 15,
        hotelName: "BIZ Hotel",
        otpCode: otpCode,
        userName: user!.name,
        supportEmail: "www.bizhotelbatam.com",
        verificationUrl:
          process.env.NEXT_PUBLIC_BASE_URL +
          "/users/password-otps/" +
          transaction.resetPasswordOtpVerification!.id,
      }),
    });

    return {
      message:
        "If this email is existed we will send the OTP. Check you email, please.",
    };
  },

  resetPassword: async (
    id: string,
    data: UserVerifyResetPasswordSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const resetPasswordOtpVerification =
      await resetPasswordVerificationRepository.findById(
        id,
        { code: true, user: true, expiresAt: true, inputOtpCounter: true },
        prisma,
      );

    const resetPasswordPeriodic = resetPasswordOtpVerification!.lastInputOtp
      ? new Date(resetPasswordOtpVerification!.lastInputOtp)
      : null;
    resetPasswordOtpVerification!.lastInputOtp
      ? resetPasswordPeriodic?.setMinutes(
          resetPasswordPeriodic.getMinutes() + 10,
        )
      : null;

    const now = new Date();

    assertCanResetPassword(
      resetPasswordOtpVerification,
      data,
      resetPasswordPeriodic,
      now,
    );

    const isOtpExact = await bcrypt.compare(
      data.otpCode,
      resetPasswordOtpVerification.code,
    );

    const transaction = await prisma.$transaction(async (tx) => {
      if (isOtpExact) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await userRepository.update(
          resetPasswordOtpVerification.user.id,
          {
            password: hashedPassword,
            lastPasswordChangedAt: new Date(),
          },
          tx,
        );

        await resetPasswordVerificationRepository.delete(id, tx);

        return {
          message: "User password changed successfully",
          userId: resetPasswordOtpVerification.userId,
          success: true,
        };
      } else if (
        resetPasswordOtpVerification.inputOtpCounter === 3 &&
        (!resetPasswordPeriodic || now > resetPasswordPeriodic)
      ) {
        const resePasswordVerification =
          await resetPasswordVerificationRepository.update(
            id,
            {
              inputOtpCounter: 1,
            },
            tx,
          );

        throw badRequest(
          `The OTP code is incorrect. Reamaining attempts: ${3 - resePasswordVerification.inputOtpCounter}`,
        );
      } else {
        const resePasswordVerification =
          await resetPasswordVerificationRepository.update(
            id,
            {
              inputOtpCounter: { increment: 1 },
            },
            tx,
          );

        throw badRequest(
          `The OTP code is incorrect. Reamaining attempts: ${3 - resePasswordVerification.inputOtpCounter}`,
        );
      }
    });

    return {
      message: transaction.message,
      userId: transaction.userId,
      success: transaction.success,
    };
  },
};
