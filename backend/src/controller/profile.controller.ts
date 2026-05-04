import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import { Role } from "@prisma/client";
import {
  getMyProfileService,
  updateStudentProfileService,
  updateTeacherProfileService,
  updateParentProfileService,
  updateAdminProfileService,
} from "../services/profile.service";

export async function getMyProfile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  const role = req.user?.role as Role;

  if (!userId) throw new Error("User ID is required");
  if (!role) throw new Error("Role is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const profile = await getMyProfileService(
    userId,
    role,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Profile fetched successfully",
    data: profile,
  });
}

export async function updateMyProfile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  const role = req.user?.role as Role;

  if (!userId) throw new Error("User ID is required");
  if (!role) throw new Error("Role is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  switch (role) {
    case Role.STUDENT: {
      const {
        email,
        phone,
        address,
        city,
        state,
        pincode,
        bloodGroup,
        medicalConditions,
        emergencyContact,
      } = req.body;

      const updated = await updateStudentProfileService(
        userId,
        {
          email,
          phone,
          address,
          city,
          state,
          pincode,
          bloodGroup,
          medicalConditions,
          emergencyContact,
        },
        auditContext,
        res.statusCode,
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
      break;
    }

    case Role.TEACHER: {
      const {
        email,
        phone,
        address,
        city,
        state,
        pincode,
        qualification,
        experience,
        specialization,
        photoUrl,
      } = req.body;

      const updated = await updateTeacherProfileService(
        userId,
        {
          email,
          phone,
          address,
          city,
          state,
          pincode,
          qualification,
          experience,
          specialization,
          photoUrl,
        },
        auditContext,
        res.statusCode,
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
      break;
    }

    case Role.PARENT: {
      const { email, phone, alternatePhone } = req.body;

      const updated = await updateParentProfileService(
        userId,
        { email, phone, alternatePhone },
        auditContext,
        res.statusCode,
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
      break;
    }

    case Role.ADMIN:
    case Role.MODERATOR: {
      const { email, phone, designation, department, photoUrl } = req.body;

      const updated = await updateAdminProfileService(
        userId,
        { email, phone, designation, department, photoUrl },
        auditContext,
        res.statusCode,
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
      break;
    }

    default: {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Profile update not supported for role: ${role}`,
      });
    }
  }
}
