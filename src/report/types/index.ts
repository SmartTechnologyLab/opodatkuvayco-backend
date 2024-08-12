type CorporateActionTypeId = 'dividend' | 'maturity';

type OperationType = 'buy' | 'sell';

export interface ICorporateAction {
  date: string;
  type: string;
  type_id: CorporateActionTypeId;
  amount: number;
  ticker: string;
  isin: string;
  currency: string;
}

export interface IDealReport<T> {
  total: number;
  totalTaxFee: number;
  totalMilitaryFee: number;
  deals: T[];
}

export type GrouppedTrades = { [key: string]: ITrade[] };

export interface ITrade {
  date: string;
  price: number;
  commission: number;
  operation: OperationType;
  quantity: number;
  ticker: string;
  currency: string;
}

export interface IFreedomFinanceTrade {
  date: string;
  p: number;
  q: number;
  commission: number;
  operation: OperationType;
  instr_nm: string;
  curr_c: string;
}

export interface IFreedomFinanceReport {
  date_start: string;
  corporate_actions: {
    detailed: ICorporateAction[];
  };
  trades: {
    detailed: IFreedomFinanceTrade[];
  };
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
