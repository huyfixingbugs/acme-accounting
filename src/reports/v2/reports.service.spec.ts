import { Test, TestingModule } from "@nestjs/testing";
import { ReportsServiceV2 } from "./reports.service";
import fs from "fs";
import path from "path";

describe('ReportsServiceV2', () => {
  let service: ReportsServiceV2;
  let outputDir = 'out';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsServiceV2],
    }).compile();

    service = module.get<ReportsServiceV2>(ReportsServiceV2);

    if (fs.existsSync(outputDir)) {
      fs.readdirSync(outputDir).forEach(file => {
        if (file.endsWith('.csv')) {
          fs.unlinkSync(path.join(outputDir, file));
        }
      });
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate reports', async () => {
    await service.generate();
    const accountsOutput = fs.readFileSync(path.resolve(outputDir, 'accounts-v2.csv'), 'utf8');
    const yearlyOutput = fs.readFileSync(path.resolve(outputDir, 'yearly-v2.csv'), 'utf8');
    const fsOutput = fs.readFileSync(path.resolve(outputDir, 'fs-v2.csv'), 'utf8');
    
    expect(accountsOutput).toMatchSnapshot('accounts-v2.csv');
    expect(yearlyOutput).toMatchSnapshot('yearly-v2.csv');
    expect(fsOutput).toMatchSnapshot('fs-v2.csv');
  });

  it('should update status correctly', () => {
    const promise = service.generate();
    expect(service.state('accounts')).toBe('starting');
    expect(service.state('yearly')).toBe('starting');
    expect(service.state('fs')).toBe('starting');

    return promise.then(() => {
      expect(service.state('accounts')).toMatch(/finished in/);
      expect(service.state('yearly')).toMatch(/finished in/);
      expect(service.state('fs')).toMatch(/finished in/);
    });
  });
})
