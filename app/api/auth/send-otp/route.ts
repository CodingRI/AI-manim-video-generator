import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/otpHandler/generateOtp";
import { setOTP } from "@/lib/otpHandler/otp";
import { sendOTPEmail } from "@/lib/otpHandler/email";
import { canSendOTP, setSignupData } from "@/lib/otpHandler/otp";

export async function POST(req: Request) {
  const { email, name, password} = await req.json();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  
    if (!emailRegex.test(email)) {
    return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
    );
    }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const otp = generateOTP();

  await setSignupData(email, { name, password });
  await setOTP(email, otp);
  await sendOTPEmail(email, otp);

  if (!(await canSendOTP(email))) {
    return NextResponse.json(
      { error: "Please wait before requesting another OTP" },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true });
}