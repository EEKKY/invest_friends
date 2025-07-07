export const axiosErrorStrategies: Record<string, any> = {
  '/login/.*/': (error) => {
    console.warn('로그인 실패 처리');
  },
  '/payment/.*': (error) => {
    console.warn('결제 실패 처리');
  },
  '.*': (error) => {
    console.error(`[DEFAULT] 에러 발생: ${error.config?.url}`);
  },
};
