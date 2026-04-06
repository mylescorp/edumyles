declare module "speakeasy" {
  interface SecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  interface GeneratedSecret {
    ascii?: string;
    hex?: string;
    base32: string;
    otpauth_url?: string | null;
  }

  const speakeasy: {
    generateSecret(options?: SecretOptions): GeneratedSecret;
  };

  export default speakeasy;
}
