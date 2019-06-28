/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/
import { Server } from 'hapi';
import * as request from 'request';
const catbox = require('catbox-memory')


const getStocks = async (req, cb) => {
  const { symbol, range } = req.params;
  await request.get(`https://cloud.iexapis.com/beta/stock/${symbol}/chart/${range}?token=${req.url.searchParams.get('token')}`, (error, response, body) => {
    if(error) {
      cb(error)
    } else {
      cb(body)
    }
  })
}

const init = async () => {
  const server = new Server({
    port: 3333,
    host: 'localhost',
    routes: { cors: true },
    cache: {
      engine: new catbox()
    }
  });



  server.method('stocks', getStocks)

  server.route({
    method: 'GET',
    path: '/stocks/{symbol}/{range}',
    handler: async (req, h) => {
      return new Promise(async (res, rej) => {
        await server.methods.stocks(req, (data) => {
          if(data) {
            res(data);
          } else {
            res('rejected');
          }
        })
      });
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();
