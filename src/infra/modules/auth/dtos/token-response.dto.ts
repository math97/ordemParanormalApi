export interface TokenResponseDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: string;
}
