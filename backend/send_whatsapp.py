import sys

try:
    import pywhatkit
except ImportError:
    print("pywhatkit is not installed. Please install it with 'pip install pywhatkit'.", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 send_whatsapp.py <phone> <message>", file=sys.stderr)
        sys.exit(1)
    phone = sys.argv[1]
    message = sys.argv[2]
    # Send instantly (wait_time=2 seconds, tab_close=True)
    pywhatkit.sendwhatmsg_instantly(phone, message, wait_time=2, tab_close=True)
    print("WhatsApp message sent successfully.") 