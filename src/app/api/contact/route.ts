import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { category, name, email, message } = await req.json();

    if (!email || !message || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const subject =
      category === "feature"
        ? "Feature Suggestion — LocalLens"
        : "General Inquiry — LocalLens";

    // ✅ Polished HTML email template
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; padding: 32px;">
        <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background-color: #0284c7; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">LocalLens</h1>
              <p style="color: #e0f2fe; margin: 4px 0 0;">${subject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <p style="font-size: 16px; color: #0f172a; margin-bottom: 16px;">
                You’ve received a new message through the <strong>LocalLens Contact Form</strong>.
              </p>

              <table style="width: 100%; font-size: 15px; color: #1e293b; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; width: 120px; font-weight: 600;">Name:</td>
                  <td>${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600;">Email:</td>
                  <td><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600;">Category:</td>
                  <td style="text-transform: capitalize;">${category}</td>
                </tr>
              </table>

              <div style="border-top: 1px solid #e2e8f0; margin: 16px 0;"></div>

              <p style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">Message:</p>
              <p style="white-space: pre-line; color: #334155; line-height: 1.6;">${message}</p>

              <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p style="font-size: 13px; color: #94a3b8; text-align: center;">
                  © ${new Date().getFullYear()} LocalLens — Know what's stored. Take control.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const fromName = `LocalLens Contact — ${name}`;
    const fromAddress = `${fromName} <contact@locallens.local>`;

    await resend.emails.send({
      from: fromAddress,
      to: "locallens.contact@gmail.com",
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
