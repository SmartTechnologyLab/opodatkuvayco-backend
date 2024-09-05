import { sort } from 'ramda';
import { IReport, ITrade } from '../types';

export const sortByDate = (report: IReport<ITrade>[]): IReport<ITrade>[] => {
  const byDate = (a: IReport<ITrade>, b: IReport<ITrade>) =>
    new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime();
  return sort(byDate, report);
};
