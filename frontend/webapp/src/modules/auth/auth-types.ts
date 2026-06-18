import { Role } from "./roles"

export type AuthenticatedUser = {
  id: string
  email: string
  username: string
  role: Role
}

export type AuthResult = {
  accessToken: string
  user: {
    id: string
    email: string
    username: string
    role: Role
    createdAt: string
  }
}

