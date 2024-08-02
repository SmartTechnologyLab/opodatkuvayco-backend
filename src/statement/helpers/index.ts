import { IReport } from '../types';

export const sortByDate = (report: IReport[]) =>
  report.sort(
    (a, b) =>
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime(),
  );
