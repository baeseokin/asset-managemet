const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'assetuser',
  password: process.env.DB_PASSWORD || 'assetpass',
  database: process.env.DB_NAME || 'assetdb',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 32006
};

async function run() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [current] = await conn.query("SELECT * FROM assets WHERE id = 11");
    console.log('Current:', current[0]);
    
    // Simulate what the route does:
    const status = 'under_maintenance';
    const data = {
      asset_name: undefined || current[0].asset_name,
      category_name: undefined || current[0].category_name,
      serial_number: undefined !== undefined ? undefined : current[0].serial_number,
      item_code: undefined !== undefined ? undefined : current[0].item_code,
      purchase_date: undefined !== undefined ? (undefined || null) : current[0].purchase_date,
      purchase_price: undefined !== undefined ? null : current[0].purchase_price,
      purchase_source: undefined !== undefined ? undefined : current[0].purchase_source,
      receipt_image_url: undefined !== undefined ? undefined : current[0].receipt_image_url,
      useful_life_years: undefined !== undefined ? null : current[0].useful_life_years,
      is_consumable: undefined !== undefined ? 1 : current[0].is_consumable,
      stock_quantity: undefined !== undefined ? 0 : current[0].stock_quantity,
      location: undefined !== undefined ? undefined : current[0].location,
      dept_name: undefined !== undefined ? undefined : current[0].dept_name,
      manager_name: undefined !== undefined ? undefined : current[0].manager_name,
      manager_contact: undefined !== undefined ? undefined : current[0].manager_contact,
      image_url: undefined || current[0].image_url,
      manufacturer: undefined !== undefined ? undefined : current[0].manufacturer,
      description: undefined !== undefined ? undefined : current[0].description,
      status: status || current[0].status
    };
    
    console.log('Data to update:', data);

    const [res] = await conn.query(
      `UPDATE assets SET 
        asset_name = ?, category_name = ?, serial_number = ?, item_code = ?, purchase_date = ?, 
        purchase_price = ?, purchase_source = ?, receipt_image_url = ?, useful_life_years = ?, 
        is_consumable = ?, stock_quantity = ?, location = ?, dept_name = ?, manager_name = ?, 
        manager_contact = ?, image_url = ?, manufacturer = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        data.asset_name, data.category_name, data.serial_number, data.item_code, data.purchase_date,
        data.purchase_price, data.purchase_source, data.receipt_image_url, data.useful_life_years,
        data.is_consumable, data.stock_quantity, data.location, data.dept_name, data.manager_name,
        data.manager_contact, data.image_url, data.manufacturer, data.description, data.status, 11
      ]
    );
    console.log('Update result:', res);
    
    const [after] = await conn.query("SELECT id, status FROM assets WHERE id = 11");
    console.log('After:', after[0]);
    conn.end();
  } catch(e) {
    console.error(e);
  }
}
run();
