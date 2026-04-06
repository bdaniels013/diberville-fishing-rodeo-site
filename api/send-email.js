const nodemailer = require("nodemailer");

const recipientEmail = process.env.FORMS_TO_EMAIL || "dvillefishingrodeo@yahoo.com";

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatTextRows = (fields) => {
  const labelWidth = Math.min(
    28,
    Math.max(...fields.map((field) => field.label.length), 0)
  );

  return fields.map((field) => {
    const label = `${field.label}:`.padEnd(labelWidth + 2, " ");
    return `${label}${field.value || "N/A"}`;
  });
};

const getTransport = () => {
  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return response.status(500).json({
      error: "Email is not configured. Add SMTP_USER and SMTP_PASS in Vercel.",
    });
  }

  try {
    const body = parseBody(request.body);
    const fields = Array.isArray(body.fields) ? body.fields : [];
    const formName = body.formName || "D'Iberville Fishing Rodeo Form Submission";
    const subject = body.subject || formName;
    const replyTo = fields.find((field) => field.name === "email")?.value;
    const submittedAt = new Date();

    if (!fields.length) {
      return response.status(400).json({ error: "No form fields were submitted." });
    }

    const textLines = [
      "D'Iberville Fishing Rodeo",
      formName,
      "=".repeat(Math.max(formName.length, 28)),
      "",
      "Submission Details",
      "------------------",
      ...formatTextRows(fields),
      "",
      `Submitted from: ${body.pageUrl || "Website"}`,
      `Submitted at: ${submittedAt.toLocaleString("en-US", { timeZone: "America/Chicago" })} CT`,
    ];

    const htmlRows = fields
      .map(
        (field) => `
          <tr>
            <th align="left" valign="top" style="width: 34%; padding: 12px 14px; border-bottom: 1px solid #d8e5e8; background: #f4fbfc; color: #12364a; font-size: 14px;">${escapeHtml(field.label)}</th>
            <td valign="top" style="padding: 12px 14px; border-bottom: 1px solid #d8e5e8; color: #173041; font-size: 15px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(field.value || "N/A")}</td>
          </tr>
        `
      )
      .join("");

    await getTransport().sendMail({
      from: `"D'Iberville Fishing Rodeo" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipientEmail,
      replyTo: replyTo || process.env.FROM_EMAIL || process.env.SMTP_USER,
      subject,
      text: textLines.join("\n"),
      html: `
        <div style="margin: 0; padding: 24px; background: #eef8fa; font-family: Arial, sans-serif; color: #12364a;">
          <div style="max-width: 760px; margin: 0 auto; overflow: hidden; border: 1px solid #cfe4e8; border-radius: 18px; background: #ffffff;">
            <div style="padding: 22px 24px; background: linear-gradient(135deg, #063044, #0d6e86); color: #f7f1dd;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">D'Iberville Fishing Rodeo</p>
              <h1 style="margin: 0; font-size: 26px; line-height: 1.15;">${escapeHtml(formName)}</h1>
            </div>
            <div style="padding: 22px 24px;">
              <h2 style="margin: 0 0 14px; color: #12364a; font-size: 18px;">Submission Details</h2>
              <table cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; border: 1px solid #d8e5e8; border-radius: 12px; overflow: hidden;">
                ${htmlRows}
              </table>
              <div style="margin-top: 18px; padding: 14px 16px; border-radius: 12px; background: #f4fbfc; color: #557486; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0;"><strong>Submitted from:</strong> ${escapeHtml(body.pageUrl || "Website")}</p>
                <p style="margin: 4px 0 0;"><strong>Submitted at:</strong> ${escapeHtml(submittedAt.toLocaleString("en-US", { timeZone: "America/Chicago" }))} CT</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Unable to send email right now." });
  }
};
