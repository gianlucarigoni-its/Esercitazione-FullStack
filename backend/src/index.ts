import mongoose from 'mongoose';
import { createServer } from 'node:http';
import 'reflect-metadata';
import app from './app';

const server = createServer(app);

mongoose.set('debug', true);
mongoose
  .connect('mongodb://localhost:27017/simulazione_01')
  .then(() => {
    server.listen(3000, () => {
      console.log(`server listening on port 3000`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
