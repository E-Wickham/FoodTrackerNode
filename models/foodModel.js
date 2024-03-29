const pool = require('./db');

//get all the stores in the db
async function getAllStores() {
    const [rows] = await pool.query('SELECT * FROM store');
    return rows;
}
//get store data based on its ID  
async function getStoreByID(id) {
    const [rows] = await pool.query('SELECT * FROM store where storeId = ?', [id]);
    return rows;
}
// get every single food item
async function getAllFood() {
    const [rows] = await pool.query('SELECT * FROM food');
    return rows;
}
//get the last 100 prices from a store
async function getStorePrices(id) {
    const [rows] = await pool.query('SELECT * FROM price p join food f on p.foodID = f.foodID where storeID = ? order by priceDate desc LIMIT 100', [id]);
    return rows;
}
// get the price of an individual item by store ID
async function getStorePriceByName(id,foodname) {
    //const [rows] = await pool.query('SELECT * FROM price p join food f on p.foodID = f.foodID where storeID = ? and f.foodname like ? order by priceDate desc, priceListing asc', [id, `%${foodname}%`]);
    const [rows] = await pool.query('SELECT * FROM price p join food f on p.foodID = f.foodID where storeID = ? and f.foodname like ? order by priceDate desc, priceListing asc', [id, `%${foodname}%`]);
    return rows;
}
//get the price history of a specific item
async function getPriceHistory(storeID,foodID) {
    const [rows] = await pool.query(`SELECT * FROM price p 
                                    join food f on p.foodID = f.foodID 
                                    join store s on p.storeID = s.storeID
                                    where p.storeID = ? and f.foodID like ? order by priceDate asc`, [storeID, foodID]);
                                    //where f.foodID like ? order by priceDate asc, p.storeID`, [foodID]);

    return rows;
}
async function getPriceCompare(id,foodname) {
    let query = `select f.foodName, p.priceByWeight, p.priceMetric, p.storeID, s.storeName, c.companyName, 
                 match(f.foodName) against(?) as score from foodScraper.price p 
                 left join foodScraper.food f on p.foodID = f.foodID 
                 left join foodscraper.store s on p.storeID = s.storeID 
                 left join foodscraper.company c on c.companyID = s.companyID 
                 where p.storeID != ? 
                 order by score desc, p.priceByWeight
                 limit 100`
    const [rows] = await pool.query(query, [foodname, id]);
    return rows;
}
// get prices of food items under a specific category
async function getLatestPriceByCat(storeid,foodCatID) {
    let query = `select f.foodID, f.foodName, p.storeID, f.foodBrandName, p.priceListing, p.priceByWeight, p.priceMetric, p.priceWeight, p.priceLink, p.priceDate, fc.fcatName from price p  
                join food f on f.foodID = p.foodID
                join food_fcat ff on
                ff.foodID = f.foodID 
                join fcat fc on
                fc.fcatID = ff.fcatID 
                where DATE_SUB(CURDATE(),INTERVAL 14 DAY) <= p.priceDate and
                p.storeID = ? and fc.fcatID = ?
                group by f.foodID, f.foodName, p.storeID, f.foodBrandName, p.priceListing, p.priceByWeight, p.priceMetric, p.priceWeight, fc.fcatName, p.priceLink, p.priceDate
                order by p.priceByWeight, priceDate desc`
                const [rows] = await pool.query(query, [storeid, foodCatID]);
    return rows;
}

// get all the food items that have the same foodID but are not from the same store
        // limitation to this is that it doesn't compare similarly named items. it also shows old items 
async function getSimilarFoods(foodID,storeID) {
    let query = `select p.foodID, p.storeID, p.priceListing, p.priceByWeight, p.priceWeight, p.priceMetric,
                max(p.priceDate) as priceDate, f.foodName, s.storeName, s.storeAddress, c.companyName from price p
                join food f on f.foodID = p.foodID
                join store s on p.storeID = s.storeID
                join company c on s.companyID = c.companyID
                where p.foodID = ? and p.storeID <> ?
                group by p.foodID, p.storeID, p.priceListing, p.priceByWeight, f.foodName, p.priceWeight, p.priceMetric
                order by priceDate desc, p.priceByWeight`
    const [rows] = await pool.query(query, [foodID,storeID]);
    return rows;
}

async function getStoreCatList(storeID) {
    let query = `select distinct fc.fcatName, fc.fcatID from fcat fc
                join food_fcat f_c on fc.fcatID = f_c.fcatID 
                join food f on f.foodID = f_c.foodID
                join price p on p.foodID = f.foodID
                where p.priceDate > '01/01/2024' and p.storeID = ?`
    const [rows] = await pool.query(query, [storeID]);
    return rows;
}

module.exports = {
    getAllStores, 
    getAllFood,
    getStorePrices,
    getStoreByID,
    getStorePriceByName,
    getPriceCompare,
    getPriceHistory,
    getLatestPriceByCat,
    getSimilarFoods,
    getStoreCatList,
}