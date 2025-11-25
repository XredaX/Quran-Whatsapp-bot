# Quran WhatsApp Bot

A multi-user WhatsApp bot that sends daily Quran pages to groups with multi-language support (English, French, Arabic).

## Features

- 📚 **Automatic Daily Quran Pages**: Send Quran page images to WhatsApp groups daily
- 🌍 **Multi-Language Support**: English, French, and Arabic interface
- 👥 **Multi-User**: Each user can manage their own groups independently
- ⏰ **Flexible Scheduling**: Multiple daily sending times per group
- ⚙️ **Easy Configuration**: Simple conversational interface to manage settings
- 📄 **Page Tracking**: Auto-increment page after each send

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- WhatsApp account for the bot

## Installation

1. Clone this repository:
```bash
git clone https://github.com/XredaX/Whatsapp-bot.git
cd Whatsapp-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

## Docker Deployment (Recommended)

### Using Docker Compose (Easiest)

1. Clone and navigate to the project:
```bash
git clone https://github.com/XredaX/Quran-Whatsapp-bot.git
cd Quran-Whatsapp-bot
```

2. Update `.env` file (docker-compose includes PostgreSQL):
```env
DATABASE_URL=postgresql://quran_user:quran_password@postgres:5432/quran_bot
```

3. Start the bot and database:
```bash
docker-compose up -d
```

4. View logs to scan QR code:
```bash
docker-compose logs -f quran-bot
```

5. Stop the bot:
```bash
docker-compose down
```

### Using Docker Only

Build and run:
```bash
docker build -t quran-bot .
docker run -d --name quran-bot \
  -e DATABASE_URL="your_database_url" \
  -v $(pwd)/quran-images:/app/quran-images \
  -v $(pwd)/.wwebjs_auth:/app/.wwebjs_auth \
  quran-bot
```

## Usage

1. Start the bot:
```bash
npm start
```

2. Scan the QR code with WhatsApp on first run

3. Send any message to the bot from your WhatsApp to see the menu

4. Select your language (first time only)

5. Link your WhatsApp groups to the bot

6. Configure schedules and settings

## Available Commands

- **Menu** - Type `menu`, `help`, or `start` to see options
- **Language** - Type `!language` to change language

## Menu Options

1. **Link a new group** - Connect a WhatsApp group to the bot
2. **View my groups** - See all your linked groups and configure them
3. **Help** - Get usage instructions
4. **Change language** - Switch between English, French, Arabic

## Group Settings

When you link a WhatsApp group, you can configure the following parameters:

### 1. Current Page (1-604)
- **What it does**: Sets which Quran page will be sent next
- **Default**: 1 (starts from the beginning)
- **Example**: Set to 150 to start from page 150
- **Auto-increment**: After each send, the page automatically increments by 1

### 2. Schedules (Multiple allowed)
- **What it does**: Defines when the bot sends pages to the group
- **Format**: 24-hour time (HH:MM) - e.g., `09:00`, `18:30`
- **Multiple schedules**: You can add multiple times per day
- **Example**: Adding `09:00`, `12:00`, and `18:00` will send 3 pages daily (one at each time)
- **Important**: At least one schedule is required per group

### 3. Status (Active/Paused)
- **Active** ✅: Bot will send pages at scheduled times
- **Paused** ❌: Bot will skip this group (schedule remains saved)
- **Use case**: Temporarily stop sending without removing schedules

## Configuration Guide

### Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

**Parameters explained:**
- `username`: Your PostgreSQL username
- `password`: Your PostgreSQL password
- `host`: Database server address (e.g., `localhost` or remote server)
- `port`: PostgreSQL port (default: `5432`)
- `database`: Database name (e.g., `quran_bot`)

**Example for local development:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/quran_bot
```

## Database Schema

The bot automatically creates two tables on first run:

### `users` table
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `whatsapp_id` | VARCHAR(255) | - | User's WhatsApp ID (primary key) |
| `language` | VARCHAR(10) | `'en'` | User's preferred language (en/fr/ar) |
| `created_at` | TIMESTAMP | NOW() | When user first interacted with bot |

### `groups` table
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | SERIAL | - | Auto-increment ID (primary key) |
| `group_id` | VARCHAR(255) | - | WhatsApp group ID (unique) |
| `user_id` | VARCHAR(255) | - | Owner's WhatsApp ID (foreign key) |
| `name` | VARCHAR(255) | - | Group display name |
| `current_page` | INTEGER | `1` | Next page to send (1-604) |
| `cron_schedules` | TEXT | `'["0 18 * * *"]'` | JSON array of cron expressions |
| `is_active` | BOOLEAN | `true` | Whether sending is enabled |
| `created_at` | TIMESTAMP | NOW() | When group was linked |

### Understanding `cron_schedules`

Stored as JSON array of cron expressions. Examples:
- `["0 18 * * *"]` = Daily at 18:00 (6 PM)
- `["0 9 * * *", "0 18 * * *"]` = Daily at 9:00 AM and 6:00 PM
- `["30 12 * * *"]` = Daily at 12:30 PM

**Note**: Users interact with simple time format (HH:MM), bot converts to cron internally.

## How Scheduling Works

1. **Job Creation**: When you add a schedule (e.g., `09:00`), the bot creates a scheduled job
2. **Daily Execution**: Every day at 09:00, the job runs
3. **Send Process**:
   - Loads the image: `quran-images/{current_page}.jpg`
   - Sends to group with caption: "Quran Page {current_page}"
   - Increments `current_page` by 1 in database
4. **Next Day**: Process repeats with the new page number

**Example Timeline:**
- Day 1: current_page = 1 → sends page 1 → updates to 2
- Day 2: current_page = 2 → sends page 2 → updates to 3
- Day 3: current_page = 3 → sends page 3 → updates to 4
- ...and so on

```
quran-whatsapp-bot/
├── src/
│   ├── config/          # Database configuration
│   ├── handlers/        # Message handlers
│   ├── services/        # Scheduler service
│   ├── utils/           # Translations
│   └── index.js         # Main entry point
├── quran-images/        # Quran page images (1.jpg - 604.jpg)
├── .env                 # Environment variables (not in repo)
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

## Troubleshooting

**Bot not sending messages?**
- Check that group `is_active` = true
- Verify schedule time format is correct (HH:MM)
- Ensure WhatsApp session is active (may need to re-scan QR)
- Check that images exist in `quran-images/` folder

**Language not changing?**
- Send `!language` command
- Select your language (1, 2, or 3)
- New selection applies immediately

**Group not linking?**
- Make sure bot is added to the WhatsApp group first
- Use the **exact** group name (case-sensitive)
- Bot must have permission to send messages in the group

## Contributing

Feel free to open issues or submit pull requests for improvements.

## License

MIT
