import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataForSeoService } from './dataforseo.service';

@Module({
  imports: [HttpModule],
  providers: [DataForSeoService],
  exports: [DataForSeoService],
})
export class DataForSeoModule {}
