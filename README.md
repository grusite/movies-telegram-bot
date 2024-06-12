# Telegram Bot

## Overview

This repository contains a Node.js application for a Telegram Bot designed to enhance the experience of a NAS chat group by integrating with Overseerr and Tautulli. It notifies users about new media availability, transcoding activities, and the completion of TV series seasons.

## Requirements

- Node.js (>=20)
- Telegram Bot Token
- Overseerr and Tautulli setup for webhook integration

Example of Overeer config JSON (**NOTE**: the default template was used in Overeer config, not a manual JSON as here, but I paste it here just as info):

```json
{
    "notification_type": "{{notification_type}}",
    "event": "{{event}}",
    "subject": "{{subject}}",
    "message": "{{message}}",
    "image": "{{image}}",
    "{{media}}": {
        "media_type": "{{media_type}}",
        "tmdbId": "{{media_tmdbid}}",
        "tvdbId": "{{media_tvdbid}}",
        "status": "{{media_status}}",
        "status4k": "{{media_status4k}}"
    },
    "{{request}}": {
        "request_id": "{{request_id}}",
        "requestedBy_email": "{{requestedBy_email}}",
        "requestedBy_username": "{{requestedBy_username}}",
        "requestedBy_avatar": "{{requestedBy_avatar}}"
    },
    "{{issue}}": {
        "issue_id": "{{issue_id}}",
        "issue_type": "{{issue_type}}",
        "issue_status": "{{issue_status}}",
        "reportedBy_email": "{{reportedBy_email}}",
        "reportedBy_username": "{{reportedBy_username}}",
        "reportedBy_avatar": "{{reportedBy_avatar}}"
    },
    "{{comment}}": {
        "comment_message": "{{comment_message}}",
        "commentedBy_email": "{{commentedBy_email}}",
        "commentedBy_username": "{{commentedBy_username}}",
        "commentedBy_avatar": "{{commentedBy_avatar}}"
    },
    "{{extra}}": []
}
```

Example of Tautulli config JSON to be sent for the serie and the transcoding:

```json
// For Transcoding webhook
{
  "title": "{title}",
  "user": "{user}",
  "player": "{player}",
  "action": "{action}",
  "media_type": "{media_type}",
  "themoviedb_id": "{themoviedb_id}",
  "transcode_info": {
    // Transcoding decition
    "transcode_decision": "{transcode_decision}",
    "video_decision": "{video_decision}",
    "audio_decision": "{audio_decision}",
    "subtitle_decision": "{subtitle_decision}",
    // Container info
    "container": "{container}",
    "stream_container": "{stream_container}",
    "transcode_container": "{transcode_container}",
    // Codecs
    "video_codec": "{video_codec}",
    "transcode_video_codec": "{transcode_video_codec}",
    "audio_codec": "{audio_codec}",
    "transcode_audio_codec": "{transcode_audio_codec}",
    "subtitle_codec": "{subtitle_codec}",
    "stream_subtitle_codec": "{stream_subtitle_codec}",
    "subtitle_language": "{subtitle_language}",
    // Bitrate
    "original_bitrate": "{bitrate}",
    "video_bitrate": "{video_bitrate}",
    "audio_bitrate": "{audio_bitrate}",
    "stream_bitrate": "{stream_bitrate}",
    "stream_video_bitrate": "{stream_video_bitrate}",
    "stream_audio_bitrate": "{stream_audio_bitrate}",
    // Resolution
    "video_resolution": "{video_resolution}",
    "stream_video_resolution": "{stream_video_resolution}"
  }
}

// For Last Episode webhook
{
  "title": "{title}",
  "user": "{user}",
  "player": "{player}",
  "action": "{action}",
  "media_type": "{media_type}",
  "themoviedb_id": "{themoviedb_id}",
    "serie_info": {
    "episode_name": "{episode_name}",
    "episode_num": "{episode_num}",
    "episode_count": "{episode_count}",
    "season_num": "{season_num}",
    "season_count": "{season_count}"
  }
}
```

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
TELEGRAM_MEDIA_CHAT_ID=<use_the_telegram_chat_id_to_send_the_overseerr_message>
TELEGRAM_TRANSCODING_CHAT_ID=<use_the_telegram_chat_id_to_send_the_transcoding_message>
TELEGRAM_LAST_EPISODE_CHAT_ID=<use_the_telegram_chat_id_to_send_the_last_episode_message>
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

Example of a TV Series POST (MEDIA_AVAILABLE status) notification from Overseerr:

```json
{
  "notification_type": "MEDIA_AVAILABLE",
  "event": "Series Request Now Available",
  "subject": "The Mentalist (2008)",
  "message": "Patrick Jane, a former celebrity psychic medium, uses his razor sharp skills of observation and expertise at \"reading\" people to solve serious crimes with the California Bureau of Investigation.",
  "image": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg",
  "media": {
    "media_type": "tv",
    "tmdbId": "5920",
    "tvdbId": "82459",
    "status": "PARTIALLY_AVAILABLE",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": "145",
    "requestedBy_email": "grusite@gmail.com",
    "requestedBy_username": "grusite",
    "requestedBy_avatar": "https://plex.tv/users/fe7fa4e4122d2d86/avatar?c=1703683943"
  },
  "issue": null,
  "comment": null,
  "extra": [ { "name": "Requested Seasons", "value": "1" } ]
}
```

