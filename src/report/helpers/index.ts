import { sort } from 'ramda';
import { IFreedomFinanceReport } from '../types';

export const sortByDate = (
  report: IFreedomFinanceReport[],
): IFreedomFinanceReport[] => {
  const byDate = (a: IFreedomFinanceReport, b: IFreedomFinanceReport) =>
    new Date(b.date_start).getTime() - new Date(a.date_start).getTime();
  return sort(byDate, report);
};
