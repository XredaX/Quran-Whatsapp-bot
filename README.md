# Quran WhatsApp Bot

A multi-user WhatsApp bot that sends daily Quran pages to groups with multi-language support (English, French, Arabic).

## Features

- 📚 **Automatic Daily Quran Pages** - Send Quran page images to WhatsApp groups
- 🌍 **Multi-Language** - English, French, and Arabic interface
- 👥 **Multi-User** - Each user manages their own groups independently
- ⏰ **Flexible Scheduling** - Multiple daily sending times per group
- 📄 **Batch Sending** - Send 1-50 pages per schedule
- 🧙‍♂️ **Setup Wizard** - Guided configuration for new groups
- ✅ **Confirmation System** - Preview changes before applying
- 🔒 **Secure** - Users only see groups they're members of

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL database
- WhatsApp account

### Installation

```bash
git clone https://github.com/XredaX/Quran-Whatsapp-bot.git
cd Quran-Whatsapp-bot
npm install
```

Create `.env` file:
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

Start the bot:
```bash
npm start
```

Scan the QR code with WhatsApp, then send any message to the bot to begin.

## Usage

### First Time Setup
1. Send any message to the bot
2. Select your language (1-3)
3. Choose "Link a new group"
4. Select group from numbered list
5. Follow the 4-step wizard:
   - Set starting page (1-604)
   - Set pages per send (1-50)
   - Set schedule time (HH:MM)
   - Activate or pause

### Commands
- `menu` or `help` - Show main menu
- `!language` - Change language

### Menu Options
1. **Link a new group** - Add a WhatsApp group
2. **View my groups** - Manage existing groups
3. **Help** - Usage instructions
4. **Change language** - Switch language

## Database Schema

The bot auto-creates tables on first run:

### `users` table
- `whatsapp_id` - User's WhatsApp ID
- `language` - Preferred language (en/fr/ar)

### `groups` table
- `group_id` - WhatsApp group ID
- `user_id` - Owner's WhatsApp ID
- `name` - Group name
- `current_page` - Next page to send (1-604)
- `pages_per_send` - Pages to send each time (1-50)
- `cron_schedules` - JSON array of schedules
- `is_active` - Active or paused

## Project Structure

```
quran-whatsapp-bot/
├── src/
│   ├── config/          # Database
│   ├── handlers/        # Message handlers
│   ├── services/        # Scheduler
│   ├── utils/           # Helpers & translations
│   └── index.js         # Entry point
├── quran-images/        # Page images (1.jpg - 604.jpg)
└── .env                 # Configuration
```