import express from "express";
import cors from 'cors'
import * as dotenv from 'dotenv'
import {Express} from "express";
import Logger from "./util/logger";
import {version} from "./config/constants";
import MainController from "./controllers/main_controller";

dotenv.config()

const L = new Logger('Index');

const mainController = new MainController()

//mainController.getRevenue(process.env.TEST_TX_HASH)

const app: Express = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.listen(process.env.SERVER_PORT, () => L.i(`Server running on port ${process.env.SERVER_PORT}`));

const handleErrorAsync = func => async (req, res, next) => {
  try {
    L.i(`get ${req.path}`)
    await func(req, res, next);
  } catch (e) {
    L.e(`${req.path} - error: ${e.stack}`)
    res.status(500).send(e.message)
  }
};

app.get('/', async (req, res) => {
  L.i(`get /`)
  await res.json({
    name: 'Multifarm API',
    version: version,
  })
})

app.get('/revenue', handleErrorAsync(async (req, res) => {
  const {txHash} = req.query as any

  if (!txHash) {
    throw new Error('txHash parameter is missing')
  }

  const result = await mainController.getRevenue(txHash)
  await res.json(result)
}))

