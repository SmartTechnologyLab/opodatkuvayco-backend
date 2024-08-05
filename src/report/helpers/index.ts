import { sort } from 'ramda';
import { IReport } from '../types';

export const sortByDate = (report: IReport[]): IReport[] => {
  const byDate = (a: IReport, b: IReport) =>
    new Date(b.date_start).getTime() - new Date(a.date_start).getTime();
  return sort(byDate, report);
};
