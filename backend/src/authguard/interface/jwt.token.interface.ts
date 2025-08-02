export interface JwtPayload {
  userUid: string;
  userEmail: string;
}
export interface ReJwtPayload {
  userUid: string;
  userEmail: string;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface JwtConfig {
  accessToken: {
    secret: string;
    expiresIn: string;
  };
  refreshToken: {
    secret: string;
    expiresIn: string;
  };
}
