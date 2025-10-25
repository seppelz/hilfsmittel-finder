#!/usr/bin/env node

/**
 * Analyze konstruktionsmerkmale fields across Gehhilfen subcategories
 * This script fetches product details and identifies common fields for each subcategory
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use deployed Vercel proxy to bypass CORS/IP restrictions
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'https://hilfsmittel-finder.vercel.app';
const USE_PROXY = process.env.USE_PROXY !== 'false';

function buildProxyUrl(apiPath) {
  if (!USE_PROXY) {
    return `https://hilfsmittel.gkv-spitzenverband.de/api/verzeichnis/${apiPath}`;
  }
  const encodedPath = encodeURIComponent(`api/verzeichnis/${apiPath}`);
  return `${VERCEL_APP_URL}/api/proxy?path=${encodedPath}`;
}

// Fetch data from URL
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch product details with retry
async function fetchProductDetails(productId, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const url = buildProxyUrl(`Produkt/${productId}`);
      return await fetchData(url);
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Define Gehhilfen subcategories with their prefixes
const subcategories = {
  'Gehstock': ['10.50'],
  'Unterarmgehstützen': ['10.46.02'],
  'Rollator': ['10.46.04', '10.46.03'],
  'Gehgestell': ['10.46.01'],
  'Gehwagen': ['10.46.05', '10.46.06']
};

async function analyzeSubcategory(name, prefixes, allProducts) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analyzing: ${name}`);
  console.log('='.repeat(60));
  
  // Filter products by prefix (using zehnSteller field)
  const subcategoryProducts = allProducts.filter(p => 
    prefixes.some(prefix => p.zehnSteller?.startsWith(prefix))
  );
  
  console.log(`Found ${subcategoryProducts.length} products`);
  
  if (subcategoryProducts.length === 0) {
    return { fields: [], totalProducts: 0 };
  }
  
  // Sample up to 50 products for analysis (to avoid overwhelming API)
  const sampleSize = Math.min(50, subcategoryProducts.length);
  const sampledProducts = subcategoryProducts.slice(0, sampleSize);
  
  console.log(`Analyzing ${sampledProducts.length} products (sample)`);
  
  const fieldFrequency = {};
  const fieldExamples = {};
  let processedCount = 0;
  
  // Fetch details for sampled products in batches
  const batchSize = 5;
  for (let i = 0; i < sampledProducts.length; i += batchSize) {
    const batch = sampledProducts.slice(i, i + batchSize);
    
    const promises = batch.map(async (product) => {
      try {
        const details = await fetchProductDetails(product.produktartId);
        return { product, details };
      } catch (error) {
        console.error(`  ⚠️  Failed to fetch ${product.zehnSteller}: ${error.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    
    // Process results
    for (const result of results) {
      if (!result) continue;
      
      const { product, details } = result;
      const konstruktionsmerkmale = details.konstruktionsmerkmale || [];
      
      for (const merkmal of konstruktionsmerkmale) {
        const label = merkmal.label;
        if (!label || label === 'Freitext') continue;
        
        fieldFrequency[label] = (fieldFrequency[label] || 0) + 1;
        
        // Store first example
        if (!fieldExamples[label]) {
          fieldExamples[label] = {
            value: merkmal.value,
            productCode: product.zehnSteller
          };
        }
      }
      
      processedCount++;
    }
    
    console.log(`  Progress: ${processedCount}/${sampledProducts.length} products processed`);
    
    // Small delay between batches
    if (i + batchSize < sampledProducts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Calculate percentages and sort by frequency
  const sortedFields = Object.entries(fieldFrequency)
    .map(([label, count]) => ({
      label,
      count,
      percentage: (count / processedCount * 100).toFixed(1),
      example: fieldExamples[label].value,
      productCode: fieldExamples[label].productCode
    }))
    .sort((a, b) => b.count - a.count);
  
  console.log(`\n📊 Common Fields (>20% of products):\n`);
  const commonFields = sortedFields.filter(f => parseFloat(f.percentage) > 20);
  
  if (commonFields.length === 0) {
    console.log('  No common fields found (>20% threshold)');
  } else {
    commonFields.forEach(f => {
      console.log(`  ✓ ${f.label}: ${f.percentage}% (${f.count}/${processedCount} products)`);
      const examplePreview = f.example.substring(0, 60);
      console.log(`    Example: ${examplePreview}${f.example.length > 60 ? '...' : ''}`);
      console.log(`    From: ${f.productCode}\n`);
    });
  }
  
  return {
    fields: sortedFields,
    totalProducts: subcategoryProducts.length,
    analyzedProducts: processedCount
  };
}

async function main() {
  console.log('🚀 Starting Gehhilfen Subcategory Field Analysis');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('');
  
  const startTime = Date.now();
  
  // Load products.json
  console.log('📂 Loading products.json...');
  const productsPath = join(__dirname, '..', 'public', 'products.json');
  const data = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  const allProducts = data.products;
  console.log(`✓ Loaded ${allProducts.length} products\n`);
  
  // Run analysis for each subcategory
  const results = {};
  
  for (const [name, prefixes] of Object.entries(subcategories)) {
    try {
      results[name] = await analyzeSubcategory(name, prefixes, allProducts);
    } catch (error) {
      console.error(`\n❌ Error analyzing ${name}:`, error.message);
      results[name] = { error: error.message, fields: [] };
    }
  }
  
  // Save results to file
  const outputPath = join(__dirname, 'subcategory-fields-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis Complete!');
  console.log('='.repeat(60));
  console.log(`📁 Results saved to: ${outputPath}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log('');
  
  // Print summary
  console.log('📋 Summary:');
  for (const [name, data] of Object.entries(results)) {
    const commonFields = data.fields?.filter(f => parseFloat(f.percentage) > 20).length || 0;
    console.log(`  ${name}: ${commonFields} common fields (from ${data.analyzedProducts || 0} analyzed)`);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

