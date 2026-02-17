# 🎯 Mission Viewer Guide

## What's New

Your dashboard now has a **fully interactive mission viewer** where you can:
- View all lessons from the latest mission pack
- Track progress with checkboxes
- Take notes as you learn
- See completion percentages
- Access all lesson content without leaving the browser

## Features

### 1. **Mission Overview Card**
- Shows today's date and mission pack
- Overall completion percentage
- Visual progress bar

### 2. **Lesson Tabs**
- Switch between lessons easily
- See completion status (✅) for finished lessons
- Track progress per lesson (e.g., "3/8" checkboxes completed)

### 3. **Lesson Content Sections**

Each lesson includes:

- **💡 ELI5**: Simple explanation in plain English
- **📚 What You're Learning**: Detailed context about the topic
- **🎯 Expected Results**: Bullet list of what you'll achieve
- **🔧 Where It Fits**: Tool recommendations (Cursor, Claude Code, Terminal)
- **🚀 Step-by-Step Walkthrough**: Bash commands and instructions in a code block
- **💪 Try It Exercise**: Hands-on challenges to solidify learning
- **✅ Success Checklist**: Interactive checkboxes to track completion
- **📝 Your Notes**: Personal notepad for each lesson
- **🐰 Optional Rabbit Holes**: Expandable section with deep-dive resources

### 4. **Progress Tracking**

- **Automatic saving**: All progress saved to browser localStorage
- **Persistent state**: Your checkboxes and notes remain after page refresh
- **Per-lesson completion**: Each lesson tracks its own completion
- **Overall progress**: Top bar shows combined progress across all lessons
- **Timestamps**: Completed lessons are timestamped

### 5. **Interactive Checkboxes**

- Click to mark tasks as complete
- Completed items show with strikethrough
- Lesson auto-marks as complete when all checkboxes are checked
- Overall mission completes when all lessons are done

## How to Use

### Basic Workflow

1. **Open Dashboard**: Visit http://localhost:3000
2. **View Mission**: The mission viewer appears at the top
3. **Select Lesson**: Click on "Lesson 1", "Lesson 2", or "Lesson 3" tabs
4. **Read Content**: Scroll through the lesson sections
5. **Follow Along**: Copy bash commands from the walkthrough
6. **Check Off Tasks**: Mark success checklist items as you complete them
7. **Take Notes**: Use the notes section to jot down learnings
8. **Next Lesson**: Switch tabs when ready for the next topic

### Tips

- **Source Links**: Click "View Source →" to see the original article
- **Code Blocks**: Walkthrough commands are in dark code blocks for easy copying
- **Rabbit Holes**: Expand the "Optional Rabbit Holes" section for deep dives
- **Progress Sync**: Your progress auto-saves every time you interact

## Technical Details

### Data Storage
- Progress stored in browser `localStorage`
- Key format: `mission-progress-YYYY-MM-DD`
- Persists across page refreshes
- Per-mission tracking (old missions keep their own progress)

### Mission Files
- Located at: `~/ClawBoz/clawboz-trend-coach/outputs/missions/YYYY-MM-DD.md`
- Dashboard always shows the latest mission file
- Markdown parsed on the server side
- Rendered as interactive React components

### Integration
- **Run Trend Coach Button**: Generates new missions
- **Activity Feed**: Shows when missions are generated
- **Auto-refresh**: Page reloads after running Trend Coach to show new content

## Example Usage Session

```
1. Open dashboard → http://localhost:3000
2. See "Today's Missions" card with 3 lessons
3. Overall progress shows 0% (nothing started yet)
4. Click "Lesson 1" tab
5. Read the ELI5 section to understand the topic
6. Open terminal and follow the walkthrough commands
7. As you complete each step, check off the success checklist
8. Add notes like "This works with npm v18+" in the notes section
9. Progress bar updates to show 12% complete (1/8 checkboxes)
10. Continue until all checkboxes are done
11. Lesson 1 tab shows ✅ to indicate completion
12. Move to Lesson 2 tab and repeat
13. When all 3 lessons are done, overall progress shows 100%
```

## Troubleshooting

**Q: I don't see any missions**
- Run Trend Coach using the "🎯 Run Trend Coach" button
- Wait for it to complete (check activity feed)
- Refresh the page

**Q: My progress disappeared**
- Progress is stored per-browser (localStorage)
- If you clear browser data, progress is lost
- Each mission date has separate progress tracking

**Q: Code blocks are hard to read**
- They use a dark theme (gray-900 background)
- Font is monospace for better readability
- Scroll horizontally if commands are long

**Q: Can I work on old missions?**
- Currently, dashboard shows only the latest mission
- Progress for old missions is preserved in localStorage
- You can manually open old mission files in Cursor if needed

## Next Steps

Now that you have the mission viewer:
1. Click the "Run Trend Coach" button to generate today's missions
2. Pick a lesson that interests you (or start with Lesson 1)
3. Work through it step-by-step
4. Track your learning progress visually
5. Come back tomorrow for new missions!

Happy learning! 🚀
