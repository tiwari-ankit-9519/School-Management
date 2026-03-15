import { Router } from "express";
import { loginUser } from "../controller/auth.controller";

const router: Router = Router()

router.post('/login', loginUser)

export default router;