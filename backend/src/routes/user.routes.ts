import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh_token,
  verifyEmail,
} from "../controllers/auth.controllers";
import { validate } from "../middlewares/validate";
import {
  registerValidation,
  loginValidation,
} from "../validations/user.validations";
import { createSocietyValidation } from "../validations/society.validations";
import { verifyJWT } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { Role } from "../models/user.models";
import {
  getData,
  getUserFlat,
  updateProfile,
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
  getAllComplaints,
  getComplaintByFilter,
  assignStaff,
  checkAssignedComplaints,
  updateComplaintStatus,
  markComplaintResolve,
} from "../controllers/complaint.controllers";

const authRouter = Router();
const userRouter = Router();
const societyRouter = Router();
const adminRouter = Router();
const flatRouter = Router();
const complaintRouter = Router();

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refresh_token);
authRouter.post("/verify-email", verifyEmail);

userRouter.get("/user", verifyJWT, getData);

userRouter.patch(
  "/users/update",
  verifyJWT,
  authorize(Role.SECRETARY, Role.RESIDENT),
  updateProfile,
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
  authorize(Role.RESIDENT),
  getUserSociety,
);

userRouter.get(
  "/users/societies/residents",
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

export {
  authRouter,
  userRouter,
  societyRouter,
  adminRouter,
  flatRouter,
  complaintRouter,
};
