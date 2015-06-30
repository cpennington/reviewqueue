// SAMPLE
this.manifest = {
    "name": "PullRequestQueue",
    "icon": "icon.png",
    "settings": [
        {
            "tab": i18n.get("github"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username-title"),
            "text": i18n.get("username-prompt")
        },
        {
            "tab": i18n.get("github"),
            "name": "apikey",
            "type": "text",
            "label": i18n.get("api-key-title"),
            "text": i18n.get("api-key-prompt")
        }
    ]
};
