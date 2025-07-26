import express from 'express';
import { getPool } from '../config/database.js';
import puppeteer from 'puppeteer';

const router = express.Router();

// GET /api/invitation/:tokenOrAlias/image - Generate invitation card image
router.get('/:tokenOrAlias/image', async (req, res) => {
  try {
    const { tokenOrAlias } = req.params;
    
    // Use Puppeteer to screenshot the real React print route
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const url = `${frontendUrl}/invitation/${tokenOrAlias}?print=1`;
    const browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true
    });
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Add some debugging
    const pageContent = await page.content();
    console.log('Page loaded, content length:', pageContent.length);
    
    // Check if the page has any errors
    const errors = await page.evaluate(() => {
      return window.console && window.console.error ? window.console.error : [];
    });
    if (errors.length > 0) {
      console.log('Page errors:', errors);
    }
    // Wait for the card to render - use more specific selector
    try {
      await page.waitForSelector('[data-invitation-card]', { timeout: 30000 });
    } catch (selectorError) {
      console.error('Selector timeout error:', selectorError);
      
      // Debug: Check what elements are actually on the page
      const elements = await page.evaluate(() => {
        const cards = document.querySelectorAll('.card');
        const dataCards = document.querySelectorAll('[data-invitation-card]');
        const allElements = document.querySelectorAll('*');
        
        return {
          cardCount: cards.length,
          dataCardCount: dataCards.length,
          totalElements: allElements.length,
          bodyText: document.body.textContent.substring(0, 500),
          html: document.documentElement.outerHTML.substring(0, 1000)
        };
      });
      
      console.log('Page elements debug:', elements);
      
      // Try alternative selectors
      try {
        await page.waitForSelector('.card', { timeout: 10000 });
      } catch (fallbackError) {
        console.error('Fallback selector also failed:', fallbackError);
        throw new Error('No invitation card found on page');
      }
    }
    
    // Hide any navigation or other UI elements that might interfere
    await page.evaluate(() => {
      // Hide header/navigation elements
      const elementsToHide = [
        'header',
        'nav',
        '.header',
        '.navigation',
        '.navbar',
        '.nav',
        '[role="navigation"]',
        '.menu',
        '.sidebar'
      ];
      
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
        });
      });
      
      // Ensure the invitation card is visible and properly positioned
      const card = document.querySelector('[data-invitation-card]');
      if (card) {
        card.style.display = 'block';
        card.style.visibility = 'visible';
        card.style.position = 'relative';
        card.style.zIndex = '1000';
      }
    });
    
    // Screenshot only the invitation card element with precise boundaries
    let imageBuffer;
    try {
      // Wait for the invitation card to be fully rendered
      await page.waitForFunction(() => {
        const card = document.querySelector('[data-invitation-card]');
        return card && card.offsetHeight > 0;
      }, { timeout: 10000 });
      
      // Get the invitation card element
      const cardElement = await page.$('[data-invitation-card]');
      if (cardElement) {
        // Get the exact bounding box of the card
        const boundingBox = await cardElement.boundingBox();
        
        // Screenshot exactly the card boundaries (no padding)
        imageBuffer = await page.screenshot({
          type: 'png',
          clip: {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height
          }
        });
      } else {
        // Fallback: try to find any card element
        const fallbackElement = await page.$('.card');
        if (fallbackElement) {
          const boundingBox = await fallbackElement.boundingBox();
          imageBuffer = await page.screenshot({
            type: 'png',
            clip: {
              x: boundingBox.x,
              y: boundingBox.y,
              width: boundingBox.width,
              height: boundingBox.height
            }
          });
        } else {
          throw new Error('No invitation card found');
        }
      }
    } catch (screenshotError) {
      console.error('Screenshot error:', screenshotError);
      throw new Error('Failed to capture invitation card');
    }
    await browser.close();
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating invitation image:', error);
    res.status(500).json({ error: true, message: 'Error generating invitation image' });
  }
});

export default router; 