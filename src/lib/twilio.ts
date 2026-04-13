import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioClient) {
    console.error("[Twilio] not configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN")
    return { success: false, error: "SMS not configured" }
  }

  if (!fromNumber) {
    return { success: false, error: "Twilio phone number not configured" }
  }

  // Normalize phone number — ensure it has +1 country code
  let normalizedTo = to.replace(/\D/g, "")
  if (normalizedTo.length === 10) normalizedTo = "1" + normalizedTo
  if (!normalizedTo.startsWith("+")) normalizedTo = "+" + normalizedTo

  try {
    const msg = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: normalizedTo,
    })
    console.log("[Twilio] SMS sent:", msg.sid, "to:", normalizedTo)
    return { success: true, sid: msg.sid }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error("[Twilio] SMS error:", errMsg)
    return { success: false, error: errMsg }
  }
}

export function formatAppointmentReminder(
  clientName: string,
  stylistName: string,
  date: string,
  time: string,
  locationName: string
): string {
  return `Hi ${clientName}! Your appointment at Salon Envy ${locationName} is confirmed for ${date} at ${time} with ${stylistName}. Reply STOP to unsubscribe. Questions? Call (361) 889-1102.`
}

export function formatOutreachMessage(
  clientName: string,
  daysSinceVisit: number,
  locationName: string
): string {
  return `Hi ${clientName}! It's been a while since we've seen you at Salon Envy ${locationName}. We'd love to have you back! Book online at salonenvyusa.com or call us. Reply STOP to unsubscribe.`
}
