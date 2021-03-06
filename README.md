# Shadowverse Bot

This is a fork of the Shadowverse Discord's bot.

Changes:

- The prefix is now `v!` instead of `!`
- Removed the spam check feature. It was the cause of some crashes and was unneeded for my purposes.
- Allow capital prefixes (since mobile auto-capitalizes the first letter). E.g., both `v!` and `V!` are acceptable prefixes

### Adding this bot

You can add this bot to your server by [using this link](https://discordapp.com/oauth2/authorize?client_id=436832310273245184&scope=bot). The bot requires no special permissions.

### Using this bot

All the commands start with `v!`. A full list of commands is as follows:
* `v!name` to search for a card by name
* `v!` to search for a card by description
* `v!flair` to search for a card by description, then return its flair text
* `v!img` and `v!imgevo` to search for a card by description, then return its base or evolved card image
* `v!reddit`, `v!discord`, `v!twitch`, `v!tourneys`, `v!steam` to return links to other Shadowverse resources.
* `v!clean` to clean the bot's messages.
* `v!help` to have the bot send you a list of commands.