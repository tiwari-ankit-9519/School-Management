export function sendModeratorWelcomeEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  regNumber: string;
  tempPassword: string;
  designation: string;
  department: string;
  schoolName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${data.schoolName} | Your Account Details`;

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
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .credentials-box { background: #eff6ff; border: 2px dashed #2563eb; border-radius: 10px; padding: 28px 24px; margin-bottom: 28px; }
    .credentials-box p.label { font-size: 13px; font-weight: 600; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; text-align: center; }
    .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #bfdbfe; font-size: 14px; }
    .credential-row:last-child { border-bottom: none; }
    .credential-row .key { color: #3b82f6; font-weight: 600; }
    .credential-row .val { color: #1e3a5f; font-weight: 700; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; word-break: break-all; text-align: right; max-width: 60%; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .steps-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
    .steps-box h3 { font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .step:last-child { margin-bottom: 0; }
    .step-num { background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .step p { font-size: 14px; color: #166534; line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 0 auto 28px; background: linear-gradient(135deg, #1e3a5f, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <h1>Welcome to the Team 🎉</h1>
      <p>${data.schoolName}</p>
    </div>

    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        Your moderator account has been created on the <strong>${data.schoolName}</strong> management portal.
        You can now log in using the credentials below. Please change your password immediately after your first login.
      </p>

      <div class="credentials-box">
        <p class="label">Your Login Credentials</p>
        <div class="credential-row">
          <span class="key">Registration No. &nbsp;</span>
          <span class="val">${data.regNumber}</span>
        </div>
        <div class="credential-row">
          <span class="key">Email &nbsp;</span>
          <span class="val">${data.email}</span>
        </div>
        <div class="credential-row">
          <span class="key">Temporary Password &nbsp;</span>
          <span class="val">${data.tempPassword}</span>
        </div>
      </div>

      <div class="info-box">
        <h3>Your Profile Details</h3>
        <div class="info-row">
          <span class="label">Full Name &nbsp;</span>
          <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Designation &nbsp;</span>
          <span class="value">${data.designation}</span>
        </div>
        <div class="info-row">
          <span class="label">Department &nbsp;</span>
          <span class="value">${data.department}</span>
        </div>
        <div class="info-row">
          <span class="label">School &nbsp;</span>
          <span class="value">${data.schoolName}</span>
        </div>
      </div>

      <div class="steps-box">
        <h3>Getting Started</h3>
        <div class="step">
          <div class="step-num">1</div>
          <p>Log in using your registration number or email and the temporary password provided above.</p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <p>Change your password immediately from your profile settings.</p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <p>Review your assigned permissions and reach out to your administrator if anything needs adjustment.</p>
        </div>
      </div>

      <a href="${data.loginUrl}" class="btn">Login to Portal</a>

      <div class="warning-box">
        <p>
          <strong>Security Notice:</strong> This email contains sensitive login credentials.
          Do not share your password with anyone. If you did not expect this email,
          please contact your school administrator immediately.
        </p>
      </div>

      <hr class="divider" />

      <p class="text">
        If you have any questions or face any issues logging in, please contact your school administrator.
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

Your moderator account has been created on the ${data.schoolName} management portal.

YOUR LOGIN CREDENTIALS
  Registration No. : ${data.regNumber}
  Email            : ${data.email}
  Temp Password    : ${data.tempPassword}

YOUR PROFILE DETAILS
  Full Name   : ${" " + data.firstName} ${data.lastName}
  Designation : ${" " + data.designation}
  Department  : ${" " + data.department}
  School      : ${" " + data.schoolName}

GETTING STARTED
  1. Log in using your registration number or email and the temporary password above.
  2. Change your password immediately from your profile settings.
  3. Review your assigned permissions and reach out to your administrator if anything needs adjustment.

Login here: ${data.loginUrl}

SECURITY NOTICE: Do not share your password with anyone.
If you did not expect this email, contact your school administrator immediately.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendPasswordResetLinkEmail(data: {
  email: string;
  regNumber: string;
  resetLink: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `Password Reset Request | Action Required`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .reset-box { background: #eff6ff; border: 2px dashed #2563eb; border-radius: 10px; padding: 28px 24px; margin-bottom: 28px; text-align: center; }
    .reset-box p.label { font-size: 13px; font-weight: 600; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    .reset-box p.expires { font-size: 13px; color: #6b7280; margin-top: 16px; }
    .reset-box p.expires span { font-weight: 700; color: #dc2626; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1e3a5f, #2563eb); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-top: 8px; }
    .link-fallback { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; word-break: break-all; }
    .link-fallback p.label { font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500; }
    .link-fallback p.link { font-size: 13px; color: #2563eb; font-family: 'Courier New', Courier, monospace; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .info-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box p { font-size: 14px; color: #991b1b; line-height: 1.7; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Password Reset Request 🔐</h1>
      <p>School Management System</p>
    </div>
    <div class="body">
      <p class="greeting">Dear User,</p>
      <p class="text">
        We received a request to reset the password for your account associated with
        registration number <strong>${data.regNumber}</strong> and email <strong>${data.email}</strong>.
        Click the button below to reset your password.
      </p>
      <div class="reset-box">
        <p class="label">Reset Your Password</p>
        <a href="${data.resetLink}" class="btn">Reset Password</a>
        <p class="expires">
          This link expires in <span>${data.expiresInMinutes} minutes</span>.
        </p>
      </div>
      <div class="link-fallback">
        <p class="label">If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="link">${data.resetLink}</p>
      </div>
      <div class="info-box">
        <p>
          <strong>Did not request this?</strong> If you did not request a password reset,
          you can safely ignore this email. Your password will remain unchanged.
          However, if you believe your account may be compromised, please contact
          your school administrator immediately.
        </p>
      </div>
      <div class="warning-box">
        <p>
          <strong>Security Notice:</strong> This link is valid for <strong>${data.expiresInMinutes} minutes</strong> only
          and can be used once. Never share this link with anyone including school staff.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you need further assistance, please contact your school administrator.
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
Dear User,

We received a request to reset the password for your account.

Registration No. : ${data.regNumber}
Email            :  ${data.email}

Reset your password using the link below:
${data.resetLink}

This link expires in ${data.expiresInMinutes} minutes and can only be used once.

Did not request this? Ignore this email — your password will remain unchanged.

SECURITY NOTICE: Never share this link with anyone.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendPasswordChangedSuccessEmail(data: {
  email: string;
  regNumber: string;
  ipAddress: string;
  changedAt: Date;
}): { subject: string; html: string; text: string } {
  const subject = `Password Changed Successfully | Security Alert`;

  const formattedDate = data.changedAt.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Changed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #166534 0%, #16a34a 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #166534; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .success-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 28px 24px; margin-bottom: 28px; text-align: center; }
    .success-box .icon { font-size: 40px; margin-bottom: 12px; }
    .success-box p { font-size: 15px; color: #166534; font-weight: 600; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #991b1b; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Password Changed ✓</h1>
      <p>School Management System</p>
    </div>
    <div class="body">
      <p class="greeting">Dear User,</p>
      <p class="text">
        This is a confirmation that the password for your account has been
        successfully changed. If you made this change, no further action is required.
      </p>
      <div class="success-box">
        <div class="icon">🔒</div>
        <p>Your password has been updated successfully.</p>
      </div>
      <div class="info-box">
        <h3>Change Details</h3>
        <div class="info-row">
          <span class="label">Registration No.</span>
          <span class="value">${data.regNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Changed At</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="label">IP Address</span>
          <span class="value">${data.ipAddress}</span>
        </div>
      </div>
      <div class="warning-box">
        <p>
          <strong>Not you?</strong> If you did not make this change, your account may be compromised.
          Please contact your school administrator immediately and do not log in
          until your account has been secured.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        For any concerns, please reach out to your school administrator right away.
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
Dear User,

Your password has been changed successfully.

CHANGE DETAILS
  Registration No. : ${" " + data.regNumber}
  Email            : ${" " + data.email}
  Changed At       : ${" " + formattedDate}
  IP Address       : ${" " + data.ipAddress}

NOT YOU? If you did not make this change, your account may be compromised.
Contact your school administrator immediately.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendTeacherApplicationSubmittedEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization?: string;
  schoolName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Application Received | ${data.schoolName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #1e3a5f; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .steps-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
    .steps-box h3 { font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .step:last-child { margin-bottom: 0; }
    .step-num { background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .step p { font-size: 14px; color: #166534; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #1e3a5f; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Received 📋</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        Thank you for applying to <strong>${data.schoolName}</strong>. We have successfully received
        your teacher application and it is currently under review. Our team will get back to you
        with an update shortly.
      </p>
      <div class="status-box">
        <div class="icon">✅</div>
        <p>Your application has been submitted successfully.</p>
        <span>Pending Review</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="info-box">
        <h3>Application Summary</h3>
        <div class="info-row">
          <span class="label">Full Name &nbsp;</span>
          <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email &nbsp;</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone &nbsp;</span>
          <span class="value">${data.phone}</span>
        </div>
        <div class="info-row">
          <span class="label">Qualification &nbsp;</span>
          <span class="value">${data.qualification}</span>
        </div>
        <div class="info-row">
          <span class="label">Experience &nbsp;</span>
          <span class="value">${data.experience} ${data.experience === 1 ? "year" : "years"}</span>
        </div>
        ${
          data.specialization
            ? `
        <div class="info-row">
          <span class="label">Specialization</span>
          <span class="value">${data.specialization}</span>
        </div>`
            : ""
        }
      </div>
      <div class="steps-box">
        <h3>What Happens Next</h3>
        <div class="step">
          <div class="step-num">1</div>
          <p>Our team will review your application and attached documents.</p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <p>You will be notified via email if you are shortlisted for further evaluation.</p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <p>If selected, you will receive your account credentials and onboarding details.</p>
        </div>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding your application, please contact
        the school administration with your reference ID.
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

Thank you for applying to ${data.schoolName}. Your teacher application has been received and is currently under review.

APPLICATION REFERENCE ID: ${data.applicationId}

APPLICATION SUMMARY
  Full Name      : ${data.firstName} ${data.lastName}
  Email          : ${data.email}
  Phone          : ${data.phone}
  Qualification  : ${data.qualification}
  Experience     : ${data.experience} ${data.experience === 1 ? "year" : "years"}
  ${data.specialization ? `Specialization : ${data.specialization}` : ""}

WHAT HAPPENS NEXT
  1. Our team will review your application and attached documents.
  2. You will be notified via email if you are shortlisted for further evaluation.
  3. If selected, you will receive your account credentials and onboarding details.

For any queries, please contact the school administration with your reference ID.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendTeacherApplicationResubmittedEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization?: string;
  schoolName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Application Resubmitted | ${data.schoolName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Resubmitted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #92400e; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #92400e; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #fde68a; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #92400e; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Resubmitted 🔄</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        Your previously rejected teacher application at <strong>${data.schoolName}</strong> has been
        successfully resubmitted with your updated information. Our team will review
        your application again and get back to you.
      </p>
      <div class="status-box">
        <div class="icon">🔄</div>
        <p>Your application has been resubmitted successfully.</p>
        <span>Under Review Again</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID &nbsp;</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="info-box">
        <h3>Updated Application Summary &nbsp;</h3>
        <div class="info-row">
          <span class="label">Full Name &nbsp;</span>
          <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email &nbsp;</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone &nbsp;</span>
          <span class="value">${data.phone}</span>
        </div>
        <div class="info-row">
          <span class="label">Qualification &nbsp;</span>
          <span class="value">${data.qualification}</span>
        </div>
        <div class="info-row">
          <span class="label">Experience &nbsp;</span>
          <span class="value">${data.experience} ${data.experience === 1 ? "year" : "years"}</span>
        </div>
        ${
          data.specialization
            ? `
        <div class="info-row">
          <span class="label">Specialization</span>
          <span class="value">${data.specialization}</span>
        </div>`
            : ""
        }
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> This is a resubmission of your previously rejected application.
          Ensure all your documents and information are accurate and complete to
          improve your chances of approval.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding your application, please contact
        the school administration with your reference ID.
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

Your previously rejected teacher application at ${data.schoolName} has been successfully resubmitted with your updated information.

APPLICATION REFERENCE ID: ${data.applicationId}

UPDATED APPLICATION SUMMARY
  Full Name      : ${data.firstName} ${data.lastName}
  Email          : ${data.email}
  Phone          : ${data.phone}
  Qualification  : ${data.qualification}
  Experience     : ${data.experience} ${data.experience === 1 ? "year" : "years"}
  ${data.specialization ? `Specialization : ${data.specialization}` : ""}

Please note: Ensure all your documents and information are accurate and complete to improve your chances of approval.

For any queries, please contact the school administration with your reference ID.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendTeacherApprovedEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  regNumber: string;
  tempPassword: string;
  schoolName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Congratulations! Application Approved | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Approved</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #10b981 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #064e3b; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #064e3b; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #a7f3d0; color: #064e3b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .credentials-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 10px; padding: 24px; margin-bottom: 28px; }
    .credentials-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; text-align: center; }
    .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1fae5; font-size: 14px; }
    .credential-row:last-child { border-bottom: none; }
    .credential-row .label { color: #6b7280; font-weight: 500; }
    .credential-row .value { color: #064e3b; font-weight: 700; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #064e3b; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Congratulations! 🎉</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        We are thrilled to inform you that your teacher application at <strong>${data.schoolName}</strong> has been
        reviewed and <strong>approved</strong>. Welcome to the team! Your account has been created and
        you can now log in using the credentials below.
      </p>
      <div class="status-box">
        <div class="icon">🎓</div>
        <p>Your application has been approved. You are now a teacher!</p>
        <span>Approved</span>
      </div>
      <div class="credentials-box">
        <h3>🔐 Your Login Credentials</h3>
        <div class="credential-row">
          <span class="label">Registration Number &nbsp;</span>
          <span class="value">${data.regNumber}</span>
        </div>
        <div class="credential-row">
          <span class="label">Email &nbsp;</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="credential-row">
          <span class="label">Temporary Password &nbsp;</span>
          <span class="value">${data.tempPassword}</span>
        </div>
      </div>
      <div class="notice-box">
        <p>
          <strong>Important:</strong> Please log in and change your temporary password immediately.
          Do not share your credentials with anyone. This password is valid for your first login only.
        </p>
      </div>
      <div class="info-box">
        <h3>Your Profile Summary</h3>
        <div class="info-row">
          <span class="label">Full Name &nbsp;</span>
          <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email &nbsp;</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone &nbsp;</span>
          <span class="value">${data.phone}</span>
        </div>
        <div class="info-row">
          <span class="label">Registration Number &nbsp;</span>
          <span class="value">${data.regNumber}</span>
        </div>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions or need assistance getting started, please contact
        the school administration with your registration number.
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

Congratulations! Your teacher application at ${data.schoolName} has been approved. Welcome to the team!

YOUR LOGIN CREDENTIALS
  Registration Number : ${data.regNumber}
  Email               : ${data.email}
  Temporary Password  : ${data.tempPassword}

Important: Please log in and change your temporary password immediately. Do not share your credentials with anyone.

YOUR PROFILE SUMMARY
  Full Name           : ${data.firstName} ${data.lastName}
  Email               : ${data.email}
  Phone               : ${data.phone}
  Registration Number : ${data.regNumber}

APPLICATION REFERENCE ID: ${data.applicationId}

For any queries, please contact the school administration with your registration number.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendTeacherApplicationRejectedEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization?: string;
  schoolName: string;
  applicationId: string;
  rejectionReason: string;
}): { subject: string; html: string; text: string } {
  const subject = `Application Rejected | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Rejected</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #7f1d1d; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #7f1d1d; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #fecaca; color: #7f1d1d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .reason-box p { font-size: 14px; color: #7f1d1d; line-height: 1.6; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #7f1d1d; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Rejected ❌</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
      <p class="text">
        We regret to inform you that your teacher application at
        <strong>${data.schoolName}</strong> has been reviewed and unfortunately rejected.
      </p>
      <div class="status-box">
        <div class="icon">❌</div>
        <p>Your teacher application has been rejected.</p>
        <span>Rejected</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="reason-box">
        <p><strong>Reason for Rejection:</strong> ${data.rejectionReason}</p>
      </div>
      <div class="info-box">
        <h3>Application Summary</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone</span>
          <span class="value">${data.phone}</span>
        </div>
        <div class="info-row">
          <span class="label">Qualification</span>
          <span class="value">${data.qualification}</span>
        </div>
        <div class="info-row">
          <span class="label">Experience</span>
          <span class="value">${data.experience} ${data.experience === 1 ? "year" : "years"}</span>
        </div>
        ${
          data.specialization
            ? `
        <div class="info-row">
          <span class="label">Specialization</span>
          <span class="value">${data.specialization}</span>
        </div>`
            : ""
        }
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> You may resubmit your application with updated
          information if you believe the rejection was made in error. Please contact
          the school administration for further guidance.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding this decision, please contact
        the school administration with your reference ID.
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

