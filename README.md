<div align="center">
  <img src="assets/logo.png" alt="Quran WhatsApp Bot Logo" width="200"/>
  
  # Quran WhatsApp Bot
  
  A multi-user WhatsApp bot that sends daily Quran pages to groups or private chats with multi-language support (English, French, Arabic).
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
  [![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366?logo=whatsapp)](https://github.com/XredaX/Quran-Whatsapp-bot)
  
  ### 📱 Try the Bot Now!
  
  **WhatsApp:** +212 698-032924
  
  [![Chat on WhatsApp](https://img.shields.io/badge/Chat%20on-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/212698032924)
  
</div>

## Features

- 📚 **Automatic Daily Quran Pages** - Send Quran page images to groups or private chats
- 🌍 **Multi-Language** - English, French, and Arabic interface
- 👥 **Multi-User** - Each user manages their own groups independently
- 📱 **Daily Wird** - Receive Quran pages directly in your private chat
- ⏰ **Flexible Scheduling** - Multiple daily sending times per group/subscription
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
3. **Daily Wird (private)** - Receive Quran pages in your private chat
4. **Help** - Usage instructions
5. **Change language** - Switch language

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

### `subscriptions` table (Daily Wird)
- `user_id` - User's WhatsApp ID
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