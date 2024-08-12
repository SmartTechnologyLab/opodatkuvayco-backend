import { GrouppedTrades } from '../../types';

export const expectedGroupedTrades: GrouppedTrades = {
  FIPO: [
    {
      date: '2021-06-07 11:48:21',
      ticker: 'FIPO',
      operation: 'buy',
      price: 35.53,
      currency: 'USD',
      quantity: 13,
      commission: 2.31,
    },
    {
      date: '2021-06-07 11:48:21',
      ticker: 'FIPO',
      operation: 'buy',
      price: 35.53,
      currency: 'USD',
      quantity: 13,
      commission: 2.31,
    },
    {
      date: '2021-06-07 11:48:21',
      ticker: 'FIPO',
      operation: 'sell',
      price: 35.53,
      currency: 'USD',
      quantity: 26,
      commission: 2.31,
    },
  ],
  MNDY_IPO: [
    {
      date: '2021-06-10 14:06:17',
      ticker: 'MNDY_IPO',
      operation: 'buy',
      price: 155,
      currency: 'USD',
      quantity: 1,
      commission: 7.75,
    },
    {
      date: '2021-07-10 14:06:17',
      ticker: 'MNDY_IPO',
      operation: 'buy',
      price: 156,
      currency: 'USD',
      quantity: 3,
      commission: 7.75,
    },
    {
      date: '2021-10-10 14:06:17',
      ticker: 'MNDY_IPO',
      operation: 'sell',
      price: 155,
      currency: 'sell',
      quantity: 3,
      commission: 7.75,
    },
    {
      date: '2021-11-10 14:06:17',
      ticker: 'MNDY_IPO',
      operation: 'sell',
      price: 155,
      currency: 'sell',
      quantity: 1,
      commission: 7.75,
    },
  ],
  WISH: [
    {
      date: '2021-06-10 16:30:00',
      ticker: 'WISH',
      operation: 'buy',
      price: 11.06,
      currency: 'USD',
      quantity: 10,
      commission: 1.75,
    },
    {
      date: '2021-06-10 16:30:00',
      ticker: 'WISH',
      operation: 'sell',
      price: 11.06,
      currency: 'USD',
      quantity: 10,
      commission: 1.75,
    },
  ],
  RIDE: [
    {
      date: '2021-06-10 18:41:12',
      ticker: 'RIDE',
      operation: 'buy',
      price: 10.65,
      currency: 'USD',
      quantity: 10,
      commission: 1.73,
    },
    {
      date: '2021-06-10 18:41:12',
      ticker: 'RIDE',
      operation: 'sell',
      price: 10.65,
      currency: 'sell',
      quantity: 12,
      commission: 1.73,
    },
    {
      date: '2021-06-10 18:41:12',
      ticker: 'RIDE',
      operation: 'buy',
      price: 10.65,
      currency: 'sell',
      quantity: 2,
      commission: 1.73,
    },
  ],
  GOOGL: [
    {
      date: '2021-06-10 18:41:12',
      ticker: 'GOOGL',
      operation: 'sell',
      price: 10.65,
      currency: 'sell',
      quantity: 10,
      commission: 1.73,
    },
    {
      date: '2021-06-11 18:41:12',
      ticker: 'GOOGL',
      operation: 'buy',
      price: 10.65,
      currency: 'sell',
      quantity: 10,
      commission: 1.73,
    },
  ],
  APPL: [
    {
      date: '2021-06-10 18:41:12',
      ticker: 'APPL',
      operation: 'buy',
      price: 10.65,
      currency: 'USD',
      quantity: 10,
      commission: 1.73,
    },
  ],
};

export const groupedDealsToBeRejected = {
  APPL: [
    {
      date: '2022-06-10 18:41:12',
      ticker: 'APPL.US',
      operation: 'sell',
      price: 11.65,
      currency: 'USD',
      quantity: 10,
      commission: 1.73,
    },
  ],
};
