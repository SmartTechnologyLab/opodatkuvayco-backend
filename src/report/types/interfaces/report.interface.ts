import { GroupedTrades } from './trade.interface';

interface AccounAtStart {
  ticker: string;
  quantity: number;
}

export type AccounAtStartType = Record<
  AccounAtStart['ticker'],
  AccounAtStart['quantity']
>;

export interface Report<T> {
  dateStart: string;
  trades: T[];
  accountAtStart?: AccounAtStartType;
  accountAtEnd?: AccounAtStartType;
}

export type ReportFromPreviousPeriod = Omit<Report<object>, 'trades'> & {
  groupedTrades: GroupedTrades;
};
