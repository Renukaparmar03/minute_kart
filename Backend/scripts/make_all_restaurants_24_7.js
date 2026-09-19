import { connectDB, disconnectDB } from '../src/config/db.js';
import { FoodRestaurant } from '../src/modules/food/restaurant/models/restaurant.model.js';
import { FoodRestaurantOutletTimings } from '../src/modules/food/restaurant/models/outletTimings.model.js';

const makeRestaurants24x7 = async () => {
  try {
    console.log('Connecting to DB...');
    await connectDB();
    console.log('Connected to DB.');

    // 1. Update all restaurants
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    console.log('Updating FoodRestaurant collection...');
    const result = await FoodRestaurant.updateMany(
      {}, // filter: all restaurants
      {
        $set: {
          isAcceptingOrders: true,
          openingTime: "00:00",
          closingTime: "23:59",
          openDays: days,
          status: "approved" // Making sure they are approved as well
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} restaurants in FoodRestaurant collection.`);

    // 2. Upsert Outlet Timings for all restaurants
    console.log('Fetching all restaurant IDs...');
    const restaurants = await FoodRestaurant.find({}, '_id').lean();
    
    console.log('Updating Outlet Timings...');
    let timingsUpdated = 0;
    for (const restaurant of restaurants) {
      const timings = days.map(day => ({
        day,
        isOpen: true,
        openingTime: "00:00",
        closingTime: "23:59"
      }));

      await FoodRestaurantOutletTimings.updateOne(
        { restaurantId: restaurant._id },
        { $set: { timings } },
        { upsert: true }
      );
      timingsUpdated++;
    }
    console.log(`Updated/Upserted outlet timings for ${timingsUpdated} restaurants.`);

    console.log('Successfully made all restaurants 24*7 online.');
  } catch (error) {
    console.error('Error making restaurants 24x7:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

makeRestaurants24x7();
