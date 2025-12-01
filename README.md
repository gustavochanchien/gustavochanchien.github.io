# Portfolio - Gustavo Chanchien

This is my personal portfolio website. I use it to introduce myself as a full-stack developer & data analyst, share a bit of my background in public health and epidemiology, and showcase selected projects — all wrapped around a playful 3js balloon simulation on the landing section.

## Live Demo

`https://gustavochanchien.github.io`

## Overview

I built this portfolio as a simple, focused place to:

* Highlight my work as a developer and data analyst.
* Tell a bit of my story — from growing up in Managua, Nicaragua to working on projects that help people and communities better understand and use their data.
* Experiment with interactive visuals like the 3js balloon simulation on the homepage.

The site is structured into clear sections (About, Projects, Contact) so visitors can quickly learn who I am, what I’ve built, and how to reach me.

## Features

### User Interface & Experience:

  * Hero Section with 3js Balloon Simulation:
    * Interactive balloon scene on load (“mouse over to burn”).
    * Visual, playful introduction instead of a static hero image.
    * Simple “Pause” control to stop / resume the animation.
  * Clean Navigation:
    * Top navigation bar with anchors for **About**, **Projects**, and **Contact**.
    * Smooth, single-page experience so everything is reachable within a few scrolls.
  * About Section:
    * Short narrative about my background in Managua, how I started coding, and why I care about building tools that help communities reclaim and understand their data.
    * Highlights my core skills and domains (Python, JavaScript, R, SQL; public health, epidemiology, and GIS).
  * Projects Section:
    * Curated list of selected projects with brief descriptions and tech stacks.
    * Focus on work that bridges software, data, and real-world impact.
  * Contact / Call-to-Action:
    * Friendly “Get in touch :)” section inviting collaboration.
    * Direct links to my GitHub profile and a note about being based in Albuquerque, New Mexico.

### Technical Highlights:

  * Static Site on GitHub Pages:
    * Served directly from `index.html`, making the site easy to host and version-control.
  * Vanilla JavaScript + 3js:
    * No front-end framework — the site is built with plain JavaScript plus a 3js-powered balloon simulation.
  * Modular JavaScript Structure:
    * `app.js` for general page behavior (navigation, section handling, UI interactions).
    * `projects.js` to keep project data/configuration separate from layout logic.
    * `simulation.js` for the balloon scene, animation loop, and pointer interaction logic.
  * Custom Styling:
    * All layout, typography, and component styles live in `styles.css`, making it straightforward to tweak the visual design.
  * Lightweight & Extensible:
    * Easy to add new projects by updating the data structure in `projects.js` and adjusting markup if needed.
    * No build step required — just commit and push to update the live site.

## Technologies Used

  * HTML5
  * CSS3
  * JavaScript (ES6+)
  * 3js / Three.js (for the balloon simulation)
  * GitHub Pages (hosting)

## How It Works

When the page loads:

  1. **Base layout renders** from `index.html`, including the navigation bar, hero section, content sections, and contact/footer.
  2. **Balloon simulation initializes**:
     * `simulation.js` sets up the 3D scene, camera, and render loop.
     * Pointer/mouse events drive the “burn” interaction and balloon behavior.
  3. **Page interactions wire up**:
     * `app.js` attaches event listeners for navigation links and any UI controls (like the simulation pause button).
  4. **Projects populate**:
     * Project metadata in `projects.js` is used to render the list of projects in the Projects section, keeping content and presentation loosely separated.

* * *

This portfolio is an ongoing playground for me to experiment with interactive visuals, front-end patterns, and data-driven storytelling. I hope you enjoy exploring it!

## About

Personal portfolio site

`https://gustavochanchien.github.io`

### Resources

Readme
