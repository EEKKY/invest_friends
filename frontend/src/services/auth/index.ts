import { api } from "../axios";

const authApi = {
  socialLogin: (provider: string) => {
    return api.get(`/auth/${provider}`);
  },
};

export default authApi;
