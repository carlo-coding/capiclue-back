import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { CreateReportDto } from './dto/CreateReportDto';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post('')
  @UseGuards(JwtAuthGuard)
  makeReport(@Body() dto: CreateReportDto, @User() user: IUserAuthPayload) {
    return this.reportService.createNewReport(dto, user.userId);
  }
}
