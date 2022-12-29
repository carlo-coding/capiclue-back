import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { analyzeText } from 'src/utils/analyzeText';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/CreateReportDto';
import { Report } from './report.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report) private reportRepository: Repository<Report>,
  ) {}

  private getReportSentiment(report: string) {
    return Math.floor(Math.tanh(analyzeText(report)) * 100);
  }

  async createNewReport(dto: CreateReportDto, userId: number) {
    if (!userId)
      throw new HttpException('No userid provided', HttpStatus.BAD_REQUEST);
    const payload = {
      ...dto,
      userId,
      score: this.getReportSentiment(dto.content),
    };
    const newReport = await this.reportRepository.create(payload);
    await this.reportRepository.save(newReport);

    return {
      data: {
        message: 'Report created successfully!',
      },
    };
  }
}
