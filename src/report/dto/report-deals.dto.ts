import { FileType } from 'src/reportReader/types';
import { StockExchangeEnum } from 'src/normalizeTrades/constants/enums';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FileTypeEnum } from 'src/reportReader/consts';
import { ApiProperty } from '@nestjs/swagger';

export class ReportDealsDto {
  @ApiProperty({
    enum: FileTypeEnum,
    enumName: 'FileTypeEnum',
    description: 'Type of the report',
  })
  @IsEnum(FileTypeEnum)
  @IsNotEmpty({ message: 'File type query param is required' })
  fileType: FileType;

  @ApiProperty({
    enum: StockExchangeEnum,
    enumName: 'StockExchanregeEnum',
    description: 'Type of the report',
  })
  @IsEnum(StockExchangeEnum)
  @IsNotEmpty({ message: 'Stock exchange query param is required' })
  stockExchange: StockExchangeEnum;
}
