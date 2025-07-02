# 🏪 CostcoQuest

**Track your visits to Costco locations across the country**

*Built with ❤️ by a daughter for his dad as a Father's Day gift - completed in just 4 hours with Claude's help!*

![CostcoQuest Screenshot](https://imgur.com/placeholder.png)
*Interactive map showing Costco locations across the United States with visit tracking*

## 🎯 About

CostcoQuest is a web application that lets you track your visits to Costco warehouse locations across the United States. Whether you're a frequent shopper, road trip enthusiast, or just curious about how many Costcos you've been to, this app helps you visualize your Costco journey!

**Features:**
- 📍 Interactive map with all 600+ Costco locations
- ✅ Track visited locations with a simple click
- 📊 Real-time progress statistics (completion %, states visited, regions covered)
- 🔄 Cross-device sync with Google Sign-in
- 🗺️ Filter by region, state, or search locations
- 📋 Switch between map and checklist views
- 📱 Fully responsive design for mobile and desktop

## 🚀 Live Demo

Visit **[CostcoQuest.com](https://costcoquest.com)** to start tracking your Costco adventures!

## 🛠️ How It Was Built

This project was built in **just 4 hours** as a Father's Day gift, with significant help from Claude AI for rapid development and problem-solving.

### Tech Stack

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks!)
- **Map**: Leaflet.js for interactive mapping
- **Backend**: Firebase (Firestore + Authentication)
- **Hosting**: Github pages - the website is static
- **Data**: Custom CSV with all US Costco locations

### Architecture: True Microservice Design

CostcoQuest follows microservice principles where each component is completely interchangeable:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Authentication│    │   Data Storage  │
│   (HTML/CSS/JS) │◄──►│   (Firebase     │◄──►│   (Firestore)   │
│                 │    │    Auth)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Map Service   │    │   User Profiles │    │   Visit Tracking│
│   (Leaflet.js)  │    │   (Google OAuth)│    │   (Local + Cloud│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Why This Is a True Microservice:**

1. **Interchangeable Components**: 
   - Want to swap Leaflet for Google Maps? Just change the map service
   - Prefer Auth0 over Firebase Auth? Switch authentication providers
   - Need PostgreSQL instead of Firestore? Replace the data layer

2. **Loose Coupling**: Each service communicates through well-defined interfaces
3. **Independent Deployment**: Components can be updated separately
4. **Technology Agnostic**: No vendor lock-in for any particular service

## 🔥 Firebase Integration

### How Firebase Powers CostcoQuest

```javascript
// Firebase Services Used:
├── Firebase Authentication (Google OAuth)
└── Firestore Database (User data sync)
```

**Firebase Authentication**
- Google Sign-in for seamless user experience
- Automatic user session management
- Secure token-based authentication

**Firestore Database Structure**
```
users/
  └── {userId}/
      └── data/
          └── visits/
              ├── visitedLocations: [1, 15, 23, ...]
              └── lastUpdated: "2024-06-16T..."
```

**Data Sync Strategy**
1. **Local-First**: Visits stored in localStorage for instant access
2. **Cloud Sync**: When signed in, data syncs to Firestore
3. **Merge Logic**: Combines local and cloud data

### Firebase as a Microservice

Firebase demonstrates perfect microservice architecture:

- **Authentication Service**: Handles all user identity concerns
- **Database Service**: Manages data persistence and real-time sync  
- **Hosting Service**: Serves static assets with global CDN
- **Easy Swapping**: Each service could be replaced

## 🏗️ Project Structure

```
costcoquest/
├── index.html              # Main application file
├── costco-locations.csv     # All US Costco locations data
├── costco-coords-maps.js    # Coordinate mapping utility
├── firebaseconfig.txt       # Firebase configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file!
```

## 🎯 Key Features Deep Dive

### Interactive Map
- **604 Costco locations** plotted with precise coordinates
- **Color-coded markers**: Red (unvisited), Green (visited)
- **Smart clustering** for better performance
- **Responsive design** adapts to all screen sizes

### Progress Tracking
- **Real-time statistics** update as you mark locations
- **Regional breakdown** across 5 US regions (West, Southwest, etc.)
- **State completion** tracking (visited X out of 50 states)
- **Percentage completion** for that fun!

### Data Synchronization
- **Hybrid storage**: localStorage + Firestore
- **Conflict resolution**: Merges data intelligently
- **Cross-device sync**: Access your progress anywhere

## 🎨 Design Philosophy

### User Experience
- **One-click tracking**: Simply click a location to mark as visited
- **Visual feedback**: Immediate color changes and stat updates
- **Mobile-first**: Designed for on-the-go Costco adventures
- **Intuitive interface**: No learning curve required

### Performance
- **Lightweight**: Entire app loads in under 2 seconds
- **Efficient rendering**: Optimized map performance with 600+ markers
- **Smart caching**: Firebase handles all the caching magic
- **Progressive enhancement**: Works on any device/browser

## 🚀 Deployment

The app is deployed using Github pages. Simply make a commit and github will build and deploy the site for you

## 🎁 The Father's Day Story

This project was born from a simple idea: create something fun and useful for my dad who loves shopping at Costco. Using Claude AI as a development partner, I built the entire application in just 4 hours - from concept to deployment!

**MVP Development Timeline:**
- **Hour 1**: Project setup, Costco location parsing, basic HTML structure, Github pages deployment
- **Hour 2**: Effiency location parsing improvements, Google authentification, fix some locations logitude and latitudes
- **Hour 3**: Firestore integration, data sync logic
- **Hour 4**: UI polish, responsive design, deployment to Firebase

**Claude's Contributions:**
- Rapid prototyping and problem-solving
- Firebase integration guidance  
- CSS styling and responsive design
- Debugging and optimization suggestions

## 🙏 Acknowledgments

- **Claude AI** - For being an amazing coding partner
- **Firebase** - For providing such developer-friendly backend services
- **Leaflet.js** - For the beautiful, lightweight mapping solution
- **Costco** - For being awesome and having locations everywhere!
- **Dad** - For inspiring this fun project ❤️

---

*Made with ❤️ for Father's Day 2025*

**Start your CostcoQuest today at [costcoquest.com](https://costcoquest.com)!**
