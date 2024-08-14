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
