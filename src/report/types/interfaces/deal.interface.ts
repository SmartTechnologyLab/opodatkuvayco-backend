export interface Deal {
  id: string;
  percent: number;
  purchase: TransactionDetails;
  quantity: number;
  sale: TransactionDetails;
  ticker: string;
  total: number;
}

export interface TransactionDetails {
  date: Date;
  price: number;
  sum: number;
  commission: number;
  rate: number;
  uah: number;
}
