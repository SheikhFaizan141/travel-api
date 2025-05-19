"use strict";
// import { Request, Response, NextFunction } from "express";
// export const authorize = (options: {
//   roles?: string[];
//   permissions?: string[];
// }) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // Check roles
//     if (options.roles && !options.roles.includes(req.user.role)) {
//       return res.status(403).json({ error: "Insufficient privileges" });
//     }
//     // Check permissions
//     if (options.permissions) {
//       const userPermissions = req.user.permissions || [];
//       const hasPermission = options.permissions.every((p) =>
//         userPermissions.includes(p)
//       );
//       if (!hasPermission) {
//         return res.status(403).json({ error: "Missing required permissions" });
//       }
//     }
//     next();
//   };
// };
