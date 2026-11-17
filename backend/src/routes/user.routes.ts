import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh_token,
  verifyEmail,
  changePassword,
  forgotPassword,
} from "../controllers/auth.controllers";
import { validate } from "../middlewares/validate";
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  requestEmailChangeValidation,
  verifyEmailChangeValidation,
} from "../validations/user.validations";
import { createSocietyValidation } from "../validations/society.validations";
import { verifyJWT } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { Role } from "../models/user.models";
import {
  getData,
  getUserFlat,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  getUserSociety,
  viewSocietyResidents,
} from "../controllers/user.controllers";
import {
  createSociety,
  deleteSociety,
  getSociety,
} from "../controllers/society.controllers";
import {
  approvePendingSecretary,
  disapproveSecretary,
  getPendingSecretaries,
  revokeSecretary,
  assignSecretary,
} from "../controllers/admin.controllers";
import {
  createFlat,
  getFlat,
  getAllFlats,
  addFlatOwner,
  deleteFlat,
  removeFlatOwner,
  updateFlatOwner,
} from "../controllers/flat.controllers";
import {
  registerComplaint,
  getComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintByFilter,
  assignStaff,
  checkAssignedComplaints,
  updateComplaintStatus,
  markComplaintResolve,
} from "../controllers/complaint.controllers";
import {
  approveVisitorByResident,
  checkInVisitor,
  checkOutVisitor,
  getAllVisitors,
  getMyVisitors,
  getPendingVisitors,
  getVisitorById,
  getVisitorHistory,
  getVisitorStats,
  getSecurityVisitorDestinations,
  registerVisitor,
  rejectVisitorByResident,
} from "../controllers/visitor.controllers";
import { getAllSecurityGuards } from "../controllers/security.controllers";
import {
  checkInSecurityGuard,
  checkOutSecurityGuard,
  getMySecurityAttendance,
  getSocietySecurityAttendance,
} from "../controllers/securityAttendance.controllers";
import {
  closePropertyListing,
  createPropertyListing,
  getMyPropertyListings,
  getSocietyPropertyListings,
  updatePropertyListing,
} from "../controllers/propertyListing.controllers";
import {
  createPropertyListingValidation,
  updatePropertyListingValidation,
} from "../validations/propertyListing.validations";
import {
  generateMaintenanceBills,
  getMaintenanceBillingPlan,
  getMyMaintenanceBills,
  getSocietyMaintenanceBills,
  recordMaintenancePayment,
  saveMaintenanceBillingPlan,
} from "../controllers/maintenanceBilling.controllers";
import {
  recordMaintenancePaymentValidation,
  maintenancePlanValidation,
} from "../validations/maintenanceBilling.validations";
import {
  archiveNotice,
  createNotice,
  getNoticeById,
  getPublishedNoticesForResident,
  getSocietyNotices,
  publishNotice,
  setNoticePinned,
  unpublishNotice,
  updateNotice,
} from "../controllers/notice.controllers";
import { validate as validateNotice } from "../middlewares/validate";
import {
  createNoticeValidation,
  noticePinValidation,
  updateNoticeValidation,
} from "../validations/notice.validations";

const authRouter = Router();
const userRouter = Router();
const societyRouter = Router();
const adminRouter = Router();
const flatRouter = Router();
const complaintRouter = Router();
const visitorRouter = Router();
const securityRouter = Router();
const noticeRouter = Router();
const propertyListingRouter = Router();
const maintenanceBillingRouter = Router();

maintenanceBillingRouter.get(
  "/maintenance/billing/plan",
  verifyJWT,
  authorize(Role.SECRETARY),
  getMaintenanceBillingPlan,
);
maintenanceBillingRouter.put(
  "/maintenance/billing/plan",
  verifyJWT,
  authorize(Role.SECRETARY),
  validate(maintenancePlanValidation),
  saveMaintenanceBillingPlan,
);
maintenanceBillingRouter.post(
  "/maintenance/billing/generate",
  verifyJWT,
  authorize(Role.SECRETARY),
  generateMaintenanceBills,
);
maintenanceBillingRouter.get(
  "/maintenance/billing/bills",
  verifyJWT,
  authorize(Role.SECRETARY),
  getSocietyMaintenanceBills,
);
maintenanceBillingRouter.post(
  "/maintenance/billing/bills/:billId/payments",
  verifyJWT,
  authorize(Role.SECRETARY),
  validate(recordMaintenancePaymentValidation),
  recordMaintenancePayment,
);
maintenanceBillingRouter.get(
  "/maintenance/my-bills",
  verifyJWT,
  authorize(Role.RESIDENT),
  getMyMaintenanceBills,
);

