import "dotenv/config";
import { addEmailToQueue } from "@/src/queues/email.queue";
import {
  createModuleLogger,
  logSecurityEvent,
} from "@/src/config/logger.config";
import {
  welcomeEmailTemplate,
  moreInfoEmailTemplate,
  rejectionEmailTemplate,
  sendSchoolApplicationId,
  sendModeratorWelcomeEmail,
  sendPasswordResetLinkEmail,
  sendPasswordChangedSuccessEmail,
  sendTeacherApplicationSubmittedEmail,
  sendTeacherApplicationResubmittedEmail,
  sendTeacherApprovedEmail,
  sendAdmissionApplicationSubmittedEmail,
  sendAdmissionApplicationResubmittedEmail,
} from "@/src/template/email.template";

const log = createModuleLogger("EmailService");

export async function sendMoreInfoEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  notes: string;
  moreInfoFields: string[];
  applicationId: string;
}): Promise<void> {
  try {
    log.info("Queuing more info email", {
      email: data.email,
      schoolName: data.schoolName,
      moreInfoFields: data.moreInfoFields,
    });

    const resubmitUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/apply/resubmit/${data.applicationId}`
      : `https://yourapp.com/apply/resubmit/${data.applicationId}`;

    const { subject, html, text } = moreInfoEmailTemplate({
      firstName: data.firstName,
      lastName: data.lastName,
      schoolName: data.schoolName,
      notes: data.notes,
      moreInfoFields: data.moreInfoFields,
      resubmitUrl,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 2,
    });

    log.info("More info email queued successfully", {
      email: data.email,
      schoolName: data.schoolName,
      moreInfoFields: data.moreInfoFields,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue more info email", {
      error: err.message,
      email: data.email,
      schoolName: data.schoolName,
    });
    logSecurityEvent("MORE_INFO_EMAIL_QUEUE_FAILED", "internal", null, {
      error: err.message,
      email: data.email,
      schoolName: data.schoolName,
    });
    throw err;
  }
}

export async function sendRejectionEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  rejectionReason: string;
}): Promise<void> {
  try {
    log.info("Queuing rejection email", {
      email: data.email,
      schoolName: data.schoolName,
    });

    const reapplyUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/apply`
      : "https://yourapp.com/apply";

    const { subject, html, text } = rejectionEmailTemplate({
      ...data,
      reapplyUrl,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 2,
    });

    log.info("Rejection email queued successfully", {
      email: data.email,
      schoolName: data.schoolName,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue rejection email", {
      error: err.message,
      email: data.email,
      schoolName: data.schoolName,
    });
    logSecurityEvent("REJECTION_EMAIL_QUEUE_FAILED", "internal", null, {
      error: err.message,
      email: data.email,
      schoolName: data.schoolName,
    });
    throw err;
  }
}

export async function sendWelcomeEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  tempPassword: string;
  schoolName: string;
  schoolCode: string;
  regNumber: string;
}): Promise<void> {
  try {
    log.info("Queuing welcome email", {
      email: data.email,
      schoolCode: data.schoolCode,
      regNumber: data.regNumber,
    });

    const loginUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : "https://yourapp.com/login";

    const { subject, html, text } = welcomeEmailTemplate({
      ...data,
      loginUrl,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 1,
    });

    log.info("Welcome email queued successfully", {
      email: data.email,
      schoolCode: data.schoolCode,
      regNumber: data.regNumber,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue welcome email", {
      error: err.message,
      email: data.email,
      schoolCode: data.schoolCode,
      regNumber: data.regNumber,
    });
    logSecurityEvent("WELCOME_EMAIL_QUEUE_FAILED", "internal", null, {
      error: err.message,
      email: data.email,
      schoolCode: data.schoolCode,
      regNumber: data.regNumber,
    });
    throw err;
  }
}

export async function sendApplicationIdEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  applicationId: string;
  appliedAt: string;
}): Promise<void> {
  try {
    log.info("Queuing application ID email", {
      email: data.email,
      applicationId: data.applicationId,
      schoolName: data.schoolName,
    });

    const trackingUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/track-application/${data.applicationId}`
      : `https://yourapp.com/track-application/${data.applicationId}`;

    const { subject, html, text } = sendSchoolApplicationId({
      ...data,
      trackingUrl,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 1,
    });

    log.info("Application ID email queued successfully", {
      email: data.email,
      applicationId: data.applicationId,
      schoolName: data.schoolName,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue application ID email", {
      error: err.message,
      email: data.email,
      applicationId: data.applicationId,
      schoolName: data.schoolName,
    });
    logSecurityEvent("APPLICATION_ID_EMAIL_QUEUE_FAILED", "internal", null, {
      error: err.message,
      email: data.email,
      applicationId: data.applicationId,
      schoolName: data.schoolName,
    });
    throw err;
  }
}