Example of a Movie POST (MEDIA_AVAILABLE status) notification from Overseerr:

```json
{
  "notification_type": "MEDIA_AVAILABLE",
  "event": "Movie Request Now Available",
  "subject": "Dungeons & Dragons: Honor Among Thieves (2023)",
  "message": "A charming thief and a band of unlikely adventurers undertake an epic heist to retrieve a lost relic, but things go dangerously awry when they run afoul of the wrong people.",
  "image": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/A7AoNT06aRAc4SV89Dwxj3EYAgC.jpg",
  "media": {
    "media_type": "movie",
    "tmdbId": "493529",
    "tvdbId": "",
    "status": "AVAILABLE",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": "141",
    "requestedBy_email": "drinconada@gmail.com",
    "requestedBy_username": "Gudnight",
    "requestedBy_avatar": "https://plex.tv/users/45eb1bbd0c2fb9b5/avatar?c=1703945653"
  },
  "issue": null,
  "comment": null,
  "extra": []
}
```

Example of a non-released movie (MEDIA_PENDING status) POST notification from Overseerr:

```json
{
  "notification_type": "MEDIA_PENDING",
  "event": "New Movie Request",
  "subject": "The Beekeeper (2024)",
  "message": "One man’s campaign for vengeance takes on national stakes after he is revealed to be a former operative of a powerful and clandestine organization known as Beekeepers.",
  "image": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/A7EByudX0eOzlkQ2FIbogzyazm2.jpg",
  "media": {
    "media_type": "movie",
    "tmdbId": "866398",
    "tvdbId": "",
    "status": "PENDING",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": "269",
    "requestedBy_email": "grusite@gmail.com",
    "requestedBy_username": "grusite",
    "requestedBy_avatar": "https://plex.tv/users/fe7fa4e4122d2d86/avatar?c=1704938280"
  },
  "issue": null,
  "comment": null,
  "extra": []
}
```

* **/webhook/tautulli-transcoding-notification:** Receives notifications from Tautulli about transcoding activities.

Example of a Tautulli Transcoding POST notification:
```json
// Not Transcoding
{
  "title": "Los Juegos del Hambre: Sinsajo - Parte 2",
  "user": "grusite",
  "player": "Jorges-MacBook-Pro.local",
  "action": "play",
  "media_type": "movie",
  "serie_info": {
    "episode_name": "Los Juegos del Hambre: Sinsajo - Parte 2",
    "episode_num": "0",
    "episode_count": "1",
    "season_num": "0",
    "season_count": "1"
  },
  "transcode_info": {
    "transcode_decision": "Direct Play",
    "video_decision": "direct play",
    "audio_decision": "direct play",
    "container": "mkv",
    "transcode_container": "",
    "transcode_video_codec": "",
    "video_codec": "hevc",
    "transcode_audio_codec": "",
    "audio_codec": "truehd",
    "quality": "77437 kbps"
  }
}

// Transcoding
{
  "title": "Rain Man",
  "user": "Fermolmez",
  "player": "Feer",
  "action": "change",
  "media_type": "movie",
  "themoviedb_id": "475557",
  "serie_info": {
    "episode_name": "Rain Man",
    "episode_num": "0",
    "episode_count": "1",
    "season_num": "0",
    "season_count": "1"
  },
  "transcode_info": {
    "transcode_decision": "Transcode",
    "video_decision": "transcode",
    "audio_decision": "transcode",
    "container": "mkv",
    "transcode_container": "mkv",
    "transcode_video_codec": "h264",
    "video_codec": "hevc",
    "transcode_audio_codec": "opus",
    "audio_codec": "ac3",
    "quality": "7113",
    "original_bitrate": "143760"
  }
}
```


* **/webhook/tautulli-last-episode-notification:** Alerts when a user watches the last episode of a TV series season from Tautulli.

Example of a Tautulli Last Episode notification:
```json
{
  "title": "Los Simpson - El blues de la Mona Lisa",
  "user": "grusite",
  "player": "Jorges-MacBook-Pro.local",
  "action": "play",
  "media_type": "episode",
  "themoviedb_id": "456",
  "serie_info": {
    "episode_name": "El blues de la Mona Lisa",
    "episode_num": "13",
    "episode_count": "1",
    "season_num": "1",
    "season_count": "1"
  }
}
```
* **/send-announcement:** Sends a notifciation to the "Películas" chat group and adds a "header" and a "footer" to be more visual.

Example of payload:
```json
{
  "text": "Qué pasa shavaleh! \n\nQue sepáis que a partir de ahora el *nombre de las carpetas cambiará* y todos tendréis *permisos* para lo que os salga del pito. \n\n¿Os parece bien?"
}
```


## Contributing

Contributions to the project are welcome. Please ensure you follow the coding standards and write tests for new features.

## License

This project is licensed under the ISC License.