securityRouter.get(
  "/security/guards",
  verifyJWT,
  authorize(Role.SECRETARY),
  getAllSecurityGuards,
);
securityRouter.post(
  "/security/attendance/check-in",
  verifyJWT,
  authorize(Role.SECURITY),
  checkInSecurityGuard,
);
securityRouter.post(
  "/security/attendance/check-out",
  verifyJWT,
  authorize(Role.SECURITY),
  checkOutSecurityGuard,
);
securityRouter.get(
  "/security/attendance/me",
  verifyJWT,
  authorize(Role.SECURITY),
  getMySecurityAttendance,
);
securityRouter.get(
  "/security/attendance",
  verifyJWT,
  authorize(Role.SECRETARY),
  getSocietySecurityAttendance,
);

propertyListingRouter.post(
  "/property-listings",
  verifyJWT,
  authorize(Role.RESIDENT),
  validate(createPropertyListingValidation),
  createPropertyListing,
);
propertyListingRouter.get(
  "/property-listings",
  verifyJWT,
  authorize(Role.RESIDENT),
  getSocietyPropertyListings,
);
propertyListingRouter.get(
  "/property-listings/mine",
  verifyJWT,
  authorize(Role.RESIDENT),
  getMyPropertyListings,
);
propertyListingRouter.patch(
  "/property-listings/:listingId",
  verifyJWT,
  authorize(Role.RESIDENT),
  validate(updatePropertyListingValidation),
  updatePropertyListing,
);
propertyListingRouter.patch(
  "/property-listings/:listingId/close",
  verifyJWT,
  authorize(Role.RESIDENT),
  closePropertyListing,
);

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.patch(
  "/change-password",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT, Role.SECURITY, Role.MAINTENANCE),
  validate(changePasswordValidation),
  changePassword,
);
authRouter.post("/refresh-token", refresh_token);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/forgot-password", forgotPassword);

userRouter.get("/user", verifyJWT, getData);

userRouter.patch(
  "/users/update",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT, Role.SECURITY, Role.MAINTENANCE),
  updateProfile,
);

userRouter.post(
  "/users/email-change/request",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT, Role.SECURITY, Role.MAINTENANCE),
  validate(requestEmailChangeValidation),
  requestEmailChange,
);
userRouter.post(
  "/users/email-change/verify",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT, Role.SECURITY, Role.MAINTENANCE),
  validate(verifyEmailChangeValidation),
  verifyEmailChange,
);

userRouter.get(
  "/users/flats",
  verifyJWT,
  authorize(Role.RESIDENT),
  getUserFlat,
);

userRouter.get(
  "/users/societies",
  verifyJWT,
  authorize(Role.RESIDENT, Role.SECRETARY, Role.SECURITY),
  getUserSociety,
);

userRouter.get(
  "/users/societies/residents",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT),
  viewSocietyResidents,
);

userRouter.get(
  "/users/societies/:societyId/residents",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT),
  viewSocietyResidents,
);

societyRouter.post(
  "/societies",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  validate(createSocietyValidation),
  createSociety,
);

societyRouter.get(
  "/societies/:societyId",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  getSociety,
);

societyRouter.delete(
  "/societies/:societyId",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  deleteSociety,
);

adminRouter.get(
  "secretary-applications/pending",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  getPendingSecretaries,
);

adminRouter.patch(
  "/secretary-applications/:userId/approve",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  approvePendingSecretary,
);

adminRouter.patch(
  "/societies/:societyId/secretary/assign",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  assignSecretary,
);

adminRouter.patch(
  "/societies/:societyId/secretary/revoke",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  revokeSecretary,
);

adminRouter.patch(
  "/societies/:societyId/secretary/disapprove",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  disapproveSecretary,
);

flatRouter.post(
  "/societies/:societyId/flats",
  verifyJWT,
  authorize(Role.SECRETARY),
  createFlat,
);

flatRouter.get(
  "/societies/:societyId/flats",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SUPER_ADMIN),
  getAllFlats,
);

flatRouter.get(
  "/flats/:flatId",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SUPER_ADMIN),
  getFlat,
);

flatRouter.delete(
  "/flats/:flatId",
  verifyJWT,
  authorize(Role.SECRETARY),
  deleteFlat,
);

flatRouter.patch(
  "/flats/:flatId/owner",
  verifyJWT,
  authorize(Role.SECRETARY),
  addFlatOwner,
);

flatRouter.patch(
  "/flats/:flatId/owner",
  verifyJWT,
  authorize(Role.SECRETARY),
  updateFlatOwner,
);

flatRouter.delete(
  "/flats/:flatId/owner",
  verifyJWT,
  authorize(Role.SECRETARY),
  removeFlatOwner,
);

complaintRouter.get(
  "/complaints/check-assigned",
  verifyJWT,
  authorize(Role.MAINTENANCE),
  checkAssignedComplaints,
);

