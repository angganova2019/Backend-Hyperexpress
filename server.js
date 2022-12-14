import { Server } from 'hyper-express';
import { migratedb } from './migrate.js';
import { api_router } from './routes.js';
const webserver = new Server();

webserver.use('/', api_router);

webserver.listen(3030)
    .then((socket) => console.log('Webserver started on port 3030'))
    .catch((error) => console.log('Failed to start webserver on port 3030'));