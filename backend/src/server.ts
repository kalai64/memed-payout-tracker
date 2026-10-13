import mongoose from 'mongoose';
import { app } from './app';
import { config } from './config';
import { User } from './models/User';
import { Campaign } from './models/Campaign';
import { Submission } from './models/Submission';

async function start() {
  await mongoose.connect(config.MONGO_URI);
  // Fail early: payout transactions require Atlas or a local replica set.
  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid')
    throw new Error(
      'MongoDB must be a replica set. Use Atlas or the included Docker Compose setup.',
    );
  await Promise.all([User.init(), Campaign.init(), Submission.init()]);
  const server = app.listen(config.PORT, () =>
    console.log(`API listening on http://localhost:${config.PORT}`),
  );
  const shutdown = () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
start().catch((error) => {
  console.error(error);
  process.exit(1);
});
