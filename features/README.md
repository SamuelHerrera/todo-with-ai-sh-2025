Part 1 – To-Do List App

Build a simple to-do list app with the following requirements:
- Framework: Next.js
- Database: Supabase (data must persist — no local storage)
- Hosting: Vercel

Core Features:
- Users will identify just with an email
- Add a task (title and/or description)
- Edit a task
- Mark a task complete
- Data persists after refresh
- Create API to interact with backend
- Store in Supabase (accessed in backend)

Part 2 – Chatbot Enhancement

Extend your app with a chatbot interface:
- Integrate with N8N (mandatory)
- Chatbot connects with Supabase (via our own API)
- When a task is added
    - Call an AI to enhance the title like make it clearer
    - Break taks it into steps (if possible)
    - Enrich the description it with relevant info (like comming from a search)
- Add WhatsApp integration (Baileys WA) 
    - Use a filter so only messages with ### comming from whatsapp trigger the bot