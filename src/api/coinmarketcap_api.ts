import axios from 'axios';
import Logger from "../util/logger";
import {TransactionDetails} from "./models";
import moment from "moment";

const L = new Logger('CmcApi')

/*axios.interceptors.request.use(request => {
  L.i(`Starting Request - ${JSON.stringify(request, null, 2)}`)
  return request
})

axios.interceptors.response.use(response => {
  console.log('Response:', JSON.stringify(response, null, 2))
  return response
})*/

export const getSymbolRateLatest = async (symbol: string): Promise<number> => {
  L.i(`getSymbolRateLatest - ${symbol}`)
  const response = await get('v2/cryptocurrency/quotes/latest', {
    symbol: symbol,
  })
  return response.data.data[symbol][0].quote.USD.price
}

export const getSymbolRateHistorical = async (symbol: string, date: Date): Promise<TransactionDetails> => {
  const response = await get('v2/cryptocurrency/quotes/historical', {
    symbol: symbol,
    time_start: moment(date).valueOf(),
    time_end: moment(date).add(5, 'minutes'),
  })
  return response.data
}


// ----------

const get = async (endpoint: string, params?: any): Promise<any> => {
  return await axios.get(`${apiHost()}/${endpoint}`, {
    params: {
      ...params,
      CMC_PRO_API_KEY: process.env.COINMARKETCAP_API_KEY,
    }
  })
}

const post = async (endpoint: string, params?: any): Promise<any> => {
  //return await axios.create().post(`${apiHost()}/${endpoint}`, params)
}

const apiHost = () => {
  return process.env.COINMARKETCAP_API_URL
}

