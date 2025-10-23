import * as authService from '../services/auth.service';

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    // Make a request to a protected endpoint to verify the token
    await authService.authService.verifyToken(token);
    return true;
  } catch (error) {
    return false;
  }
};