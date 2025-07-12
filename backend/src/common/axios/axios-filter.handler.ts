export const axiosErrorStrategies: Record<string, any> = {
  'https://test.com/.*': (error) => {
    console.warn('테스트 api 에러 처리');
  },
  'https://asset.com/.*': (error) => {
    console.warn('asset api 에러 처리');
  },
  '.*': (error) => {
    console.error(`[DEFAULT] 에러 발생: ${error.config?.url}`);
  },
};
