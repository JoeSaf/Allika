import express from 'express';
import { getPool } from '../config/database.js';
import puppeteer from 'puppeteer';
import { cacheInvitationImage, getCachedInvitationImage, generateInvitationCacheKey, cleanupImageCache } from '../utils/helpers.js';

const router = express.Router();

// GET /api/invitation/:tokenOrAlias/image - Generate invitation card image
router.get('/:tokenOrAlias/image', async (req, res) => {
  try {
    const { tokenOrAlias } = req.params;
    
    // Check cache first
    const cacheKey = generateInvitationCacheKey(tokenOrAlias);
    const cachedImage = getCachedInvitationImage(cacheKey);
    if (cachedImage) {
      res.set('Content-Type', 'image/png');
      res.set('X-Cache', 'HIT');
      return res.send(cachedImage);
    }
    
    // Use Puppeteer to screenshot the real React print route
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const url = `${frontendUrl}/invitation/${tokenOrAlias}?print=1`;
    
    // Optimized Puppeteer configuration
    const browser = await puppeteer.launch({ 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Set viewport for optimal rendering
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    
    // Optimize page loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Block unnecessary resources for faster loading
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    // Wait for the card to render with better error handling
    let cardElement;
    try {
      await page.waitForSelector('[data-invitation-card]', { timeout: 10000 });
      cardElement = await page.$('[data-invitation-card]');
    } catch (selectorError) {
      // Try alternative selectors
      try {
        await page.waitForSelector('.card', { timeout: 5000 });
        cardElement = await page.$('.card');
      } catch (fallbackError) {
        throw new Error('No invitation card found on page');
      }
    }
    
    if (!cardElement) {
      throw new Error('No invitation card found');
    }
    
    // Hide navigation elements for cleaner screenshot
    await page.evaluate(() => {
      const elementsToHide = [
        'header', 'nav', '.header', '.navigation', '.navbar', 
        '.nav', '[role="navigation"]', '.menu', '.sidebar'
      ];
      
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
        });
      });
      
      // Ensure the invitation card is visible
      const card = document.querySelector('[data-invitation-card]') || document.querySelector('.card');
      if (card) {
        card.style.display = 'block';
        card.style.visibility = 'visible';
        card.style.position = 'relative';
        card.style.zIndex = '1000';
      }
    });
    
    // Wait for the card to be fully rendered
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-invitation-card]') || document.querySelector('.card');
      return card && card.offsetHeight > 0;
    }, { timeout: 5000 });
    
    // Screenshot the card with precise boundaries
    const boundingBox = await cardElement.boundingBox();
    const imageBuffer = await page.screenshot({
      type: 'png',
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height
      },
      omitBackground: false
    });
    
    await browser.close();
    
    // Cache the generated image
    cacheInvitationImage(cacheKey, imageBuffer);
    
    res.set('Content-Type', 'image/png');
    res.set('X-Cache', 'MISS');
    res.send(imageBuffer);
    
  } catch (error) {
    // console.error('Error generating invitation image:', error);
    res.status(500).json({ error: true, message: 'Error generating invitation image' });
  }
});

export default router; 