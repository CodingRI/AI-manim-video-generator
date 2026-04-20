import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/otpHandler/generateOtp";
import { setOTP } from "@/lib/otpHandler/otp";
import { sendOTPEmail } from "@/lib/otpHandler/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const otp = generateOTP();

  await setOTP(email, otp);
  await sendOTPEmail(email, otp);

  return NextResponse.json({ success: true });
}