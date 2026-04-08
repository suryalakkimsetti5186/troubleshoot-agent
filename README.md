\# 🤖 Multi-Step Troubleshooting Agent



\## 📋 Overview



An \*\*AI-powered autonomous agent\*\* that performs multi-step troubleshooting on computer systems. The agent automatically detects issues, classifies them, plans fixes, executes solutions, and verifies results - all without human intervention.



\## 🚀 Features



| Feature | Description |

|---------|-------------|

| 🔍 \*\*Auto-Detection\*\* | Scans CPU, RAM, Disk, Temperature every 30 seconds |

| 🧠 \*\*Multi-Step Planning\*\* | Creates dynamic diagnostic workflows |

| 🔧 \*\*Self-Healing\*\* | Automatically fixes software issues |

| 📊 \*\*Dashboard\*\* | Real-time system monitoring |

| 🎤 \*\*Voice/Text Commands\*\* | Natural language interaction |

| 💾 \*\*Database Storage\*\* | Stores issues and healing logs |

| 📋 \*\*Healing Log\*\* | Tracks all actions taken |



\## 📐 Architecture

User Input → Recognition → Planning → Execution → Verification → Report

↑ │

└───────────────────────────┘

(Re-plan if needed)





\## 🔄 Multi-Step Process



| Step | Action |

|------|--------|

| \*\*Step 1\*\* | Detect Issues (CPU, RAM, Disk, Temperature) |

| \*\*Step 2\*\* | Classify Issues (Software / Hardware) |

| \*\*Step 3\*\* | Plan Fix Strategy |

| \*\*Step 4\*\* | Execute Fix |

| \*\*Step 5\*\* | Verify Resolution |



\## 🛠️ Tech Stack



| Layer | Technology |

|-------|------------|

| \*\*Frontend\*\* | React.js |

| \*\*Backend\*\* | Node.js + Express |

| \*\*Database\*\* | SQLite3 |

| \*\*System Info\*\* | systeminformation library |



\## 📦 Installation



\### Backend Setup



```bash

cd backend

npm install

node pc-control-server.js



Frontend Setup



cd frontend

npm install

npm start



💻 Commands



Command	Action For Current Environment

open chrome	Opens Chrome browser

check CPU	Shows CPU usage

show issues	Lists detected issues

lock screen	Locks computer

help	Shows all commands



🔍 Auto-Detection Capabilities



Issue			Threshold	Auto-Fix

High CPU Usage		>80%		✅ Kills high-CPU process

High CPU Temperature	>80°C		⚠️ Reports (Hardware)

High RAM Usage		>85%		✅ Kills memory-intensive process

Low Disk Space		>90%		✅ Runs Disk Cleanup





📁 Project Structure



├── backend/

│   ├── pc-control-server.js    # Main server

│   ├── system\_data.db          # SQLite database

│   ├── package.json

│   ├── ai.js                   # AI decision engine

│   ├── analyzer.js             # Issue detection

│   ├── db.js                   # Database operations

│   ├── fixer.js                # Self-healing engine

│   └── monitor.js              # System monitoring

├── frontend/

│   ├── src/

│   │   ├── App.js              # React UI

│   │   ├── App.css             # Styling

│   │   └── index.js

│   └── package.json

└── README.md



👨‍💻 Author

Surya Lakkimsetti



GitHub: @suryalakkimsetti5186



📌 Version

Version 1.0.0



🎯 Problem Statement

"Develop an agent that orchestrates multi-step troubleshooting"



This project fulfills the requirement by implementing a complete multi-step troubleshooting agent.



🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



📧 Contact

For any queries, please reach out to suryalakkimsetti5186@gmail.com

