# 🌍 Smart Location Finder - Enterprise SaaS Platform

A comprehensive location management system for finding villages, towns, and cities across India with interactive maps, user management, membership tiers, and admin analytics.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation Guide](#installation-guide)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Folder Structure](#folder-structure)
- [License](#license)

## 🚀 Overview

Smart Location Finder is a full-stack SaaS application that allows users to search for villages, towns, and cities across India using cascading dropdowns and autocomplete search. The platform includes role-based access (Admin/User), membership tiers (Free, Normal, Premium, Ultra Premium), interactive maps, and comprehensive analytics.

### Key Features:
- ✅ **User Authentication** - Register/Login with JWT tokens
- ✅ **Role-Based Access** - Separate portals for Admin and Users
- ✅ **Location Search** - Search by State → District → Subdistrict → Village
- ✅ **Autocomplete Search** - Quick village name search with suggestions
- ✅ **Interactive Maps** - Leaflet.js integration with OpenStreetMap
- ✅ **Membership System** - Free, Normal, Premium, Ultra Premium tiers
- ✅ **Admin Dashboard** - User management, analytics, feedback handling
- ✅ **Search History** - Track user search patterns
- ✅ **Feedback System** - Users can submit feedback to admin
- ✅ **Upgrade Requests** - Users can request membership upgrades
- ✅ **Real-time Analytics** - Search trends and user statistics

## 🛠 Technology Stack

### Backend:
- **Node.js** (v14+ or v18+ recommended)
- **Express.js** - Web framework
- **MySQL** - Database (v8.0+)
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend:
- **HTML5/CSS3** - Structure & styling
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Client-side logic
- **Leaflet.js** - Interactive maps
- **Chart.js** - Analytics charts

### APIs & Services:
- **OpenStreetMap Nominatim** - Geocoding service

## 💻 System Requirements

### Minimum Requirements:
- **OS:** Windows 10/11, Linux (Ubuntu 20.04+), macOS 11+
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 2GB free space
- **Node.js:** v14.0 or higher
- **MySQL:** v8.0 or higher
- **Browser:** Chrome, Firefox, Edge, Safari (latest versions)

### Network Requirements:
- Internet connection for map tiles and geocoding
- Local network access for database connection

## 📥 Installation Guide

### Step 1: Install Node.js
Download and install Node.js from: https://nodejs.org/
```bash
# Verify installation
node --version
npm --version
