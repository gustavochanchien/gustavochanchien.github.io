// Global data used by app.js to render sections and carousel
window.projectsData = {
    carouselSlides: [
    {
      imageUrl: "/images/telemetry.jpeg",
      alt: "Telemetry dashboard",
      href: "#",
      openInNewTab: true,
      loading: "eager"
    },
    {
      imageUrl: "/images/balloon.png",
      alt: "Photo of me",
      href: "#",
      openInNewTab: true,
      loading: "lazy"
    },
    {
      imageUrl: "/images/epi.png",
      alt: "Outbreak Simulator",
      href: "/outbreak-simulator",
      openInNewTab: true,
      loading: "lazy"
    },
    {
      imageUrl: "/images/telemetry2.jpeg",
      alt: "telemetry setup",
      href: "#",
      openInNewTab: true,
      loading: "lazy"
    },
    {
      imageUrl: "images/preview-screenshots/crime-dash.png",
      alt: "Crime Dasb",
      href: "/abq-crime-dashboard",
      openInNewTab: true,
      loading: "lazy"
    },
  ],

  sections: [
    {
      id: "projects",
      tabLabel: "Projects",
      title: "Projects and Apps",
      description: `A list of some projects and applications that I'm working on`,
      items: [
        {
          label: "Pregunton",
          title: "Pregunton Surveys Web App",
          body: `[TypeScript, Vue3, Firebase] The Pregunton Surveys Web App is a full-stack applicaton developed in Vue3 and Firebase that allows users to create custom surveys, distribute them easily with unique codes and view the results on custom report dashboards that update live as results come in. I built this application because I saw a need for it while working with Community Health Workers and their organizations. See the demo here [LINK].`,
          images: [
            {
              url: "images/preview-screenshots/pregunton1.png",
              alt: "Pregunton Surveys dashboard"
            },
            {
              url: "images/preview-screenshots/pregunton2.png",
              alt: "Survey creation screen"
            },
            {
              url: "images/preview-screenshots/pregunton3.png",
              alt: "Survey results analytics"
            }
          ]
        },
        {
          label: "ThemeAny",
          title: "ThemeAny Chrome Extension",
          body: `[JavaScript, Chrome Extensions API, CSS] The ThemeAny chrome extension allows you to set any website to dark mode, I made this because there aren't any similar apps and when I look at recipes I like them to be in dark mode for easy reading. Download it here: https://chromewebstore.google.com/detail/themeany/kjihonkoamigalhkfmndehdkfnldjpfi`,
          images: [
            {
              url: "images/preview-screenshots/themeany0.png",
              alt: "Slice view"
            },
            {
              url: "images/preview-screenshots/themeany1.png",
              alt: "Original"
            },
            {
              url: "images/preview-screenshots/themeany2.png",
              alt: "Themed"
            }
          ]
        },
        {
          label: "ABQ Crime Dashboard",
          title: "A Dashboard of 911 Calls using CABQs open data API",
          body: `[JavaScript, Leaflet, Chart.js, ArcGIS REST API] A client-side dashboard that visualizes Albuquerque 911 incident data with interactive maps (dots, heatmaps, ZIP-code choropleths), time sliders, and rich filtering to explore spatial and temporal patterns. It combines performant geospatial rendering with synchronized charts and KPIs to let users look into call types, trends, and regions in a single-page web app. https://gustavochanchien.github.io/abq-crime-dashboard/`,
          images: [
            {
              url: "images/preview-screenshots/crime-dash.png",
              alt: "Crime Report dashboard"
            },
            {
              url: "images/preview-screenshots/crime-dash2.png",
              alt: "heatmap view"
            }
          ]
        },
        {
          label: "R/C Hot Air Balloon Telemetry",
          title: "Educational Displays for R/C Hot Air Balloon Demonstrations",
          body: `[Arduino C++, JavaScript] Developing live and interactive telemetry interfaces for R/C hot air balloons to help team about phyics and hot air balloon demonstrations https://github.com/gustavochanchien/ESP32_Basic_Telemetry`,
          images: [
            {
              url: "images/telemetry.jpeg",
              alt: "ESP32 Telemetry Demo"
            },
            {
              url: "images/telemetry2.jpeg",
              alt: "ESP32 Telemetry Device"
            },
          ]
        }
      ]
    },
    {
      id: "websites",
      tabLabel: "Websites",
      title: "Cool Websites and WebApps",
      description: `Some websites and webapps that I've built to help me learn and understand things and just generally things that I found to be fun to make or that I was interested in and wanted to learn more.`,
      items: [
        {
          label: "Outbreak Simulator",
          title: "Outbreak and Infection Simulator",
          body: `[JavaScript, HTML5 Canvas] A fun infection simulator with a live preview that simultaneously develops matching datasets for use with homework projects. It also makes SIR graphs and has a variety of tunable parameters all for demonstration purposes. https://gustavochanchien.github.io/outbreak-simulator/`,
          images: [
            {
              url: "images/epi.png",
              alt: "Pregunton Surveys dashboard"
            },
          ]
        },
        {
          label: "Pathfinding Experiment",
          title: "A pathfinding lab that uses real road speed as costs",
          body: `[JavaScript, MapLibre GL JS, Overpass API] Learning about pathfinding algorithms and thought this would be a fun way to see how different ones performed on real road data. It's interesting how greedy will not take highways and A*'s accuracy. https://gustavochanchien.github.io/pathfinding-experiment/`,
          images: [
            {
              url: "images/preview-screenshots/pathfinding2.png",
              alt: "Pathfinding many agents"
            },
            {
              url: "images/preview-screenshots/pathfinding1.png",
              alt: "Pathfinding few agents"
            },
          ]
        },
        {
          label: "Albuquerque Box Hot Air Balloon Game",
          title: "Hot Air Balloon Flight Simulator in the Albuquerque Box",
          body: `[JavaScript, MapLibre GL JS, HTML5 Canvas] Wanted to make a game that has the experience of flying a hot air balloon through the different layers of the box. https://gustavochanchien.github.io/albuquerque-box-game/`,
          images: [
            {
              url: "images/preview-screenshots/boxsim.png",
              alt: "Box Simulator"
            },
          ]
        },
        {
          label: "Workout App Concept",
          title: "A concept for a workout app that uses optimal timing",
          body: `[JavaScript] A concept for a workout tracker app that helps you learn optimal timing for rests, concentric, and eccentric movements, and track your PRs. https://gustavochanchien.github.io/workout-concept/`,
          images: [
            {
              url: "images/preview-screenshots/workout.png",
              alt: "Workout Timer"
            },
          ]
        },
        {
          label: "Projector Light Show",
          title: "A laser-like smoky light show",
          body: `[JavaScript, HTML5 Canvas, Web Audio API] A browser-based, real-time projector and light-show visualizer inspired by Blaize V3, rebuilt from the ground up using HTML5 Canvas and JavaScript to run entirely in the browser. It features 30+ animated presets, beat-reactive visuals, real-time controls, and a pop-out control panel optimized for live projector and dual-screen setups. https://gustavochanchien.github.io/projector-light-show/`,
          images: [
            {
              url: "images/preview-screenshots/lightshow.png",
              alt: "Dashboard View"
            },
            {
              url: "images/preview-screenshots/lightshow.png",
              alt: "Live picture"
            },
          ]
        },
        {
          label: "Phoenix Rising Homepage",
          title: "The webpage for Phoenix Rising R/C Balloon Group",
          body: `[JavaScript, Google Drive] Static informational webpage for the R/C Balloon Group. https://gustavochanchien.github.io/phoenix-rising/`,
          images: [
            {
              url: "images/preview-screenshots/pr.png", 
              alt: "Phoenix Rising Webpage"
            },
          ]
        },
      ]
    },
    {
      id: "tools-scripts",
      tabLabel: "Tools & Scripts",
      title: "Tools and Scripts.",
      description: `A collection of useful utilities and resources. Most are for processing REDCap files, some operations are quite easy to do in R or other statistical software, but wanted to make such operations more accessible. These include a script to merge columns that have been filled out in alternate languages using different column names, a script to replace data with the dictionary text replacements, and a script that manually downloads REDCap data and updates Tableau Public dashboards so they can be kept live without a premium subscription.`,
      items: [
        {
          label: "Color Masking Lat Lon Extractor",
          title: "A script for extracting the Lat Lon from an image of points",
          body: `[Python, OpenCV] A python notebook that extracts spatial features from a static map image (e.g., green symbols or markers) that represent locations in Albuquerque. The motivation behind this script is to bypass the high costs of accessing this data from NMDOT (~$2,000) by extracting the information manually using computer vision and georeferencing techniques. https://github.com/gustavochanchien/nm-2023-alcohol-crash-data`,
          images: [
            {
              url: "https://github.com/gustavochanchien/nm-2023-alcohol-crash-data/blob/main/images/finaloutput.png?raw=true", 
              alt: "Crash Data"
            },
          ]
        },
        {
          label: "Language Column Merger",
          title: "Merger for multiple language surveys",
          body: `[Python] A quick python script that will combine any two matching columns that have a language differentiator. It's common in REDCap to not use the language feature because of later bugs and customization issues, so often we create two separate fields that show or hide based on the language. This can be accomplished easily in R or any data language, but this is just a visual way that lets you confirm the match-ups. [LINK]`
        },
        {
          label: "Dictionary Combine",
          title: "For combining the dictionary with the data",
          body: `[Python, OpenCV] Uses the REDCap dictionary from a project to add descriptions and generally make the REDCap data exports easier to read with options to include different components or replace different responses (some or all). [LINK]`
        },
        ,
        {
          label: "Tableau Public Automatic Uplaoder",
          title: "Automatically pulls weekly redcap data and updates Tableau Public Repositories",
          body: `[Python, PythonUI] PythonUI script that will automatically pull the latests data from a REDCap API and then open Tableau and update 30 public dashboards for a COVID project [LINK]`
        },
      ]
    },
    {
      id: "other",
      tabLabel: "Miscellaneous Projects",
      title: "Other Projects",
      description: `All the other random stuff I've made.`,
      items: [
        {
          label: "VectorCardiogram and ECG Simulator",
          title: "A simulator to compare ECG and Vectorcardiogram outputs",
          body: `[JavaScript, HTML5 Canvas] Vectorcardiograms were the original way to read heart rhythms but they were phased out and now mostly used for specialty diagnostic tests. My grandpa originally learned to read vectorcardiograms and I made this simulator so he could explain it better. Not medically accurate. https://gustavochanchien.github.io/ecg-vector-simulator/`
        },
        {
          label: "CSS Tabs",
          title: "A quick webapp for tuning the tab parameters",
          body: `[JavaScript, CSS] I needed to adjust the tabs for this website's cards and navbars and so I wanted to experiment with them a bunch, so I made this quick website with sliders so I can adjust it and see what works and where it breaks. https://gustavochanchien.github.io/tab-design-tester/`
        },
        {
          label: "Hot Air Balloon Simulator",
          title: "A quick webapp for tuning the parameters on the hot air balloons on my page",
          body: `[JavaScript, 3DJS] A little website to help tune the appearance of the hot air ballons for my welcome banner, but also a fun interactive website, I'm thinking about connecting tis up with a Kinect or something because the balloon museum has a similar display but it's not really aligned with the hot air balloon theme so I think it would be cool (note to self). https://gustavochanchien.github.io/balloon-simulator/`
        },
        {
          label: "Portfolio XP Windows Clone",
          title: "My old portfolio page",
          body: `[JavaScript] My old portfolio, a cool simulation of the Windows XP with working windows and desktop. https://gustavochanchien.github.io/xp-desktop/`
        },
      ]
    }
  ]
};
