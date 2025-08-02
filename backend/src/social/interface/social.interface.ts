export interface SocialUser {
  email: string;
  provider: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}
export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  provider: string;
}
export interface KakaoStrategyUser {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
}

export interface KakaoUser {
  provider: string;
  name: string;
  email: string;
}

export interface NaverUser {
  provider: string;
  providerId: string;
  name: string;
  email: string;
}
