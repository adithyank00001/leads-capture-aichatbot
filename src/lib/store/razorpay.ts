import "server-only";

import Razorpay from "razorpay";

import { serverEnv } from "@/lib/env.server";

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient() {
  if (!serverEnv.razorpayKeyId || !serverEnv.razorpayKeySecret) {
    throw new Error("Razorpay is not configured.");
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: serverEnv.razorpayKeyId,
      key_secret: serverEnv.razorpayKeySecret,
    });
  }

  return razorpayClient;
}

export function getRazorpayKeyId() {
  if (!serverEnv.razorpayKeyId) {
    throw new Error("RAZORPAY_KEY_ID is not configured.");
  }
  return serverEnv.razorpayKeyId;
}

export function getRazorpayKeySecret() {
  if (!serverEnv.razorpayKeySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }
  return serverEnv.razorpayKeySecret;
}
