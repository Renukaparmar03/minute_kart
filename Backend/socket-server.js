import http from 'http';
import { config } from './src/config/env.js';
import { validateConfig } from './src/config/validateEnv.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { connectRedis, closeRedis } from './src/config/redis.js';
import { initSocket } from './src/config/socket.js';
import { logger } from './src/utils/logger.js';
import { initializeFirebaseRealtime } from './src/config/firebase.js';
import { startUnassignedOrdersBroadcasterLoop } from './src/modules/food/orders/services/order.service.js';

let server = null;

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown of Socket server`);
    if (!server) {
        process.exit(0);
        return;
    }
    server.close(async () => {
        try {
            await disconnectDB();
            await closeRedis();
            logger.info('Graceful shutdown of Socket server complete');
            process.exit(0);
        } catch (err) {
            logger.error(`Shutdown error: ${err.message}`);
            process.exit(1);
        }
    });
    setTimeout(() => {
        logger.error('Shutdown timeout, forcing exit');
        process.exit(1);
    }, 10000);
};

const startSocketServer = async () => {
    try {
        validateConfig();
        initializeFirebaseRealtime();

        // Connect to Database
        await connectDB();

        if (config.redisEnabled) {
            await connectRedis();
        }

        // Create a standalone HTTP server just for Socket.IO
        const httpServer = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('Socket Server is running\n');
        });

        // Initialize Socket.IO
        await initSocket(httpServer);
        startUnassignedOrdersBroadcasterLoop();

        server = httpServer.listen(config.socketPort, config.host, () => {
            logger.info(`Socket server running in ${config.nodeEnv} mode on ${config.host}:${config.socketPort}`);
            console.log(`🔌 [SOCKET] ws://localhost:${config.socketPort}`);
        });

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Handle nodemon restart

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger.error(`Port ${config.socketPort} is already in use by another process.`);
            } else {
                logger.error(`Socket Server Error: ${err.message}`);
            }
            process.exit(1);
        });

        process.on('unhandledRejection', (err) => {
            logger.error(`Unhandled Rejection in Socket Server: ${err?.message || err}`);
            if (config.nodeEnv === 'production') {
                if (server) server.close(() => process.exit(1));
                else process.exit(1);
            }
        });

        process.on('uncaughtException', (err) => {
            logger.error(`Uncaught Exception in Socket Server: ${err?.message || err}`);
            if (config.nodeEnv === 'production') {
                process.exit(1);
            }
        });

    } catch (error) {
        logger.error(`Error starting socket server: ${error.message}`);
        process.exit(1);
    }
};

startSocketServer();
