import { ApiResponse } from "./axios.dto";

export abstract class AbstractHttpExecutor<T> {

  async execute(url: string): Promise<T> {
    try {
      const response = await this.request(url);
      return this.after(response);
    } catch (err){
      this.handleError(err);
    }
  }
  /**
   * This method should be overridden by the implementing class.
   * It's supposed to request the given URL and return the response data.
   * @param url - The URL to request
   * @returns The response data
   */
  protected abstract request(url: string): Promise<ApiResponse<T>>;
  protected abstract handleError(error): Promise<ApiResponse<T>>;
  protected after(res: ApiResponse<T>): T {
    return res.data;
  }
}
