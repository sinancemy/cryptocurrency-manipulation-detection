import os

import requests
from flask import request, redirect
from oauthlib.oauth2 import WebApplicationClient

from srsly import json_dumps


# To be corrected.
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
DISCOVERY = "https://accounts.google.com/.well-known/openid-configuration"

client = WebApplicationClient(CLIENT_ID)
google_config = requests.get(DISCOVERY).json()


def construct_request_uri(callback_uri):
    auth_endpoint = google_config["authorization_endpoint"]
    request_uri = client.prepare_request_uri(auth_endpoint, redirect_uri=callback_uri, scope=["email"])
    return redirect(request_uri)


def callback():
    code = request.args.get("code")
    token_endpoint = google_config["token_endpoint"]
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(token_url, headers=headers, data=body, auth=(CLIENT_ID, CLIENT_SECRET))
    client.parse_request_body_response(json_dumps(token_response.json()))
    # Now get the user email
    userinfo_endpoint = google_config["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)
    print(userinfo_response.json())
