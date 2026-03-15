export function moreInfoEmailTemplate(data: {
  firstName: string;
  lastName: string;
  schoolName: string;
  notes: string;
  moreInfoFields: string[];
  resubmitUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Action Required: Additional Information Needed - ${data.schoolName}`;

  const fieldLabels: Record<string, string> = {
    affiliationNumber: "Affiliation Number",
    boardType: "Board Type",
    establishedYear: "Established Year",
    website: "School Website",
    phone: "School Phone Number",
    address: "School Address",
    pincode: "Pincode",
    adminEmail: "Administrator Email",
    adminPhone: "Administrator Phone Number",
    documents: "Supporting Documents",
  };

  const fieldListHtml = data.moreInfoFields
    .map(
      (field) => `
      <li style="padding: 8px 0; border-bottom: 1px solid #e8f0fe; font-size: 14px; color: #1e3a5f; font-weight: 500;">
        ${fieldLabels[field] ?? field}
      </li>`,
    )
    .join("");

  const fieldListText = data.moreInfoFields
    .map((field) => `  - ${fieldLabels[field] ?? field}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Action Required - ${data.schoolName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #7a5c00 0%, #c49a00 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #7a5c00; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .fields-box { background: #f0f5ff; border: 1px solid #c7d8f5; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
    .fields-box h3 { font-size: 14px; font-weight: 600; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .fields-box ul { list-style: none; padding: 0; }
    .notes-box { background: #fff8e6; border-left: 4px solid #f5a623; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notes-box h3 { font-size: 14px; font-weight: 600; color: #7a5c00; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .notes-box p { font-size: 14px; color: #7a5c00; line-height: 1.7; }
    .warning-box { background: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #6b1e1e; line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 0 auto 28px; background: linear-gradient(135deg, #7a5c00, #c49a00); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Action Required</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        Thank you for submitting your registration application for <strong>${data.schoolName}</strong>. Our team has reviewed your application and requires additional information before we can proceed.
      </p>

      <div class="fields-box">
        <h3>Information Required</h3>
        <ul>
          ${fieldListHtml}
        </ul>
      </div>

      <div class="notes-box">
        <h3>Reviewer Notes</h3>
        <p>${data.notes}</p>
      </div>

      <div class="warning-box">
        <p>
          <strong>Please note:</strong> Your application will remain on hold until the requested information is provided. Please resubmit your application with the updated details as soon as possible.
        </p>
      </div>

      <a href="${data.resubmitUrl}" class="btn">Update Your Application</a>

      <hr class="divider" />

      <p class="text">
        If you have any questions about what is required, please contact our support team for assistance.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>© ${new Date().getFullYear()} School Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${data.firstName} ${data.lastName},

Thank you for submitting your registration application for ${data.schoolName}.

Our team has reviewed your application and requires the following additional information:

${fieldListText}

Reviewer Notes:
${data.notes}

Please update your application with the requested information as soon as possible.

Update your application here: ${data.resubmitUrl}

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function rejectionEmailTemplate(data: {
  firstName: string;
  lastName: string;
  schoolName: string;
  rejectionReason: string;
  reapplyUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Update on Your School Registration Application - ${data.schoolName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Update - ${data.schoolName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6b1e1e 0%, #9f2d2d 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #6b1e1e; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .reason-box { background: #fff5f5; border: 1px solid #f5c7c7; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
    .reason-box h3 { font-size: 14px; font-weight: 600; color: #6b1e1e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .reason-box p { font-size: 14px; color: #555; line-height: 1.7; }
    .info-box { background: #f0f5ff; border-left: 4px solid #2d6a9f; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .info-box p { font-size: 14px; color: #1e3a5f; line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 0 auto 28px; background: linear-gradient(135deg, #1e3a5f, #2d6a9f); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Update</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        Thank you for your interest in registering <strong>${data.schoolName}</strong> on our platform. After careful review, we are unable to approve your application at this time.
      </p>

      <div class="reason-box">
        <h3>Reason for Rejection</h3>
        <p>${data.rejectionReason}</p>
      </div>

      <div class="info-box">
        <p>
          <strong>Want to try again?</strong> You are welcome to submit a new application after addressing the reason mentioned above. Please ensure all information is accurate and complete before reapplying.
        </p>
      </div>

      <a href="${data.reapplyUrl}" class="btn">Submit a New Application</a>

      <hr class="divider" />

      <p class="text">
        If you believe this decision was made in error or have questions about the rejection, please contact our support team for assistance.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>© ${new Date().getFullYear()} School Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${data.firstName} ${data.lastName},

Thank you for your interest in registering ${data.schoolName} on our platform.

After careful review, we are unable to approve your application at this time.

Reason for Rejection:
${data.rejectionReason}

You are welcome to submit a new application after addressing the reason mentioned above.

Reapply here: ${data.reapplyUrl}

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function welcomeEmailTemplate(data: {
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  schoolName: string;
  schoolCode: string;
  regNumber: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${data.schoolName} - Your Admin Account is Ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${data.schoolName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .credentials-box { background: #f0f5ff; border: 1px solid #c7d8f5; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
    .credentials-box h3 { font-size: 14px; font-weight: 600; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dce8f8; }
    .credential-row:last-child { border-bottom: none; }
    .credential-label { font-size: 13px; color: #888; font-weight: 500; }
    .credential-value { font-size: 14px; color: #1e3a5f; font-weight: 600; font-family: 'Courier New', monospace; }
    .warning-box { background: #fff8e6; border-left: 4px solid #f5a623; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #7a5c00; line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 0 auto 28px; background: linear-gradient(135deg, #1e3a5f, #2d6a9f); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
    .footer a { color: #2d6a9f; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${data.schoolName}</h1>
      <p>School Code: ${data.schoolCode}</p>
    </div>
    <div class="body">
      <p class="greeting">Welcome, ${data.firstName} ${data.lastName}!</p>
      <p class="text">
        Your school has been successfully registered on our platform. Your administrator account has been created and is ready to use. Below are your login credentials — please keep them safe.
      </p>

      <div class="credentials-box">
        <h3>Your Login Credentials</h3>
        <div class="credential-row">
          <span class="credential-label">Registration Number</span>
          <span class="credential-value">${data.regNumber}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Email Address</span>
          <span class="credential-value">${data.email}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${data.tempPassword}</span>
        </div>
      </div>

      <div class="warning-box">
        <p>
          <strong>Important:</strong> This is a temporary password. You will be required to change it immediately upon your first login. Please do not share this email or your credentials with anyone.
        </p>
      </div>

      <a href="${data.loginUrl}" class="btn">Login to Your Account</a>

      <hr class="divider" />

      <p class="text">
        If you have any issues logging in or need assistance setting up your school, please contact our support team and reference your school code <strong>${data.schoolCode}</strong>.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>© ${new Date().getFullYear()} School Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to ${data.schoolName}, ${data.firstName} ${data.lastName}!

Your school has been successfully registered. Here are your login credentials:

Registration Number: ${data.regNumber}
Email: ${data.email}
Temporary Password: ${data.tempPassword}

IMPORTANT: Please change your password immediately after your first login.

Login here: ${data.loginUrl}

School Code: ${data.schoolCode}

If you need help, please contact support and reference your school code.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}