We regret to inform you that your teacher application at ${data.schoolName} has been rejected.

APPLICATION REFERENCE ID: ${data.applicationId}

REASON FOR REJECTION
  ${data.rejectionReason}

APPLICATION SUMMARY
  Full Name      : ${data.firstName} ${data.lastName}
  Email          : ${data.email}
  Phone          : ${data.phone}
  Qualification  : ${data.qualification}
  Experience     : ${data.experience} ${data.experience === 1 ? "year" : "years"}
  ${data.specialization ? `Specialization : ${data.specialization}` : ""}

You may resubmit your application with updated information. Please contact the school administration for further guidance.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendAdmissionApplicationSubmittedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Admission Application Received | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admission Application Received</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a8a; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #1e3a8a; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #bfdbfe; color: #1e3a8a; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #1e3a8a; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Received 📋</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.guardianFirstName} ${data.guardianLastName},</p>
      <p class="text">
        Thank you for submitting an admission application for <strong>${data.studentFirstName} ${data.studentLastName}</strong>
        at <strong>${data.schoolName}</strong>. We have successfully received your application and
        our team will review it shortly.
      </p>
      <div class="status-box">
        <div class="icon">📬</div>
        <p>Your admission application has been received successfully.</p>
        <span>Under Review</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="info-box">
        <h3>Student Details</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.studentFirstName} ${data.studentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Applying For Class</span>
          <span class="value">${data.appliedForClass}</span>
        </div>
      </div>
      <div class="info-box">
        <h3>Guardian Details</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.guardianFirstName} ${data.guardianLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone</span>
          <span class="value">${data.guardianPhone}</span>
        </div>
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> Keep your Application Reference ID safe.
          You will need it for any future correspondence regarding this application.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding the application, please contact
        the school administration with your reference ID.
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
Dear ${data.guardianFirstName} ${data.guardianLastName},

Thank you for submitting an admission application for ${data.studentFirstName} ${data.studentLastName} at ${data.schoolName}. We have successfully received your application and our team will review it shortly.

APPLICATION REFERENCE ID: ${data.applicationId}

STUDENT DETAILS
  Full Name         : ${data.studentFirstName} ${data.studentLastName}
  Applying For Class: ${data.appliedForClass}

GUARDIAN DETAILS
  Full Name         : ${data.guardianFirstName} ${data.guardianLastName}
  Email             : ${data.guardianEmail}
  Phone             : ${data.guardianPhone}

Please keep your Application Reference ID safe for future correspondence.

For any queries, please contact the school administration with your reference ID.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendAdmissionApplicationResubmittedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Admission Application Resubmitted | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admission Application Resubmitted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #92400e; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #92400e; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #fde68a; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #92400e; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Resubmitted 🔄</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.guardianFirstName} ${data.guardianLastName},</p>
      <p class="text">
        The previously rejected admission application for <strong>${data.studentFirstName} ${data.studentLastName}</strong>
        at <strong>${data.schoolName}</strong> has been successfully resubmitted with updated information.
        Our team will review the application again and get back to you.
      </p>
      <div class="status-box">
        <div class="icon">🔄</div>
        <p>The admission application has been resubmitted successfully.</p>
        <span>Under Review Again</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="info-box">
        <h3>Updated Student Details</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.studentFirstName} ${data.studentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Applying For Class</span>
          <span class="value">${data.appliedForClass}</span>
        </div>
      </div>
      <div class="info-box">
        <h3>Guardian Details</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.guardianFirstName} ${data.guardianLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone</span>
          <span class="value">${data.guardianPhone}</span>
        </div>
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> This is a resubmission of a previously rejected application.
          Ensure all documents and information are accurate and complete to improve
          the chances of approval.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding the application, please contact
        the school administration with your reference ID.
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
Dear ${data.guardianFirstName} ${data.guardianLastName},

The previously rejected admission application for ${data.studentFirstName} ${data.studentLastName} at ${data.schoolName} has been successfully resubmitted with updated information.

APPLICATION REFERENCE ID: ${data.applicationId}

UPDATED STUDENT DETAILS
  Full Name         : ${data.studentFirstName} ${data.studentLastName}
  Applying For Class: ${data.appliedForClass}

GUARDIAN DETAILS
  Full Name         : ${data.guardianFirstName} ${data.guardianLastName}
  Email             : ${data.guardianEmail}
  Phone             : ${data.guardianPhone}

Please note: Ensure all documents and information are accurate and complete to improve the chances of approval.

For any queries, please contact the school administration with your reference ID.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendAdmissionApplicationRejectedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
  rejectionReason: string;
}): { subject: string; html: string; text: string } {
  const subject = `Admission Application Rejected | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admission Application Rejected</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #7f1d1d; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #7f1d1d; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #fecaca; color: #7f1d1d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .reason-box p { font-size: 14px; color: #7f1d1d; line-height: 1.6; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #7f1d1d; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Rejected ❌</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.guardianFirstName} ${data.guardianLastName},</p>
      <p class="text">
        We regret to inform you that the admission application for
        <strong>${data.studentFirstName} ${data.studentLastName}</strong> at
        <strong>${data.schoolName}</strong> has been reviewed and unfortunately rejected.
      </p>
      <div class="status-box">
        <div class="icon">❌</div>
        <p>The admission application has been rejected.</p>
        <span>Rejected</span>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="reason-box">
        <p><strong>Reason for Rejection:</strong> ${data.rejectionReason}</p>
      </div>
      <div class="info-box">
        <h3>Application Summary</h3>
        <div class="info-row">
          <span class="label">Student Name</span>
          <span class="value">${data.studentFirstName} ${data.studentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Applied For Class</span>
          <span class="value">${data.appliedForClass}</span>
        </div>
        <div class="info-row">
          <span class="label">Guardian Name</span>
          <span class="value">${data.guardianFirstName} ${data.guardianLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Guardian Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> You may resubmit your application with updated
          information if you believe the rejection was made in error. Please contact
          the school administration for further guidance.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions regarding this decision, please contact
        the school administration with your reference ID.
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
Dear ${data.guardianFirstName} ${data.guardianLastName},

We regret to inform you that the admission application for ${data.studentFirstName} ${data.studentLastName} at ${data.schoolName} has been rejected.

APPLICATION REFERENCE ID: ${data.applicationId}

REASON FOR REJECTION
  ${data.rejectionReason}

APPLICATION SUMMARY
  Student Name      : ${data.studentFirstName} ${data.studentLastName}
  Applied For Class : ${data.appliedForClass}
  Guardian Name     : ${data.guardianFirstName} ${data.guardianLastName}
  Guardian Email    : ${data.guardianEmail}

You may resubmit your application with updated information. Please contact the school administration for further guidance.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendAdmissionApplicationWaitlistedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
  waitlistPosition: number;
  waitlistReason: string;
}): { subject: string; html: string; text: string } {
  const subject = `Admission Application Waitlisted | ${data.schoolName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admission Application Waitlisted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #6366f1 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #1e3a5f; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #c7d2fe; color: #1e3a5f; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .position-box { background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 20px; margin-bottom: 28px; text-align: center; }
    .position-box p.label { font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .position-box p.position { font-size: 40px; font-weight: 700; color: #6366f1; }
    .position-box p.sublabel { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .reason-box { background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .reason-box p { font-size: 14px; color: #1e3a5f; line-height: 1.6; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #1e3a5f; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Application Waitlisted ⏳</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.guardianFirstName} ${data.guardianLastName},</p>
      <p class="text">
        The admission application for <strong>${data.studentFirstName} ${data.studentLastName}</strong>
        at <strong>${data.schoolName}</strong> has been reviewed. While your application meets our
        requirements, we currently do not have an available seat in Class ${data.appliedForClass}.
        Your application has been added to our waitlist.
      </p>
      <div class="status-box">
        <div class="icon">⏳</div>
        <p>Your application has been added to the waitlist.</p>
        <span>Waitlisted</span>
      </div>
      <div class="position-box">
        <p class="label">Your Waitlist Position</p>
        <p class="position">#${data.waitlistPosition}</p>
        <p class="sublabel">for Class ${data.appliedForClass}</p>
      </div>
      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>
      <div class="reason-box">
        <p><strong>Reason:</strong> ${data.waitlistReason}</p>
      </div>
      <div class="info-box">
        <h3>Application Summary</h3>
        <div class="info-row">
          <span class="label">Student Name</span>
          <span class="value">${data.studentFirstName} ${data.studentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Applied For Class</span>
          <span class="value">${data.appliedForClass}</span>
        </div>
        <div class="info-row">
          <span class="label">Guardian Name</span>
          <span class="value">${data.guardianFirstName} ${data.guardianLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Guardian Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
      </div>
      <div class="notice-box">
        <p>
          <strong>Please note:</strong> You will be automatically notified if a seat
          becomes available and your application is promoted. Please keep an eye on
          your email for further updates.
        </p>
      </div>
      <hr class="divider" />
      <p class="text">
        If you have any questions, please contact the school administration with your reference ID.
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
Dear ${data.guardianFirstName} ${data.guardianLastName},

The admission application for ${data.studentFirstName} ${data.studentLastName} at ${data.schoolName} has been added to the waitlist.

WAITLIST POSITION: #${data.waitlistPosition} for Class ${data.appliedForClass}

APPLICATION REFERENCE ID: ${data.applicationId}

REASON
  ${data.waitlistReason}

APPLICATION SUMMARY
  Student Name      : ${data.studentFirstName} ${data.studentLastName}
  Applied For Class : ${data.appliedForClass}
  Guardian Name     : ${data.guardianFirstName} ${data.guardianLastName}
  Guardian Email    : ${data.guardianEmail}

You will be automatically notified if a seat becomes available and your application is promoted.

© ${new Date().getFullYear()} School Management System
  `.trim();
  return { subject, html, text };
}

export function sendAdmissionApprovedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  parentFirstName: string;
  parentLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  studentRegNumber: string;
  parentRegNumber: string;
  studentTempPassword: string;
  parentTempPassword: string;
  schoolName: string;
  applicationId: string;
  appliedForClass: string;
}): { subject: string; html: string; text: string } {
  const subject = `Admission Approved! Welcome to ${data.schoolName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admission Approved</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a8a; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .status-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 24px; margin-bottom: 28px; text-align: center; }
    .status-box .icon { font-size: 36px; margin-bottom: 10px; }
    .status-box p { font-size: 15px; color: #1e3a8a; font-weight: 600; }
    .status-box span { display: inline-block; margin-top: 8px; background: #bfdbfe; color: #1e3a8a; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .section-title { font-size: 16px; font-weight: 700; color: #1e3a8a; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #bfdbfe; display: flex; align-items: center; gap: 8px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-weight: 500; }
    .info-row .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .credentials-box { border-radius: 10px; padding: 24px; margin-bottom: 28px; }
    .credentials-box.student { background: #eff6ff; border: 2px dashed #3b82f6; }
    .credentials-box.parent { background: #f5f3ff; border: 2px dashed #8b5cf6; }
    .credentials-box h3 { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; text-align: center; }
    .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd6fe; font-size: 14px; }
    .credentials-box.student .credential-row { border-bottom-color: #bfdbfe; }
    .credential-row:last-child { border-bottom: none; }
    .credential-row .label { color: #6b7280; font-weight: 500; }
    .credentials-box.student .credential-row .value { color: #1e3a8a; font-weight: 700; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .credentials-box.parent .credential-row .value { color: #5b21b6; font-weight: 700; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .notice-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .ref-box { background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .ref-box p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .ref-box p.ref { font-size: 15px; font-weight: 700; color: #1e3a8a; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Admission Approved! 🎉</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.parentFirstName} ${data.parentLastName},</p>
      <p class="text">
        We are delighted to inform you that the admission application for
        <strong>${data.studentFirstName} ${data.studentLastName}</strong> at
        <strong>${data.schoolName}</strong> has been reviewed and <strong>approved</strong>.
        Two accounts have been created — one for the student and one for the parent/guardian.
        Login credentials for both are provided below.
      </p>

      <div class="status-box">
        <div class="icon">🏫</div>
        <p>${data.studentFirstName} ${data.studentLastName} has been admitted to <strong>Class ${data.appliedForClass}</strong></p>
        <span>Admitted</span>
      </div>

      <div class="credentials-box student">
        <h3>🎒 Student Login Credentials</h3>
        <div class="credential-row">
          <span class="label">Registration Number</span>
          <span class="value">${data.studentRegNumber}</span>
        </div>
        <div class="credential-row">
          <span class="label">Temporary Password</span>
          <span class="value">${data.studentTempPassword}</span>
        </div>
      </div>

      <div class="credentials-box parent">
        <h3>👨‍👩‍👧 Parent / Guardian Login Credentials</h3>
        <div class="credential-row">
          <span class="label">Registration Number</span>
          <span class="value">${data.parentRegNumber}</span>
        </div>
        <div class="credential-row">
          <span class="label">Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
        <div class="credential-row">
          <span class="label">Temporary Password</span>
          <span class="value">${data.parentTempPassword}</span>
        </div>
      </div>

      <div class="notice-box">
        <p>
          <strong>Important:</strong> Please log in with both accounts and change the temporary
          passwords immediately. Do not share your credentials with anyone.
          These passwords are valid for the first login only.
        </p>
      </div>

      <div class="info-box">
        <h3>Student Summary</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.studentFirstName} ${data.studentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Class Admitted</span>
          <span class="value">${data.appliedForClass}</span>
        </div>
        <div class="info-row">
          <span class="label">Registration Number</span>
          <span class="value">${data.studentRegNumber}</span>
        </div>
      </div>

      <div class="info-box">
        <h3>Parent / Guardian Summary</h3>
        <div class="info-row">
          <span class="label">Full Name</span>
          <span class="value">${data.parentFirstName} ${data.parentLastName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">${data.guardianEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone</span>
          <span class="value">${data.guardianPhone}</span>
        </div>
        <div class="info-row">
          <span class="label">Registration Number</span>
          <span class="value">${data.parentRegNumber}</span>
        </div>
      </div>

      <div class="ref-box">
        <p class="label">Application Reference ID</p>
        <p class="ref">${data.applicationId}</p>
      </div>

      <hr class="divider" />
      <p class="text">
        If you have any questions or need assistance, please contact the school administration
        with your application reference ID or registration numbers.
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
Dear ${data.parentFirstName} ${data.parentLastName},

Congratulations! The admission application for ${data.studentFirstName} ${data.studentLastName} at ${data.schoolName} has been approved.

STUDENT LOGIN CREDENTIALS
  Registration Number : ${data.studentRegNumber}
  Temporary Password  : ${data.studentTempPassword}

PARENT / GUARDIAN LOGIN CREDENTIALS
  Registration Number : ${data.parentRegNumber}
  Email               : ${data.guardianEmail}
  Temporary Password  : ${data.parentTempPassword}

Important: Please log in with both accounts and change the temporary passwords immediately.
Do not share your credentials with anyone. These passwords are valid for the first login only.

STUDENT SUMMARY
  Full Name           : ${data.studentFirstName} ${data.studentLastName}
  Class Admitted      : ${data.appliedForClass}
  Registration Number : ${data.studentRegNumber}

PARENT / GUARDIAN SUMMARY
  Full Name           : ${data.parentFirstName} ${data.parentLastName}
  Email               : ${data.guardianEmail}
  Phone               : ${data.guardianPhone}
  Registration Number : ${data.parentRegNumber}

APPLICATION REFERENCE ID: ${data.applicationId}

For any queries, please contact the school administration with your reference ID or registration numbers.

© ${new Date().getFullYear()} School Management System
  `.trim();

  return { subject, html, text };
}

export function sendSlotOfferedEmail(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
  slotExpiresAt: Date;
}): { subject: string; html: string; text: string } {
  const subject = `Seat Available for ${data.studentFirstName} ${data.studentLastName} | ${data.schoolName}`;

  const formattedExpiry = data.slotExpiresAt.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const confirmUrl = `${process.env.FRONTEND_URL}/admission/confirm-slot/${data.applicationId}`;
  const declineUrl = `${process.env.FRONTEND_URL}/admission/decline-slot/${data.applicationId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seat Available</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e3a5f; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px; }
    .slot-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px; padding: 28px 24px; margin-bottom: 28px; text-align: center; }
    .slot-box p.label { font-size: 13px; font-weight: 600; color: #14532d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .slot-box p.class-name { font-size: 28px; font-weight: 800; color: #16a34a; margin-bottom: 4px; }
    .slot-box p.app-id { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .slot-box p.expires { font-size: 13px; color: #6b7280; margin-top: 16px; }
    .slot-box p.expires span { font-weight: 700; color: #dc2626; }
    .btn-group { display: flex; justify-content: center; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
    .btn-confirm { display: inline-block; background: linear-gradient(135deg, #15803d, #16a34a); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .btn-decline { display: inline-block; background: linear-gradient(135deg, #b91c1c, #dc2626); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .link-fallback { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; }
    .link-fallback p.label { font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 500; }
    .link-fallback p.link { font-size: 13px; color: #2563eb; font-family: 'Courier New', Courier, monospace; word-break: break-all; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .warning-box p { font-size: 14px; color: #7c2d12; line-height: 1.6; }
    .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box p { font-size: 14px; color: #1e40af; line-height: 1.7; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .detail-label { color: #6b7280; font-weight: 500; }
    .detail-row .detail-value { color: #111827; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎉 A Seat is Available!</h1>
      <p>${data.schoolName}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.guardianFirstName} ${data.guardianLastName},</p>
      <p class="text">
        Great news! A seat has become available for your child
        <strong>${data.studentFirstName} ${data.studentLastName}</strong>
        in <strong>Class ${data.appliedForClass}</strong> at ${data.schoolName}.
        Please confirm or decline this offer before the deadline below.
      </p>

      <div class="slot-box">
        <p class="label">Seat Available In</p>
        <p class="class-name">Class ${data.appliedForClass}</p>
        <p class="app-id">Application ID: ${data.applicationId}</p>
        <div class="btn-group">
          <a href="${confirmUrl}" class="btn-confirm">✓ Confirm Seat</a>
          <a href="${declineUrl}" class="btn-decline">✕ Decline Seat</a>
        </div>
        <p class="expires">
          This offer expires on <span>${formattedExpiry}</span>
        </p>
      </div>

      <div class="detail-row">
        <span class="detail-label">Student Name</span>
        <span class="detail-value">${data.studentFirstName} ${data.studentLastName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Class Applied For</span>
        <span class="detail-value">Class ${data.appliedForClass}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">School</span>
        <span class="detail-value">${data.schoolName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Offer Expires</span>
        <span class="detail-value">${formattedExpiry}</span>
      </div>

      <hr class="divider" />

      <div class="link-fallback">
        <p class="label">If the Confirm button doesn't work, copy and paste this link:</p>
        <p class="link">${confirmUrl}</p>
      </div>

      <div class="warning-box">
        <p>
          <strong>Important:</strong> This offer is only valid until
          <strong>${formattedExpiry}</strong>. If you do not confirm by this
          time, the seat will automatically be offered to the next applicant
          on the waitlist.
        </p>
      </div>

      <div class="info-box">
        <p>
          <strong>Already enrolled elsewhere?</strong> Please click Decline so
          we can offer this seat to another waiting family as quickly as
          possible. We appreciate your cooperation.
        </p>
      </div>

      <p class="text">
        If you have any questions, please contact the school administration
        directly.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>© ${new Date().getFullYear()} ${data.schoolName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${data.guardianFirstName} ${data.guardianLastName},

Great news! A seat has become available for ${data.studentFirstName} ${data.studentLastName} in Class ${data.appliedForClass} at ${data.schoolName}.

Application ID : ${data.applicationId}
Class          : ${data.appliedForClass}
Offer Expires  : ${formattedExpiry}

Confirm your seat here:
${confirmUrl}

Decline the seat here:
${declineUrl}

IMPORTANT: This offer expires on ${formattedExpiry}. If you do not confirm, the seat will be offered to the next applicant.

Already enrolled elsewhere? Please click Decline so we can offer this seat to another waiting family.

If you have any questions, please contact the school administration.

© ${new Date().getFullYear()} ${data.schoolName}
  `.trim();

  return { subject, html, text };
}
