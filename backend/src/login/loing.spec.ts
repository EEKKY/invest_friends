import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthEntity } from '../auth/entity/auth.entity';
import { LoginService } from './login.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation(() => Promise.resolve(false)),
}));

describe('LoginService', () => {
  let service: LoginService;
  let repository: jest.Mocked<Repository<AuthEntity>>;

  const mockBcryptCompare = bcrypt.compare as jest.Mock;

  const mockUser: AuthEntity = {
    userId: 1,
    userUid: 'test-uid-123',
    userEmail: 'test@example.com',
    userNick: 'testuser',
    userPassword: 'hashedPassword123',
    createAt: new Date('2024-01-01'),
    updateAt: new Date('2024-01-02'),
    deleteAt: null,
    generateUid: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository: Partial<Repository<AuthEntity>> = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: getRepositoryToken(AuthEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    repository = module.get(getRepositoryToken(AuthEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('이메일로 사용자를 찾을 수 있어야 한다', async () => {
      const email = 'test@example.com';
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail(email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userEmail: email },
      });
      expect(result).toEqual(mockUser);
    });

    it('존재하지 않는 이메일로 검색시 null을 반환해야 한다', async () => {
      const email = 'nonexistent@example.com';
      repository.findOne.mockResolvedValue(null);

      const result = await service.findUserByEmail(email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userEmail: email },
      });
      expect(result).toBeNull();
    });

    it('빈 문자열 이메일로 검색해도 쿼리는 실행되어야 한다', async () => {
      const email = '';
      repository.findOne.mockResolvedValue(null);

      const result = await service.findUserByEmail(email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userEmail: email },
      });
      expect(result).toBeNull();
    });

    it('undefined 이메일로 검색해도 쿼리는 실행되어야 한다', async () => {
      const email = undefined as string | undefined;
      repository.findOne.mockResolvedValue(null);
      const result = await service.findUserByEmail(email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userEmail: email },
      });
      expect(result).toBeNull();
    });

    it('데이터베이스 에러가 발생하면 에러를 throw해야 한다', async () => {
      const email = 'test@example.com';
      const error = new Error('Database connection failed');
      repository.findOne.mockRejectedValue(error);

      await expect(service.findUserByEmail(email)).rejects.toThrow(
        'Database connection failed',
      );
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('valiPassword', () => {
    it('올바른 비밀번호를 입력하면 true를 반환해야 한다', async () => {
      const inputPassword = 'plainPassword123';
      const hashedPassword = 'hashedPassword123';
      mockBcryptCompare.mockResolvedValue(true);
      const result = await service.valiPassword(inputPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('잘못된 비밀번호를 입력하면 false를 반환해야 한다', async () => {
      const inputPassword = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.valiPassword(inputPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it('bcrypt 비교 중 에러가 발생하면 에러를 throw해야 한다', async () => {
      const inputPassword = 'plainPassword123';
      const hashedPassword = 'hashedPassword123';
      const error = new Error('Bcrypt comparison failed');
      mockBcryptCompare.mockRejectedValue(error);
      await expect(
        service.valiPassword(inputPassword, hashedPassword),
      ).rejects.toThrow('Bcrypt comparison failed');
    });

    it('빈 문자열 비밀번호로 비교하면 false를 반환해야 한다', async () => {
      const inputPassword = '';
      const hashedPassword = 'hashedPassword123';
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.valiPassword(inputPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it('빈 해시 비밀번호로 비교하면 false를 반환해야 한다', async () => {
      const inputPassword = 'plainPassword123';
      const hashedPassword = '';
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.valiPassword(inputPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it('null 값들로 비교시 적절히 처리되어야 한다', async () => {
      const inputPassword = null as string | undefined;
      const hashedPassword = null as string | undefined;
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.valiPassword(inputPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it('실제 bcrypt 해시와 비교 테스트', async () => {
      const inputPassword = 'testPassword123';
      const hashedPassword =
        '$2b$10$rI7Tt4nIJ8bRb4IYmdVF3OaG7Y7UjhXZL8JfN4HB.JkOp1Cj0cLka';
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.valiPassword(inputPassword, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
    });
  });

  describe('edge cases', () => {
    it('특수문자가 포함된 이메일로 검색할 수 있어야 한다', async () => {
      const email = 'test+label@example-domain.co.kr';
      const userWithSpecialEmail: AuthEntity = {
        ...mockUser,
        userEmail: email,
        generateUid: jest.fn(),
      };
      repository.findOne.mockResolvedValue(userWithSpecialEmail);

      const result = await service.findUserByEmail(email);

      expect(result?.userEmail).toBe(email);
    });

    it('매우 긴 비밀번호도 비교할 수 있어야 한다', async () => {
      const longPassword = 'a'.repeat(1000);
      const hashedPassword = 'hashedLongPassword';
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.valiPassword(longPassword, hashedPassword);
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, hashedPassword);
    });
  });
});
