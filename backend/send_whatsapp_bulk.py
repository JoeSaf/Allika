#!/usr/bin/env python3
"""
Bulk WhatsApp Sender using Selenium

Requirements:
- Python 3.x
- selenium
- chromedriver (in PATH)
- Google Chrome installed
- Usage: python3 send_whatsapp_bulk.py guests.json
  where guests.json = [{"phone": "+255123456789", "message": "Hello ..."}, ...]

This script opens WhatsApp Web once, waits for login, and sends each unique message to each phone number.
"""
import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException, TimeoutException

if len(sys.argv) < 2:
    print("Usage: python3 send_whatsapp_bulk.py guests.json")
    sys.exit(1)

json_path = sys.argv[1]
with open(json_path, 'r') as f:
    guests = json.load(f)

chrome_options = Options()
chrome_options.add_argument('--user-data-dir=./chrome_whatsapp_profile')  # Persist session
chrome_options.add_argument('--profile-directory=Default')
chrome_options.add_argument('--start-maximized')

print("Launching Chrome...")
driver = webdriver.Chrome(options=chrome_options)
driver.get('https://web.whatsapp.com')

# Wait for WhatsApp Web to load
print("Please scan the QR code (if needed) and wait for WhatsApp Web to load...")
while True:
    try:
        driver.find_element(By.CSS_SELECTOR, 'canvas[aria-label="Scan me!"]')
        time.sleep(2)
    except NoSuchElementException:
        break  # QR code gone, probably logged in
    except Exception:
        break

# Wait for main UI
while True:
    try:
        driver.find_element(By.CSS_SELECTOR, 'div[tabindex="-1"]')
        break
    except NoSuchElementException:
        time.sleep(2)

print(f"Sending {len(guests)} messages...")
for idx, guest in enumerate(guests):
    phone = guest['phone']
    message = guest['message']
    print(f"[{idx+1}/{len(guests)}] Sending to {phone}...")
    try:
        # Open chat with phone number
        url = f'https://web.whatsapp.com/send?phone={phone}&text={message}'
        driver.get(url)
        # Wait for chat box
        for _ in range(30):
            try:
                input_box = driver.find_element(By.XPATH, '//div[@contenteditable="true"][@data-tab="10"]')
                break
            except NoSuchElementException:
                time.sleep(1)
        else:
            print(f"  [!] Could not find input box for {phone}")
            continue
        # Sometimes the message is prefilled, sometimes not. Click and send Enter.
        input_box.send_keys(Keys.ENTER)
        print(f"  [✓] Sent to {phone}")
        time.sleep(3)  # Wait a bit before next message
    except Exception as e:
        print(f"  [!] Failed to send to {phone}: {e}")
        continue

print("Done. You may close the browser.")
driver.quit() 