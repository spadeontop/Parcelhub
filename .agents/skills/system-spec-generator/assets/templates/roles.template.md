# Roles & Access Control Matrix

## 1. Actor Directory
| Role | Definition | Default Auth State |
| :--- | :--- | :--- |
| `guest` | Unauthenticated public visitor | Anonymous session / Device ID |
| `user` | Standard authenticated user | Authenticated Bearer JWT / Cookie |
| `admin` | System administrator | Multi-factor privileged admin session |

## 2. Route & Permission Matrix
| Route / Action | `guest` | `user` | `admin` | Scoping Filter |
| :--- | :---: | :---: | :---: | :--- |
| `GET /api/v1/health` | ALLOW | ALLOW | ALLOW | Public |
| `POST /api/v1/auth/login` | ALLOW | ALLOW | ALLOW | Public |
| `GET /api/v1/user/profile` | DENY | ALLOW | ALLOW | Own `userId` |
| `POST /api/v1/admin/*` | DENY | DENY | ALLOW | Global |

## 3. Boundary Invariants
- Users can only query and mutate their own resources (`userId = req.user.id`).
- Administrative actions require explicit role verification before controller execution.
