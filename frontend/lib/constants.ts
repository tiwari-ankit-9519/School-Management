export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const QUERY_KEYS = {
  CURRENT_USER: ["currentUser"],
  SCHOOL_APPLICATION: ["schoolApplication"],
  SCHOOL_APPLICATIONS: ["schoolApplications"],
  USER_APPLICATION_STATUS: ["user-application-status"],
  SCHOOL_CREATE: ["created-school-application"],
};