complaintRouter.post(
  "/societies/complaints/:flatId",
  verifyJWT,
  authorize(Role.RESIDENT, Role.SECRETARY),
  registerComplaint,
);

complaintRouter.get(
  "/my-complaints",
  verifyJWT,
  authorize(Role.RESIDENT),
  getMyComplaints,
);

complaintRouter.get(
  "/complaints/:complaintId",
  verifyJWT,
  authorize(Role.RESIDENT, Role.SECRETARY),
  getComplaint,
);

complaintRouter.get(
  "/societies/complaints/:societyId",
  verifyJWT,
  authorize(Role.SECRETARY),
  getAllComplaints,
);

complaintRouter.get(
  "/societies/complaints/filter/:societyId",
  verifyJWT,
  authorize(Role.SECRETARY),
  getComplaintByFilter,
);

complaintRouter.post(
  "/complaints/:complaintId/assign",
  verifyJWT,
  authorize(Role.SECRETARY),
  assignStaff,
);

complaintRouter.patch(
  "/complaints/:complaintId/update",
  verifyJWT,
  authorize(Role.MAINTENANCE),
  updateComplaintStatus,
);

complaintRouter.patch(
  "/complaints/:complaintId/resolve",
  verifyJWT,
  authorize(Role.MAINTENANCE),
  markComplaintResolve,
);

visitorRouter.post(
  "/visitor/",
  verifyJWT,
  authorize(Role.SECURITY),
  registerVisitor,
);

visitorRouter.get(
  "/visitor-destinations",
  verifyJWT,
  authorize(Role.SECURITY),
  getSecurityVisitorDestinations,
);

visitorRouter.patch(
  "/my-visitors/:visitorId/approve",
  verifyJWT,
  authorize(Role.RESIDENT),
  approveVisitorByResident,
);

visitorRouter.patch(
  "/my-visitors/:visitorId/reject",
  verifyJWT,
  authorize(Role.RESIDENT),
  rejectVisitorByResident,
);

visitorRouter.patch(
  "/:visitorId/check-in",
  verifyJWT,
  authorize(Role.SECURITY),
  checkInVisitor,
);

visitorRouter.patch(
  "/:visitorId/check-out",
  verifyJWT,
  authorize(Role.SECURITY),
  checkOutVisitor,
);

visitorRouter.get("/", verifyJWT, authorize(Role.SECRETARY), getAllVisitors);

visitorRouter.get(
  "/my-visitors",
  verifyJWT,
  authorize(Role.RESIDENT),
  getMyVisitors,
);

visitorRouter.get(
  "/pending",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SECURITY),
  getPendingVisitors,
);

visitorRouter.get(
  "/stats",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SECURITY, Role.RESIDENT),
  getVisitorStats,
);

visitorRouter.get(
  "/history",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SECURITY),
  getVisitorHistory,
);

visitorRouter.get(
  "/:visitorId",
  verifyJWT,
  authorize(Role.SECRETARY, Role.SECURITY),
  getVisitorById,
);

noticeRouter.post(
  "/notices",
  verifyJWT,
  authorize(Role.SECRETARY),
  validateNotice(createNoticeValidation),
  createNotice,
);
noticeRouter.get(
  "/notices/manage",
  verifyJWT,
  authorize(Role.SECRETARY),
  getSocietyNotices,
);
noticeRouter.get(
  "/notices",
  verifyJWT,
  authorize(Role.RESIDENT),
  getPublishedNoticesForResident,
);
noticeRouter.get(
  "/notices/:noticeId",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT),
  getNoticeById,
);
noticeRouter.patch(
  "/notices/:noticeId",
  verifyJWT,
  authorize(Role.SECRETARY),
  validateNotice(updateNoticeValidation),
  updateNotice,
);
noticeRouter.patch(
  "/notices/:noticeId/publish",
  verifyJWT,
  authorize(Role.SECRETARY),
  publishNotice,
);
noticeRouter.patch(
  "/notices/:noticeId/unpublish",
  verifyJWT,
  authorize(Role.SECRETARY),
  unpublishNotice,
);
noticeRouter.patch(
  "/notices/:noticeId/archive",
  verifyJWT,
  authorize(Role.SECRETARY),
  archiveNotice,
);
noticeRouter.patch(
  "/notices/:noticeId/pin",
  verifyJWT,
  authorize(Role.SECRETARY),
  validateNotice(noticePinValidation),
  setNoticePinned,
);

export {
  authRouter,
  userRouter,
  societyRouter,
  adminRouter,
  flatRouter,
  complaintRouter,
  visitorRouter,
  securityRouter,
  noticeRouter,
  propertyListingRouter,
  maintenanceBillingRouter,
};