export async function sendModeratorInformation(data: {
  firstName: string;
  lastName: string;
  email: string;
  regNumber: string;
  tempPassword: string;
  designation: string;
  department: string;
  schoolName: string;
}): Promise<void> {
  try {
    log.info("Queuing moderator info email", {
      email: data.email,
      regNumber: data.regNumber,
      schoolName: data.schoolName,
    });

    const loginUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : "https://yourapp.com/login";

    const { subject, html, text } = sendModeratorWelcomeEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      regNumber: data.regNumber,
      tempPassword: data.tempPassword,
      designation: data.designation,
      department: data.department,
      schoolName: data.schoolName,
      loginUrl,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 1,
    });

    log.info("Moderator Info mail queued successfully", {
      email: data.email,
      regNumber: data.regNumber,
      schoolName: data.schoolName,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue moderator info email", {
      error: err.message,
      email: data.email,
      regNumebr: data.regNumber,
      schoolName: data.schoolName,
    });
    logSecurityEvent("MODERATOR_EMAIL_QUEUE_FAILED", "internal", null, {
      error: err.message,
      email: data.email,
      regNumber: data.regNumber,
      schoolName: data.schoolName,
    });
  }
}

export async function sendPasswordResetEmail(data: {
  email: string;
  regNumber: string;
  expiresInMinutes: number;
  resetToken: string;
}): Promise<void> {
  try {
    log.info("Queuing sendPasswordResetEmail", {
      email: data.email,
      regNumber: data.regNumber,
    });

    const resetLink = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}`
      : "https://youarpp.com/reset-password?token=${data.resetToken}";

    const { subject, html, text } = sendPasswordResetLinkEmail({
      email: data.email,
      regNumber: data.regNumber,
      resetLink,
      expiresInMinutes: data.expiresInMinutes,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 1,
    });

    log.info("Password reset email queued successfully");
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue password reset email", {
      error: err.message,
      email: data.email,
      regNumber: data.regNumber,
    });
  }
}

export async function sendResetPasswordSuccessEmail(data: {
  email: string;
  regNumber: string;
  ipAddress: string;
  changedAt: Date;
}): Promise<void> {
  try {
    log.info("Queuing password change success email", {
      email: data.email,
      regNumber: data.regNumber,
    });

    const { subject, html, text } = sendPasswordChangedSuccessEmail({
      email: data.email,
      regNumber: data.regNumber,
      ipAddress: data.ipAddress,
      changedAt: data.changedAt,
    });

    await addEmailToQueue({
      to: data.email,
      subject,
      html,
      text,
      priority: 1,
    });
    log.info("Password change email queued successfully");
  } catch (error) {
    const err = error as Error;
    log.error("Failed to queue password reset success mail", {
      error: err.message,
      email: data.email,
      regNumber: data.regNumber,
    });
  }
}

export async function sendTeacherApplicationEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization?: string;
  schoolName: string;
  applicationId: string;
}): Promise<void> {
  log.info("Queuing teacher application email", {
    email: data.email,
    schoolName: data.schoolName,
  });

  const { subject, html, text } = sendTeacherApplicationSubmittedEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    qualification: data.qualification,
    experience: data.experience,
    specialization: data.specialization,
    schoolName: data.schoolName,
    applicationId: data.applicationId,
  });

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    text,
    priority: 1,
  });

  log.info("Teacher Application email queued successfully", {
    email: data.email,
    schoolName: data.schoolName,
  });
}

export async function sendTeacherApplicationResubmissionEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization?: string;
  schoolName: string;
  applicationId: string;
}): Promise<void> {
  log.info("Queuing teacher resubmission application email", {
    email: data.email,
    schoolName: data.schoolName,
  });

  const { subject, html, text } = sendTeacherApplicationResubmittedEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    qualification: data.qualification,
    experience: data.experience,
    specialization: data.specialization,
    schoolName: data.schoolName,
    applicationId: data.applicationId,
  });

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    text,
    priority: 1,
  });

  log.info("Teacher Application resubmission email queued successfully", {
    email: data.email,
    schoolName: data.schoolName,
  });
}

export async function sendTeacherApprovedEmailService(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  regNumber: string;
  tempPassword: string;
  schoolName: string;
  applicationId: string;
}): Promise<void> {
  log.info("Queuing teacher approved email", {
    email: data.email,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendTeacherApprovedEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    regNumber: data.regNumber,
    tempPassword: data.tempPassword,
    schoolName: data.schoolName,
    applicationId: data.applicationId,
  });
  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Teacher approved email queued successfully", {
    email: data.email,
    schoolName: data.schoolName,
  });
}

export async function sendAdmissionApplicationSubmittedEmailService(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
}): Promise<void> {
  log.info("Queuing admission application submitted email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendAdmissionApplicationSubmittedEmail(data);
  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Admission application submitted email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
}

export async function sendAdmissionApplicationResubmittedEmailService(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
}): Promise<void> {
  log.info("Queuing admission application resubmission email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
  const { subject, html, text } =
    sendAdmissionApplicationResubmittedEmail(data);
  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Admission application resubmission email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
}
