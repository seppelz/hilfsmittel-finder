#!/usr/bin/env node

/**
 * Fetch all products from GKV API and save to public/products.json
 * This script is run by GitHub Actions weekly to keep the cache fresh
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use deployed Vercel proxy to bypass CORS/IP restrictions
// Format: https://your-app.vercel.app/api/proxy?path=api/verzeichnis/Produkt
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'https://hilfsmittel-finder.vercel.app';
const USE_PROXY = process.env.USE_PROXY !== 'false'; // Default to true

function buildProxyUrl(apiPath) {
  if (!USE_PROXY) {
    return `https://hilfsmittel.gkv-spitzenverband.de/api/verzeichnis/${apiPath}`;
  }
  const encodedPath = encodeURIComponent(`api/verzeichnis/${apiPath}`);
  return `${VERCEL_APP_URL}/api/proxy?path=${encodedPath}`;
}

// Fetch with retry logic
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Fetching ${url}`);
      const data = await fetchData(url);
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1} failed, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Fetch data from GKV API (supports both http and https)
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      console.log(`📡 HTTP Status: ${res.statusCode}`);
      console.log(`📡 Headers:`, JSON.stringify(res.headers, null, 2));
      
      // Check for redirect or error status
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response size: ${data.length} bytes`);
        console.log(`📊 First 200 chars: ${data.substring(0, 200)}`);
        
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          console.error('❌ JSON Parse Error:', error.message);
          console.error('❌ Response preview:', data.substring(0, 500));
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.error('❌ Network Error:', error);
      reject(error);
    });
  });
}

async function fetchAllProducts() {
  console.log('🚀 Starting product fetch from GKV API...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  const startTime = Date.now();
  
  try {
    // Fetch all products via proxy (to bypass IP restrictions)
    const url = buildProxyUrl('Produkt');
    console.log(`📡 Fetching from: ${url}`);
    console.log(`📡 Using proxy: ${USE_PROXY}`);
    
    const data = await fetchWithRetry(url);
    
    // Debug: Log the response structure
    console.log('📋 Response type:', typeof data);
    console.log('📋 Is array:', Array.isArray(data));
    if (data && typeof data === 'object') {
      console.log('📋 Response keys:', Object.keys(data).slice(0, 10));
    }
    
    // Extract products array
    const products = Array.isArray(data) ? data : data.value || [];
    
    if (!products || products.length === 0) {
      throw new Error(`No products found in response! Response: ${JSON.stringify(data).substring(0, 200)}`);
    }
    
    console.log(`✅ Fetched ${products.length} products`);
    
    // Calculate metadata
    const metadata = {
      totalProducts: products.length,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      source: 'GKV-Spitzenverband API',
      fetchDurationMs: Date.now() - startTime,
    };
    
    // Prepare final data structure
    const output = {
      metadata,
      products,
    };
    
    // Write to public folder
    const outputPath = join(__dirname, '..', 'public', 'products.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(`⏱️  Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);
    console.log(`📊 Metadata:`, metadata);
    console.log('✨ Done!');
    
    return metadata;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllProducts();
}

export { fetchAllProducts };

