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
    }
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
          body: `The Pregunton Surveys Web App is a full-stack applicaton developed in Vue3 and Firebase that allows users to create custom surveys, distribute them easily with unique codes and view the results on custom report dashboards that update live as results come in. I built this application because I saw a need for it while working with Community Health Workers and their organizations. See the demo here [LINK].`,
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
          label: "R/C Hot Air Balloon Telemetry",
          title: "Phoenix Rising R&D Division",
          body: `Developing live and interactive telemetry interfaces for R/C hot air balloons to help team about phyics and hot air balloon demonstrations`,
          images: [
            {
              url: "images/telemetry2.jpeg",
              alt: "Pregunton Surveys dashboard"
            },
          ]
        },
        {
          label: "Outbreak Simulator",
          title: "Outbreak and Infection Simulator",
          body: `A fun infection simulator with a live preview that simultaneously develops matching datasets for use with homework projects. It also makes SIR graphs and has a variety of tunable parameters all for demonstration purposes`,
          images: [
            {
              url: "images/epi.png",
              alt: "Pregunton Surveys dashboard"
            },
          ]
        },
      ]
    },
    {
      id: "websites",
      tabLabel: "Websites",
      title: "Web design is my passion",
      description: `Some websites and other stuff that I've built`,
      items: [
        {
          label: "Phoenix Rising",
          title: "The webpage for Phoenix Rising R/C Balloon Group",
          body: `body body`
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
          label: "Language Column Merger",
          title: "Merger for multiple language surveys",
          body: `A quick python script that will combine any two matching columns that have a language differentiator. It's common in REDCap to not use the language feature because of later bugs and customization issues, so often we create two separate fields that show or hide based on the language. This can be accomplished easily in R or any data language, but this is just a visual way that lets you confirm the match-ups.`
        },
        {
          label: "Dictionary Combine",
          title: "For combining the dictionary with the data",
          body: `Uses the REDCap dictionary from a project to add descriptions and generally make the REDCap data exports easier to read with options to include different components or replace different responses (some or all).`
        },
        ,
        {
          label: "Tableau Public Automatic Uplaoder",
          title: "Automatically pulls weekly redcap data and updates Tableau Public Repositories",
          body: `PythonUI script that will automatically pull the latests data from a REDCap API and then open Tableau and update 30 public dashboards for a COVID project`
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
          body: `Vectorcardiograms were the original way to read heart rhythms but they were phased out and now mostly used for specialty diagnostic tests. My grandpa originally learned to read vectorcardiograms and I made this simulator so he could explain it better. Not medically accurate.`
        },
        {
          label: "CSS Tabs",
          title: "A quick webapp for tuning the tab parameters",
          body: `I needed to adjust the tabs for this website's cards and navbars and so I wanted to experiment with them a bunch, so I made this quick website with sliders so I can adjust it and see what works and where it breaks.`
        },
        {
          label: "Hot Air Balloon Simulator",
          title: "A quick webapp for tuning the parameters on the hot air balloons on my page",
          body: `A little website to help tune the appearance of the hot air ballons for my welcome banner, but also a fun interactive website, I'm thinking about connecting tis up with a Kinect or something because the balloon museum has a similar display but it's not really aligned with the hot air balloon theme so I think it would be cool (note to self).`
        },
      ]
    }
  ]
};
