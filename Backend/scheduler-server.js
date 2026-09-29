import { connectDB, disconnectDB } from './src/config/db.js';
import { validateConfig } from './src/config/validateEnv.js';
import { logger } from './src/utils/logger.js';
import { expireExpiredOffers } from './src/modules/food/admin/services/admin.service.js';
import { syncExpiredFssaiNotifications } from './src/modules/food/restaurant/services/fssaiExpiry.service.js';
import { initMilkPlanCron } from './src/modules/dudhwala/jobs/milkPlan.job.js';

let expireOffersInterval = null;
let fssaiExpiryInterval = null;

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown of Scheduler server`);
    try {
        if (expireOffersInterval) clearInterval(expireOffersInterval);
        if (fssaiExpiryInterval) clearInterval(fssaiExpiryInterval);
        await disconnectDB();
        logger.info('Graceful shutdown of Scheduler server complete');
        process.exit(0);
    } catch (err) {
        logger.error(`Shutdown error: ${err.message}`);
        process.exit(1);
    }
};

const startSchedulerServer = async () => {
    try {
        validateConfig();
        
        // Connect to Database
        await connectDB();
        
        logger.info('Scheduler Server started successfully');

        // 1. Expire Offers Scheduler
        const runExpire = async () => {
            try {
                logger.info('Running expireExpiredOffers job...');
                await expireExpiredOffers();
            } catch (err) {
                logger.error(`Expire offers error: ${err.message}`);
            }
        };
        runExpire();
        expireOffersInterval = setInterval(runExpire, 5 * 60 * 1000);

        // 2. FSSAI Expiry Sync Scheduler
        const runFssaiExpirySync = async () => {
            try {
                logger.info('Running syncExpiredFssaiNotifications job...');
                await syncExpiredFssaiNotifications();
            } catch (err) {
                logger.error(`FSSAI expiry sync error: ${err.message}`);
            }
        };
        runFssaiExpirySync();
        fssaiExpiryInterval = setInterval(runFssaiExpirySync, 60 * 60 * 1000);

        // 3. Milk Subscription Automation
        initMilkPlanCron();

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

        process.on('unhandledRejection', (err) => {
            logger.error(`Unhandled Rejection in Scheduler Server: ${err?.message || err}`);
        });

        process.on('uncaughtException', (err) => {
            logger.error(`Uncaught Exception in Scheduler Server: ${err?.message || err}`);
            process.exit(1);
        });

    } catch (error) {
        logger.error(`Error starting scheduler server: ${error.message}`);
        process.exit(1);
    }
};

startSchedulerServer();
