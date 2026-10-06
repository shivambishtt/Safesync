import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh_token,
} from "../controllers/auth.controllers";
import { validate } from "../middlewares/validate";
import {
  registerValidation,
  loginValidation,
} from "../validations/user.validations";
import { createSocietyValidation } from "../validations/society.validations";
import { getData } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/authenticate";
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
import { authorize } from "../middlewares/authorize";
import { Role } from "../models/user.models";
import {
  createFlat,
  getFlat,
  getAllFlats,
  addFlatOwner,
  deleteFlat,
  removeFlatOwner,
  updateFlatOwner,
} from "../controllers/flat.controllers";

const authRouter = Router();
const userRouter = Router();
const societyRouter = Router();
const adminRouter = Router();
const flatRouter = Router();

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refresh_token);

userRouter.get("/user", verifyJWT, getData);

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

flatRouter.post(
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

export { authRouter, userRouter, societyRouter, adminRouter, flatRouter };
