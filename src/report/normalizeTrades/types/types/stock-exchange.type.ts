import { StockExchangeEnum } from 'src/report/normalizeTrades/constants/enums';

export type StockExchange =
  | StockExchangeEnum.FREEDOM_FINANCE
  | StockExchangeEnum.IBRK;
