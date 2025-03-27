import { StockExchangeEnum } from 'src/report/normalizeTrades/constants/enums';

export type StockExchangeType =
  | StockExchangeEnum.FREEDOM_FINANCE
  | StockExchangeEnum.IBRK;
