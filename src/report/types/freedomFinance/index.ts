import { OperationType } from '..';

type FreedomFinanceCorporateActionTypeId = 'dividend' | 'maturity';

export interface IFreedomFinanceCorporateAction {
  date: string;
  type: string;
  type_id: FreedomFinanceCorporateActionTypeId;
  amount: number;
  ticker: string;
  isin: string;
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
    detailed: IFreedomFinanceCorporateAction[];
  };
  trades: {
    detailed: IFreedomFinanceTrade[];
  };
}
