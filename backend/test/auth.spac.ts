import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AtuhService } from 'src/auth/auth.service';
import { CreateUserInput } from 'src/auth/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { AuthEntity } from 'src/auth/entity/auth.entity';

describe('AtuhService', () => {
  let service: AtuhService;

  let mockAuthRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtuhService,
        {
          provide: getRepositoryToken(AuthEntity),
          useValue: mockAuthRepository,
        },
      ],
    }).compile();
    service = module.get<AtuhService>(AtuhService);
  });

  describe('createUser', () => {
    it('create a new user', async () => {
      const createUserInput: CreateUserInput = {
        userPassword: '1234dassa2',
        userEmail: 'sanghyun@naver.com',
        userNick: '상현',
      };

      const hashedPassword = 'hashed_password_123';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashed_password_123');

      const createUser = {
        ...createUserInput,
        userPassword: hashedPassword,
      };

      const savedUser = {
        ...createUser,
        userId: 1,
      };

      mockAuthRepository.create.mockReturnValue(createUser);
      mockAuthRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(createUserInput);

      expect(mockAuthRepository.create).toHaveBeenCalledWith({
        userEmail: createUserInput.userEmail,
        userNick: createUserInput.userNick,
        userPassword: hashedPassword,
      });

      expect(mockAuthRepository.save).toHaveBeenCalledWith(createUser);

      expect(result).toEqual(
        expect.objectContaining({
          userId: expect.any(Number),
          userEmail: 'sanghyun@naver.com',
          userNick: '상현',
          userPassword: hashedPassword,
        }),
      );
    });
  });
});
