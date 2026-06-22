import "dotenv/config";
import { addEmailToQueue } from "@/src/queues/email.queue";
import {
  createModuleLogger,
  logSecurityEvent,
} from "@/src/config/logger.config";
import {
  sendModeratorWelcomeEmail,
  sendPasswordResetLinkEmail,
  sendPasswordChangedSuccessEmail,
  sendTeacherApplicationSubmittedEmail,
  sendTeacherApplicationResubmittedEmail,
  sendTeacherApplicationRejectedEmail,
  sendTeacherApprovedEmail,
  sendAdmissionApplicationSubmittedEmail,
  sendAdmissionApplicationResubmittedEmail,
  sendAdmissionApplicationRejectedEmail,
  sendAdmissionApplicationWaitlistedEmail,
  sendAdmissionApprovedEmail,
  sendSlotOfferedEmail,
} from "@/src/template/email.template";

const log = createModuleLogger("EmailService");

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
      regNumber: data.regNumber,
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
      : `https://yourapp.com/reset-password?token=${data.resetToken}`;
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
  const { subject, html, text } = sendTeacherApplicationSubmittedEmail(data);
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
  const { subject, html, text } = sendTeacherApplicationResubmittedEmail(data);
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

export async function sendTeacherApplicationRejectedEmailService(data: {
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
}): Promise<void> {
  log.info("Queuing teacher application rejected email", {
    email: data.email,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendTeacherApplicationRejectedEmail(data);
  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Teacher application rejected email queued successfully", {
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
  const { subject, html, text } = sendTeacherApprovedEmail(data);
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

export async function sendAdmissionApplicationRejectedEmailService(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
  rejectionReason: string;
}): Promise<void> {
  log.info("Queuing admission application rejected email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendAdmissionApplicationRejectedEmail(data);
  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Admission application rejected email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
}

export async function sendAdmissionApplicationWaitlistedEmailService(data: {
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
}): Promise<void> {
  log.info("Queuing admission application waitlisted email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendAdmissionApplicationWaitlistedEmail(data);
  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Admission application waitlisted email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
}

export async function sendAdmissionApprovedEmailService(data: {
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
}): Promise<void> {
  log.info("Queuing admission approved email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
  const { subject, html, text } = sendAdmissionApprovedEmail(data);
  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });
  log.info("Admission approved email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
  });
}

// Service to queue a slot offer email to the guardian notifying them of an available seat and confirmation deadline
export async function sendSlotOfferedEmailService(data: {
  studentFirstName: string;
  studentLastName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  appliedForClass: string;
  schoolName: string;
  applicationId: string;
  slotExpiresAt: Date;
}): Promise<void> {
  log.info("Queuing slot offered email", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
    applicationId: data.applicationId,
  });

  const { subject, html, text } = sendSlotOfferedEmail(data);

  await addEmailToQueue({
    to: data.guardianEmail,
    subject,
    html,
    text,
    priority: 1,
  });

  log.info("Slot offered email queued successfully", {
    email: data.guardianEmail,
    schoolName: data.schoolName,
    applicationId: data.applicationId,
    slotExpiresAt: data.slotExpiresAt,
  });
}
