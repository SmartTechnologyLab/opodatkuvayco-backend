import { ICurrencyExchange } from './types/ICurrencyExchange';

export class CurrencyExchangeService {
  private UA_FORMAT = 'uk-UA';

  formatDateForCurrencyExchange = (date: string) => {
    const dateObj = new Date(date);

    const intl = new Intl.DateTimeFormat(this.UA_FORMAT, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);

    const formattedDate = intl.split('.').reverse().join('');

    return formattedDate;
  };

  async getCurrencyExchange(
    currency: string,
    date: string,
  ): Promise<ICurrencyExchange> {
    const formattedDate = this.formatDateForCurrencyExchange(date);

    try {
      const response = await fetch(
        `${process.env.NBU_API_URL}?valcode=${currency}&date=${formattedDate}&json`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Could not get the currency exchange rate');
      }

      return data.at(0);
    } catch (error) {
      throw new Error('Error while fetching currency exchange');
    }
  }
}
