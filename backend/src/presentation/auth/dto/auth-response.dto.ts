export interface AuthResponseDto {
  accessToken: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}
