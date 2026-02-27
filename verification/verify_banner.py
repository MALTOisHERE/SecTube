from playwright.sync_api import sync_playwright

def verify_dev_banner():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Go to the app
        page.goto("http://localhost:5173")

        # Wait for the banner to be visible (it has a delay)
        # The banner contains "Platform Status: Development Mode"
        try:
            # Increase timeout because there is a 500ms delay for 'entering' -> 'visible'
            # and potentially some load time
            locator = page.get_by_text("Platform Status: Development Mode")
            locator.wait_for(state="visible", timeout=5000)
            print("Banner found and visible")

            # Take a screenshot
            page.screenshot(path="verification/dev_banner.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error verifying banner: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    verify_dev_banner()
