# Telegram Bot

## Overview

This repository contains a Node.js application for a Telegram Bot designed to enhance the experience of a NAS chat group by integrating with Overseerr and Tautulli. It notifies users about new media availability, transcoding activities, and the completion of TV series seasons.

## Requirements

- Node.js (>=20.6.0)
- Telegram Bot Token
- Overseerr and Tautulli setup for webhook integration

## Installation

1. Clone the repository:

```bash
git clone https://github.com/grusite/movies-telegram-bot.git
cd movies-telegram-bot
```

2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript files:

```bash
npm run build
```

## Configuration

1. Create a `.env` file in the root directory.

2. Add the following environment variables:

```makefile
PORT=<your_server_port> # Optional, defaults to 3000
TELEGRAM_TOKEN=<use_your_telegram_bot_token_from_BotFather>
RAPID_API_KEY=<the_API_key_from: https://rapidapi.com/SAdrian/api/moviesdatabase/>
RAPID_API_HOST=<moviesdatabase.p.rapidapi.com>
TMDB_API_KEY=<go_to: https://www.themoviedb.org/talk/5d1e694194d8a849843ba1e3#5d1e694194d8a849843ba1e5 and_take_the_API_KEY>
TELEGRAM_CHAT_ID=<use_the_telegram_chat_id_to_send_the_message>
```

## Running the bot

* To start the bot in development mode:
```bash
npm run dev
```

* To start the bot in production mode:
```bash
npm start
```

## Webhook Endpoints

* **/webhook/overseerr-media-notification:** Handles notifications from Overseerr about new media availability.

* **/webhook/tautulli-transcoding-notification:** Receives notifications from Tautulli about transcoding activities.

* **/webhook/tautulli-last-episode-notification:** Alerts when a user watches the last episode of a TV series season from Tautulli.


## Contributing

Contributions to the project are welcome. Please ensure you follow the coding standards and write tests for new features.

## License

This project is licensed under the ISC License.