// utils/db.js
// Placeholder for database connection and data storage logic

import { Pool } from 'pg'; // Assuming PostgreSQL/PostGIS

let pool;

export async function connectToDatabase() {
  if (pool) {
    return pool;
  }

  // Database connection details should come from environment variables in a real application
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set.');
    throw new Error('Database connection string is missing.');
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Adjust based on your database's SSL configuration
    },
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  console.log('Connected to PostgreSQL database.');
  return pool;
}

export async function saveWeatherData(data) {
  const client = await pool.connect();
  try {
    // Placeholder for actual INSERT statement
    const query = `
      INSERT INTO weather_snapshots (temperature, humidity, wind_speed, wind_direction, timestamp, geom)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))
      ON CONFLICT (timestamp, geom) DO NOTHING;
    `;
    // Assuming 'data' contains lat/lng for geom, and other weather parameters
    // This needs to be adapted based on the actual data structure from BOM API
    const values = [
      data.temperature,
      data.humidity,
      data.windSpeed,
      data.windDirection,
      data.timestamp,
      data.longitude, // Placeholder
      data.latitude,  // Placeholder
    ];
    await client.query(query, values);
    console.log('Weather data saved.');
  } catch (error) {
    console.error('Error saving weather data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function saveHotspotData(data) {
  const client = await pool.connect();
  try {
    // Placeholder for actual INSERT statement
    const query = `
      INSERT INTO hotspot_snapshots (latitude, longitude, brightness, confidence, timestamp, geom)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))
      ON CONFLICT (timestamp, geom) DO NOTHING;
    `;
    // Assuming 'data' contains latitude, longitude, brightness, confidence, timestamp
    const values = [
      data.latitude,
      data.longitude,
      data.brightness,
      data.confidence,
      data.timestamp,
      data.longitude,
      data.latitude,
    ];
    await client.query(query, values);
    console.log('Hotspot data saved.');
  } catch (error) {
    console.error('Error saving hotspot data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function saveFirePredictions(data) {
  const client = await pool.connect();
  try {
    // Save the job ID and timestamp
    const jobQuery = `
      INSERT INTO fire_prediction_jobs (job_id, timestamp)
      VALUES ($1, $2)
      ON CONFLICT (job_id) DO UPDATE SET timestamp = EXCLUDED.timestamp
      RETURNING id;
    `;
    const jobResult = await client.query(jobQuery, [data.jobId, data.timestamp]);
    const jobIdPk = jobResult.rows[0].id;

    // Save each prediction polygon
    for (const prediction of data.predictions) {
      for (const feature of prediction.geojson.features) {
        const query = `
          INSERT INTO fire_prediction_polygons (job_id_fk, time_step, geom, properties)
          VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4);
        `;
        const values = [
          jobIdPk,
          prediction.time,
          JSON.stringify(feature.geometry),
          feature.properties,
        ];
        await client.query(query, values);
      }
    }
    console.log(`Fire predictions for job ${data.jobId} saved.`);
  } catch (error) {
    console.error('Error saving fire predictions:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getFirePredictionsByJobId(jobId) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        fpj.job_id,
        fpj.timestamp,
        fpp.time_step,
        ST_AsGeoJSON(fpp.geom) as geom_geojson,
        fpp.properties
      FROM fire_prediction_jobs fpj
      JOIN fire_prediction_polygons fpp ON fpj.id = fpp.job_id_fk
      WHERE fpj.job_id = $1
      ORDER BY fpj.timestamp, fpp.time_step;
    `;
    const result = await client.query(query, [jobId]);

    if (result.rows.length === 0) {
      return null;
    }

    const predictionsMap = new Map();
    result.rows.forEach(row => {
      if (!predictionsMap.has(row.time_step)) {
        predictionsMap.set(row.time_step, {
          time: row.time_step,
          geojson: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }
      predictionsMap.get(row.time_step).geojson.features.push({
        type: 'Feature',
        geometry: JSON.parse(row.geom_geojson),
        properties: row.properties,
      });
    });

    return {
      jobId: result.rows[0].job_id,
      timestamp: result.rows[0].timestamp,
      predictions: Array.from(predictionsMap.values()),
    };

  } catch (error) {
    console.error(`Error fetching fire predictions for job ${jobId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getGeoData(type) {
  const client = await pool.connect();
  try {
    let tableName;
    let selectColumns = 'ST_AsGeoJSON(geom) as geom_geojson, properties';
    let idColumn = 'id';

    switch (type) {
      case 'population':
        tableName = 'population_grid';
        selectColumns = 'meshblock_id, population, ST_AsGeoJSON(geom) as geom_geojson, properties';
        idColumn = 'meshblock_id';
        break;
      case 'hospitals':
        tableName = 'hospitals';
        selectColumns = 'name, ST_AsGeoJSON(geom) as geom_geojson, properties';
        idColumn = 'name';
        break;
      case 'roads':
        tableName = 'roads';
        selectColumns = 'name, type, ST_AsGeoJSON(geom) as geom_geojson, properties';
        idColumn = 'name';
        break;
      case 'cadastral':
        tableName = 'cadastral_parcels';
        selectColumns = 'landgate_id, address, ST_AsGeoJSON(geom) as geom_geojson, properties';
        idColumn = 'landgate_id';
        break;
      default:
        throw new Error(`Unsupported geo data type: ${type}`);
    }

    const query = `SELECT ${selectColumns} FROM ${tableName};`;
    const result = await client.query(query);

    const features = result.rows.map(row => ({
      type: 'Feature',
      geometry: JSON.parse(row.geom_geojson),
      properties: { ...row.properties, id: row[idColumn] }, // Include relevant ID in properties
    }));

    return {
      type: 'FeatureCollection',
      features: features,
    };

  } catch (error) {
    console.error(`Error fetching geo data for type ${type}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Function to initialize database schema (e.g., create tables)
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS weather_snapshots (
        id SERIAL PRIMARY KEY,
        temperature NUMERIC,
        humidity NUMERIC,
        wind_speed NUMERIC,
        wind_direction TEXT,
        timestamp TIMESTAMPTZ NOT NULL,
        geom GEOMETRY(Point, 4326),
        UNIQUE (timestamp, geom)
      );

      CREATE TABLE IF NOT EXISTS hotspot_snapshots (
        id SERIAL PRIMARY KEY,
        latitude NUMERIC,
        longitude NUMERIC,
        brightness NUMERIC,
        confidence TEXT,
        timestamp TIMESTAMPTZ NOT NULL,
        geom GEOMETRY(Point, 4326),
        UNIQUE (timestamp, geom)
      );

      CREATE TABLE IF NOT EXISTS fire_prediction_jobs (
        id SERIAL PRIMARY KEY,
        job_id TEXT UNIQUE NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fire_prediction_polygons (
        id SERIAL PRIMARY KEY,
        job_id_fk INTEGER REFERENCES fire_prediction_jobs(id) ON DELETE CASCADE,
        time_step TEXT NOT NULL,
        geom GEOMETRY(Polygon, 4326),
        properties JSONB
      );

      -- Tables for Landgate, ABS, Hospitals, Roads
      CREATE TABLE IF NOT EXISTS cadastral_parcels (
        id SERIAL PRIMARY KEY,
        landgate_id TEXT UNIQUE,
        address TEXT,
        geom GEOMETRY(Polygon, 4326),
        properties JSONB
      );

      CREATE TABLE IF NOT EXISTS population_grid (
        id SERIAL PRIMARY KEY,
        meshblock_id TEXT UNIQUE,
        population INTEGER,
        geom GEOMETRY(Polygon, 4326),
        properties JSONB
      );

      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name TEXT,
        geom GEOMETRY(Point, 4326),
        properties JSONB
      );

      CREATE TABLE IF NOT EXISTS roads (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        geom GEOMETRY(LineString, 4326),
        properties JSONB
      );
    `);
    console.log('Database schema initialized.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}
