import { Response } from "express";
import { login } from '@/src/services/auth.service'
import { AuthenticatedRequest, buildAuditContext } from "../middlewares/request-logger.middleware";


export async function loginUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const auditContext = buildAuditContext(req)
    const {user, token} = await login(req.body, auditContext, res.statusCode)
    res.status(200).json({
        success: true,
        message: 'Login Successful',
        data: user,
        accessToken: token 
    })
} 
