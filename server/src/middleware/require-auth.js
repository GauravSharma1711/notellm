import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        res.locals.session = session;
        next();
    }
    catch (error) {
        next(error);
    }
};
