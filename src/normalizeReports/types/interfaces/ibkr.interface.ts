import { OperationType } from 'src/report/types/types/operation.type';

export interface IbkrTrade {
  accountId: string;
  currency: string;
  assetCategory: string;
  subCategory: string;
  symbol: string;
  reportDate: string;
  dateTime: string;
  tradePrice: string;
  tradeMoney: string;
  ibCommission: string;
  tradeDate: string;
  quantity: string;
  buySell: Uppercase<OperationType>;
}

export interface IbkrReport {
  FlexQueryResponse: {
    FlexStatements: {
      FlexStatement: {
        Trades: {
          Trade: IbkrTrade[];
        };
        fromDate: string;
        toDate: string;
      };
    };
  };
}
