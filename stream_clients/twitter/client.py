import os
import subprocess

from selenium import webdriver
from selenium.webdriver import ActionChains, FirefoxProfile

config_path = os.path.dirname(__file__)

CLIENT_USERNAME = "tmuks1"
CLIENT_PASSWORD = "tobqu1-jowtew-niGfis"
EXTENSION_PATH = config_path + "/Injector/extension.xpi"

profile = FirefoxProfile()
profile.set_preference("permissions.default.desktop-notification", 1)
profile.set_preference("security.csp.enable", False)
profile.set_preference("security.OCSP.enabled", 0)


def start(driver):
    driver.get("https://tweetdeck.twitter.com")
    driver.implicitly_wait(10)

    login_button = driver.find_element_by_link_text("Log in")

    ActionChains(driver) \
        .move_to_element(login_button) \
        .click(login_button) \
        .perform()

    username_field = driver.find_element_by_xpath("//input[@type='text']")
    password_field = driver.find_element_by_xpath("//input[@type='password']")
    login_button = driver.find_element_by_xpath("//*[text()='Log in']")

    ActionChains(driver) \
        .move_to_element(username_field) \
        .send_keys_to_element(username_field, CLIENT_USERNAME) \
        .send_keys_to_element(password_field, CLIENT_PASSWORD) \
        .move_to_element(login_button) \
        .click(login_button) \
        .perform()


if __name__ == "__main__":
    driver = webdriver.Firefox(firefox_profile=profile)
    driver.install_addon(EXTENSION_PATH.replace("/", "\\"), temporary=True)
    try:
        print("Initiating the client...")
        start(driver)
    except Exception:
        driver.close()
