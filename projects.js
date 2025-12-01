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
      title: "Big Projects and Apps",
      description: `The Pregunton Surveys Web App is a full-stack applicaton developed in Vue3 and Firebase that allows users to create custom surveys, distribute them easily with unique codes and view the results on custom report dashboards that update live as results come in. I created these visualizations during my first year working on my Masters in Public Health at the University of New Mexico. I had some experience using Tableau to map resources for Community Health Workers to refer people to using the data from ShareNM (a community resource library).`,
      items: [
        {
          label: "Pregunton",
          title: "Pregunton Surveys Web App",
          body: `The Pregunton Surveys Web App is a full-stack applicaton developed in Vue3 and Firebase that allows users to create custom surveys, distribute them easily with unique codes and view the results on custom report dashboards that update live as results come in. I built this application because I saw a need for it while working with Community Health Workers and their organizations.`,
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
          label: "Ultra Lightweight Hot Air Balloon",
          title: "Outbreak and Infection Simulator",
          body: `A fun simulator where you can adjust parameters and `
        },
        {
          label: "Outbreak Simulator",
          title: "Outbreak and Infection Simulator",
          body: `A fun simulator where you can adjust parameters and `
        },
      ]
    },
    {
      id: "websites",
      tabLabel: "Websites",
      title: "Collection of Websites",
      description: `A collection of useful utilities and resources. Most are for processing REDCap files, some operations are quite easy to do in R or other statistical software, but wanted to make such operations more accessible. These include a script to merge columns that have been filled out in alternate languages using different column names, a script to replace data with the dictionary text replacements, and a script that manually downloads REDCap data and updates Tableau Public dashboards so they can be kept live without a premium subscription.`,
      items: [
        {
          label: "Workout Concept",
          title: "Merger for multiple language surveys",
          body: `Merger`
        },
        {
          label: "CSS Tabs",
          title: "For combining the dictionary with the data",
          body: `A fun simulator where you can adjust parameters and `
        },
        {
          label: "Phoenix Rising",
          title: "For combining the dictionary with the data",
          body: `A fun simulator where you can adjust parameters and `
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
          body: `Merger`
        },
        {
          label: "Dictionary Combine",
          title: "For combining the dictionary with the data",
          body: `A fun simulator where you can adjust parameters and `
        },
      ]
    },
    {
      id: "other",
      tabLabel: "Miscellaneous Projects",
      title: "Other Projects",
      description: `A collection of useful utilities and resources. Most are for processing REDCap files, some operations are quite easy to do in R or other statistical software, but wanted to make such operations more accessible. These include a script to merge columns that have been filled out in alternate languages using different column names, a script to replace data with the dictionary text replacements, and a script that manually downloads REDCap data and updates Tableau Public dashboards so they can be kept live without a premium subscription.`,
      items: [
        {
          label: "Workout Concept",
          title: "Merger for multiple language surveys",
          body: `Merger`
        },
        {
          label: "CSS Tabs",
          title: "For combining the dictionary with the data",
          body: `A fun simulator where you can adjust parameters and `
        },
      ]
    }
  ]
};
