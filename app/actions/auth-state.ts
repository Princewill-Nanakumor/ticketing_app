export type AuthState = {
  success: boolean;
  message?: string;
  errors?: Partial<
    Record<"name" | "email" | "password" | "form", string | undefined>
  >;
};

export const initialAuthState: AuthState = {
  success: false,
};
