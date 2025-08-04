import { Test, TestingModule } from '@nestjs/testing';

import { AuthEntity } from '../auth/entity/auth.entity';
import { JwtAuthService } from './jwt.service';
import { AccessTokenService } from './accesstoken/access.token.service';
import { RefreshTokenService } from './refreshtoken/refresh.token.service';
import {
  RefreshResponse,
  TokenPairResponse,
} from './interface/jwt.token.interface';

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  let accessTokenService: jest.Mocked<AccessTokenService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUser: AuthEntity = {
    userId: 1,
    userUid: 'test-uid-123',
    userEmail: 'test@example.com',
    userNick: 'testuser',
    userPassword: 'hashedPassword123',
    social: null,
    assist: null,
    createAt: new Date(),
    updateAt: new Date(),
    deleteAt: null,
    generateUid: jest.fn(),
  };

  const mockAccessTokenResponse = {
    accessToken: 'mock.access.token',
    tokenType: 'Bearer',
    expiresIn: '3600',
  };

  const mockRefreshTokenResponse = {
    refreshToken: 'mock.refresh.token',
    expiresIn: '7d',
  };

  beforeEach(async () => {
    const mockAccessTokenService = {
      generateAccessToken: jest.fn(),
    };

    const mockRefreshTokenService = {
      generatRefreshToken: jest.fn(),
      getUserFromRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        {
          provide: AccessTokenService,
          useValue: mockAccessTokenService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
    accessTokenService = module.get(AccessTokenService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    it('사용자 정보로 토큰 쌍을 생성해야 한다', async () => {
      accessTokenService.generateAccessToken.mockResolvedValue(
        mockAccessTokenResponse,
      );
      refreshTokenService.generatRefreshToken.mockResolvedValue(
        mockRefreshTokenResponse,
      );

      const expectedResponse: TokenPairResponse = {
        accessToken: mockAccessTokenResponse.accessToken,
        refreshToken: mockRefreshTokenResponse.refreshToken,
        tokenType: mockAccessTokenResponse.tokenType,
        expiresIn: mockAccessTokenResponse.expiresIn,
      };

      const result = await service.generateTokenPair(mockUser);

      expect(accessTokenService.generateAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(refreshTokenService.generatRefreshToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('액세스 토큰 생성 실패시 에러를 throw해야 한다', async () => {
      const error = new Error('Access token generation failed');
      accessTokenService.generateAccessToken.mockRejectedValue(error);

      await expect(service.generateTokenPair(mockUser)).rejects.toThrow(error);
      expect(refreshTokenService.generatRefreshToken).not.toHaveBeenCalled();
    });

    it('리프레시 토큰 생성 실패시 에러를 throw해야 한다', async () => {
      accessTokenService.generateAccessToken.mockResolvedValue(
        mockAccessTokenResponse,
      );
      const error = new Error('Refresh token generation failed');
      refreshTokenService.generatRefreshToken.mockRejectedValue(error);
      await expect(service.generateTokenPair(mockUser)).rejects.toThrow(error);
    });

    it('null 사용자로 호출시 에러를 throw해야 한다', async () => {
      const error = new Error('User cannot be null');
      accessTokenService.generateAccessToken.mockRejectedValue(error);

      await expect(service.generateTokenPair(null)).rejects.toThrow(error);
    });
  });

  describe('refreshAccessToken', () => {
    const mockRefreshToken = 'valid.refresh.token';

    it('리프레시 토큰으로 새로운 액세스 토큰을 생성해야 한다', async () => {
      refreshTokenService.getUserFromRefreshToken.mockResolvedValue(mockUser);
      accessTokenService.generateAccessToken.mockResolvedValue(
        mockAccessTokenResponse,
      );

      const expectedResponse: RefreshResponse = {
        accessToken: mockAccessTokenResponse.accessToken,
        tokenType: mockAccessTokenResponse.tokenType,
        expiresIn: mockAccessTokenResponse.expiresIn,
      };

      const result = await service.refreshAccessToken(mockRefreshToken);

      expect(refreshTokenService.getUserFromRefreshToken).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(accessTokenService.generateAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('유효하지 않은 리프레시 토큰으로 호출시 에러를 throw해야 한다', async () => {
      const invalidToken = 'invalid.refresh.token';
      const error = new Error('Invalid refresh token');
      refreshTokenService.getUserFromRefreshToken.mockRejectedValue(error);

      await expect(service.refreshAccessToken(invalidToken)).rejects.toThrow(
        error,
      );
      expect(accessTokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('만료된 리프레시 토큰으로 호출시 에러를 throw해야 한다', async () => {
      const expiredToken = 'expired.refresh.token';
      const error = new Error('Refresh token expired');
      refreshTokenService.getUserFromRefreshToken.mockRejectedValue(error);

      await expect(service.refreshAccessToken(expiredToken)).rejects.toThrow(
        error,
      );
    });

    it('사용자 정보가 없을 때 에러를 throw해야 한다', async () => {
      refreshTokenService.getUserFromRefreshToken.mockResolvedValue(null);
      const error = new Error('User not found');
      accessTokenService.generateAccessToken.mockRejectedValue(error);

      await expect(
        service.refreshAccessToken(mockRefreshToken),
      ).rejects.toThrow(error);
    });

    it('새로운 액세스 토큰 생성 실패시 에러를 throw해야 한다', async () => {
      refreshTokenService.getUserFromRefreshToken.mockResolvedValue(mockUser);
      const error = new Error('Access token generation failed');
      accessTokenService.generateAccessToken.mockRejectedValue(error);

      await expect(
        service.refreshAccessToken(mockRefreshToken),
      ).rejects.toThrow(error);
    });

    it('빈 문자열 토큰으로 호출시 에러를 throw해야 한다', async () => {
      const emptyToken = '';
      const error = new Error('Token cannot be empty');
      refreshTokenService.getUserFromRefreshToken.mockRejectedValue(error);

      await expect(service.refreshAccessToken(emptyToken)).rejects.toThrow(
        error,
      );
    });
  });
});
