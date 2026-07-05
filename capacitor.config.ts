{
  "appId": "com.agrolink.app",
  "appName": "AgroLink",
  "webDir": ".output/public",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": false,
    "backgroundColor": "#0f1a14"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0f1a14",
      "showSpinner": false
    },
    "Geolocation": {
      "permissions": ["location", "coarseLocation"]
    }
  }
}
