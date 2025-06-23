import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { Agentica } from '@agentic/agentica';

describe('Tasks Controller', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: Agentica,
          useValue: {
            // Mock the methods you need for your tests
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
