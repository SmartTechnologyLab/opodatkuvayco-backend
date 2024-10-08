import { StockExchange } from 'src/normalizeTrades/constants';

export interface IReportService {
  readReport: (file: Express.Multer.File) => any;
  groupTradesByTicker: (trades: ITrade[]) => Record<ITrade['ticker'], ITrade[]>;
  getReportExtended: (trades: ITrade[]) => Promise<IDealReport<Deal>>;
  getPrevTrades: (trades: ITrade[]) => Promise<ITrade[]>;
  getReport: (trades: ITrade[]) => Promise<IDealReport<Deal>>;
  getShortBuy: (trades: ITrade[], currentSellTrade: ITrade) => ITrade;
  setDeal: (
    purchaseDeal: ITrade,
    sellDeal: ITrade,
    sellComission?: number,
  ) => Promise<Deal>;
  handleReports: (
    files: Express.Multer.File[],
    reportType: string,
    stockExchange: StockExchange,
  ) => Promise<IDealReport<Deal>>;
  fetchPurchaseAndSellRate: (
    purchaseDeal: ITrade,
    sellDeal: ITrade,
  ) => Promise<[number, number]>;
  findDealByDateAndPrice: (deals: ITrade[], currentDeal: ITrade) => ITrade;
  getTotalTaxFee: (total: number) => number;
  getMilitaryFee: (total: number) => number;
  getDeal: (options: DealOptions) => Deal;
  calculateDividends: (file: Express.Multer.File) => Promise<any>;
}

export type OperationType = 'buy' | 'sell';

export interface IDealReport<T> {
  total: number;
  totalTaxFee: number;
  totalMilitaryFee: number;
  deals: T[];
}

export type GrouppedTrades = { [key: string]: ITrade[] };

export interface IReport<T> {
  dateStart: string;
  trades: T[];
}

export interface ITrade {
  date: string;
  price: number;
  commission: number;
  operation: OperationType;
  quantity: number;
  ticker: string;
  currency: string;
}

export type DealOptions = {
  purchaseCommission?: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  purchaseRate?: number;
  quantity?: number;
  saleCommission?: number;
  saleDate?: Date;
  salePrice?: number;
  saleRate?: number;
  ticker?: string;
};

export type Deal = {
  id: symbol;
  percent: number;
  purchase: {
    date: Date;
    price: number;
    sum: number;
    commission: number;
    rate: number;
    uah: number;
  };
  quantity: number;
  sale: {
    date: Date;
    price: number;
    sum: number;
    commission: number;
    rate: number;
    uah: number;
  };
  ticker: string;
  total: number;
};
