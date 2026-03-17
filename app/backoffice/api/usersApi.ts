import { supportClient } from "../../httpClient";
import { Page, UserDto } from "../../types";

export const UsersApi = {
  list(params: {
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<Page<UserDto>> {
    return supportClient
      .get<Page<UserDto>>("/api/users", { params })
      .then(r => r.data);
  }
};

