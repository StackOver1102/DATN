export interface JwtOptions {
  secret: string;
  expiresIn: string | number;
}

export interface AuthModuleOptions {
  jwt: JwtOptions;
  passwordHashRounds?: number;
}
